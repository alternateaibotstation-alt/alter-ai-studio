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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userTier = "free";
    let userId: string | null = null;
    let userApiKey: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
          
          // Check for user-provided OpenAI API key
          const { data: profile } = await supabaseClient.from('profiles').select('openai_api_key').eq('id', userId).maybeSingle();
          if (profile?.openai_api_key) userApiKey = profile.openai_api_key;

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
            } catch (e) { console.error("Stripe check error:", e); }
          }

          // Credit check (skip if user has their own API key)
          if (!userApiKey) {
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
    }

    // Model routing for image generation
    // If user has their own key, we use dall-e-3
    // Otherwise, we use Gemini for cost efficiency
    const selectedModel = userApiKey ? "dall-e-3" : (userTier === "free" ? "google/gemini-2.5-flash-image" : (model || "google/gemini-2.5-flash-image"));

    const userContent: any[] = [{ type: "text", text: prompt }];
    if (editImageUrl) {
      userContent.push({ type: "image_url", image_url: { url: editImageUrl } });
    }

    const fetchUrl = userApiKey ? "https://api.openai.com/v1/images/generations" : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (userApiKey) fetchHeaders["Authorization"] = `Bearer ${userApiKey}`;
    else fetchHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;

    const body = userApiKey ? {
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
    } : {
      model: selectedModel,
      messages: [
        { role: "system", content: "You are an expert AI artist. Generate high quality, creative images based on the user's description." },
        { role: "user", content: userContent },
      ],
      modalities: ["image", "text"],
    };

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "Image Generation Error", details: errText }), { status: 500, headers: corsHeaders });
    }

    const data = await response.json();
    
    // Normalize OpenAI response format to match Lovable's for the frontend
    if (userApiKey) {
      const normalizedData = {
        choices: [{
          message: {
            images: [{
              image_url: { url: data.data[0].url }
            }]
          }
        }]
      };
      return new Response(JSON.stringify(normalizedData), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
