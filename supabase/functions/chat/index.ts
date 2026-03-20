import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const IMAGE_GEN_KEYWORDS = [
  "generate an image", "create an image", "draw", "make an image",
  "generate a picture", "create a picture", "make a picture",
  "generate art", "create art", "make art",
  "paint", "illustrate", "sketch", "design an image",
  "generate a photo", "create a photo",
];

function isImageRequest(content: string): boolean {
  const lower = content.toLowerCase();
  return IMAGE_GEN_KEYWORDS.some((kw) => lower.includes(kw));
}

// Tier-based model routing
const TIER_MODELS: Record<string, string> = {
  free: "google/gemini-2.5-flash-lite",
  pro: "google/gemini-3-flash-preview",
  power: "google/gemini-2.5-pro",
};

const TIER_LIMITS: Record<string, { messages: number; images: number }> = {
  free: { messages: 15, images: 2 },
  pro: { messages: Infinity, images: 20 },
  power: { messages: Infinity, images: Infinity },
};

// Rate limiting: max 10 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botId, messages, generateImage } = await req.json();
    if (!botId || !messages) {
      return new Response(JSON.stringify({ error: "botId and messages are required" }), {
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

    // Get user from auth header
    let userId: string | null = null;
    let userTier: string = "free";
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      // Skip if it's just the anon key
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;

          // Rate limit check
          if (!checkRateLimit(userId)) {
            return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          // Check subscription tier via Stripe
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

          // Check usage limits
          const { data: usageData } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: userId });
          if (usageData) {
            const limits = TIER_LIMITS[userTier];
            const lastUserMsg = messages[messages.length - 1]?.content;
            const lastUserText = typeof lastUserMsg === "string" ? lastUserMsg :
              Array.isArray(lastUserMsg) ? lastUserMsg.find((p: any) => p.type === "text")?.text || "" : "";
            const isImgReq = generateImage || isImageRequest(lastUserText);

            if (isImgReq) {
              if (limits.images !== Infinity && usageData.images_used_today >= limits.images) {
                return new Response(JSON.stringify({ error: "LIMIT_IMAGES", tier: userTier }), {
                  status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
              await supabaseClient.rpc("increment_usage", { p_user_id: userId, p_type: "image" });
            } else {
              const totalAllowed = limits.messages === Infinity ? Infinity : limits.messages + (usageData.bonus_messages || 0);
              if (totalAllowed !== Infinity && usageData.messages_used_today >= totalAllowed) {
                return new Response(JSON.stringify({ error: "LIMIT_MESSAGES", tier: userTier }), {
                  status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
              }
              await supabaseClient.rpc("increment_usage", { p_user_id: userId, p_type: "message" });
            }
          }
        }
      }
    }

    const { data: bot, error: botError } = await supabaseClient
      .from("bots")
      .select("name, persona, model, messages_count")
      .eq("id", botId)
      .single();

    if (botError || !bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Override model based on tier
    const tierModel = TIER_MODELS[userTier] || "google/gemini-2.5-flash-lite";
    
    const systemPrompt = bot.persona || `You are ${bot.name}, a helpful AI assistant. Be conversational, helpful, and engaging.`;

    // Free tier: shorter responses
    const responseControl = userTier === "free"
      ? "\n\nIMPORTANT: Keep your responses concise and under 200 words. Be helpful but brief."
      : "";

    const lastUserMsg = messages[messages.length - 1]?.content;
    const lastUserText = typeof lastUserMsg === "string" ? lastUserMsg :
      Array.isArray(lastUserMsg) ? lastUserMsg.find((p: any) => p.type === "text")?.text || "" : "";

    const shouldGenerateImage = generateImage || isImageRequest(lastUserText);

    // ── Image Generation Mode ──
    if (shouldGenerateImage) {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "system", content: `You are ${bot.name}, an AI artist. Generate the requested image.` },
            ...messages,
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!imageResponse.ok) {
        if (imageResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (imageResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await imageResponse.text();
        console.error("Image gen error:", imageResponse.status, t);
        return new Response(JSON.stringify({ error: "Image generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imageData = await imageResponse.json();
      supabaseClient.from("bots").update({ messages_count: (bot.messages_count || 0) + 1 }).eq("id", botId);
      return new Response(JSON.stringify({ type: "image", data: imageData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Standard Chat Streaming Mode ──
    const apiMessages = [
      { role: "system", content: systemPrompt + responseControl + "\n\nYou can analyze images and files that users share with you." },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: tierModel,
        messages: apiMessages,
        stream: true,
        ...(userTier === "free" ? { max_tokens: 500 } : {}),
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    supabaseClient.from("bots").update({ messages_count: (bot.messages_count || 0) + 1 }).eq("id", botId);

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
