import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TIER_LIMITS: Record<string, number> = {
  free: 2,
  pro: 20,
  power: Infinity,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, model, editImageUrl } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check user usage limits
    let userTier = "free";
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          const userId = userData.user.id;

          // Check tier
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKey && userData.user.email) {
            try {
              const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
              const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
              const customers = await stripe.customers.list({ email: userData.user.email, limit: 1 });
              if (customers.data.length > 0) {
                const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
                if (subs.data.length > 0) {
                  const productId = subs.data[0].items.data[0].price.product;
                  if (productId === "prod_UBEJiRN7lDcB4u") userTier = "power";
                  else if (productId === "prod_UBEIVHEtYoy7QP") userTier = "pro";
                }
              }
            } catch (e) {
              console.error("Stripe check error:", e);
            }
          }

          // Check image usage
          const { data: usageData } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: userId });
          if (usageData) {
            const limit = TIER_LIMITS[userTier];
            if (limit !== Infinity && usageData.images_used_today >= limit) {
              return new Response(JSON.stringify({ error: "LIMIT_IMAGES", tier: userTier }), {
                status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            await supabaseClient.rpc("increment_usage", { p_user_id: userId, p_type: "image" });
          }
        }
      }
    }

    // Free users can only use the cheapest image model
    const selectedModel = userTier === "free" ? "google/gemini-2.5-flash-image" : (model || "google/gemini-2.5-flash-image");

    const userContent: any[] = [{ type: "text", text: prompt }];
    if (editImageUrl) {
      userContent.push({ type: "image_url", image_url: { url: editImageUrl } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: "You are an expert AI artist. Generate high quality, creative images based on the user's description." },
          { role: "user", content: userContent },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("Image gen error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
