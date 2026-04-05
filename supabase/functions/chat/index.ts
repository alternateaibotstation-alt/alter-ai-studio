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

// Multi-model routing configuration
const MODELS = {
  GEMINI_CHEAP: "google/gemini-2.5-flash-lite",
  GEMINI_PRO: "google/gemini-3-flash-preview",
  OPENAI_HIGH: "openai/gpt-4.1",
  OPENAI_MINI: "openai/gpt-4.1-mini",
};

const TIER_LIMITS: Record<string, { messages: number; images: number }> = {
  free: { messages: 15, images: 2 },
  pro: { messages: Infinity, images: 20 },
  power: { messages: Infinity, images: Infinity },
};

function routeRequest(prompt: string, userTier: string, taskType: 'chat' | 'content'): string {
  const isEmotional = /love|feel|sad|happy|girlfriend|boyfriend|friend|relationship|lonely/i.test(prompt);
  const isComplex = prompt.length > 1000 || /analyze|debug|solve|complex|reason/i.test(prompt);

  if (userTier === "free") return MODELS.GEMINI_CHEAP;
  
  if (userTier === "power") {
    if (isEmotional || isComplex) return MODELS.OPENAI_HIGH;
    return MODELS.OPENAI_MINI;
  }

  // Pro tier hybrid routing
  if (isEmotional) return MODELS.OPENAI_MINI;
  if (taskType === 'content') return MODELS.GEMINI_PRO;
  return MODELS.GEMINI_PRO;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { botId, messages, generateImage, taskType = 'chat' } = await req.json();
    if (!botId || !messages) {
      return new Response(JSON.stringify({ error: "botId and messages are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let userId: string | null = null;
    let userTier: string = "free";
    let userApiKey: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
          // Check for user-provided API key
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
            } catch (e) { console.error("Stripe error:", e); }
          }

          // Credit/Usage check (skip if user has their own API key)
          if (!userApiKey) {
            const { data: usageData } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: userId });
            if (usageData) {
              const limits = TIER_LIMITS[userTier];
              const lastUserMsg = messages[messages.length - 1]?.content;
              const lastUserText = typeof lastUserMsg === "string" ? lastUserMsg : "";
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
    }

    const { data: bot } = await supabaseClient.from("bots").select("*").eq("id", botId).single();
    const lastMsg = messages[messages.length - 1]?.content || "";
    const selectedModel = userApiKey ? "gpt-4o" : routeRequest(typeof lastMsg === 'string' ? lastMsg : '', userTier, taskType);

    const systemPrompt = bot?.persona || `You are ${bot?.name || 'AI'}, a helpful assistant.`;
    const apiMessages = [{ role: "system", content: systemPrompt }, ...messages];

    // Use user's key if available, otherwise platform key via gateway
    const fetchUrl = userApiKey ? "https://api.openai.com/v1/chat/completions" : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const fetchHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (userApiKey) fetchHeaders["Authorization"] = `Bearer ${userApiKey}`;
    else fetchHeaders["Authorization"] = `Bearer ${LOVABLE_API_KEY}`;

    const response = await fetch(fetchUrl, {
      method: "POST",
      headers: fetchHeaders,
      body: JSON.stringify({
        model: selectedModel,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: "AI Error", details: errText }), { status: 500, headers: corsHeaders });
    }

    return new Response(response.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
});
