import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model configuration with costs and capabilities
const MODELS = {
  "gpt-4-turbo": {
    provider: "openai",
    cost: 0.03,
    latency: "high",
    quality: "highest",
    capabilities: ["reasoning", "analysis", "complex"],
  },
  "gpt-4-mini": {
    provider: "openai",
    cost: 0.015,
    latency: "medium",
    quality: "high",
    capabilities: ["general", "content", "chat"],
  },
  "gemini-3-flash": {
    provider: "google",
    cost: 0.01,
    latency: "low",
    quality: "good",
    capabilities: ["fast", "general", "content"],
  },
  "gemini-2-flash-lite": {
    provider: "google",
    cost: 0.005,
    latency: "very-low",
    quality: "fair",
    capabilities: ["quick", "simple"],
  },
  "claude-3-opus": {
    provider: "anthropic",
    cost: 0.025,
    latency: "high",
    quality: "highest",
    capabilities: ["reasoning", "analysis", "nuanced"],
  },
};

interface AIRequest {
  botId: string;
  messages: Array<{ role: string; content: string }>;
  taskType?: "chat" | "content" | "analysis" | "generation";
  context?: Record<string, any>;
  generateImage?: boolean;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

/**
 * Analyze request complexity
 */
function analyzeComplexity(
  messages: Array<{ role: string; content: string }>
): "low" | "medium" | "high" {
  const lastMessage = messages[messages.length - 1]?.content || "";
  const messageLength = lastMessage.length;
  const hasComplexKeywords = /analyze|debug|solve|reason|complex|algorithm/i.test(
    lastMessage
  );

  if (messageLength > 1000 || hasComplexKeywords) {
    return "high";
  }
  if (messageLength > 300) {
    return "medium";
  }
  return "low";
}

/**
 * Route request to appropriate model based on tier and complexity
 */
function routeModel(
  userTier: string,
  complexity: "low" | "medium" | "high",
  taskType: string
): string {
  if (userTier === "power") {
    if (complexity === "high") return "gpt-4-turbo";
    if (complexity === "medium") return "gpt-4-mini";
    return "gemini-3-flash";
  }

  if (userTier === "pro") {
    if (complexity === "high") return "gpt-4-mini";
    if (complexity === "medium") return "gemini-3-flash";
    return "gemini-2-flash-lite";
  }

  // Free tier
  if (complexity === "high") return "gemini-3-flash";
  return "gemini-2-flash-lite";
}

/**
 * Call AI model with streaming support
 */
async function callAIModel(
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<ReadableStream<Uint8Array>> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  const fetchUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
  };

  const body = JSON.stringify({
    model,
    messages,
    stream: true,
    temperature: parameters?.temperature || 0.7,
    max_tokens: parameters?.maxTokens || 2048,
    top_p: parameters?.topP || 0.9,
  });

  const response = await fetch(fetchUrl, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  return response.body!;
}

/**
 * Get user tier from Stripe subscription
 */
async function getUserTier(
  supabaseClient: any,
  userId: string,
  userEmail: string
): Promise<string> {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return "free";

    const { default: Stripe } = await import("https://esm.sh/stripe@18.5.0");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) return "free";

    const subs = await stripe.subscriptions.list({
      customer: customers.data[0].id,
      status: "active",
      limit: 1,
    });

    if (subs.data.length === 0) return "free";

    const productId = subs.data[0].items.data[0].price.product;
    if (productId === "prod_UBEJiRN7lDcB4u") return "power";
    if (productId === "prod_UBEIVHEtYoy7QP") return "pro";

    return "free";
  } catch (error) {
    console.error("Error fetching user tier:", error);
    return "free";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: AIRequest = await req.json();
    const { botId, messages, taskType = "chat", context, parameters } =
      requestData;

    if (!botId || !messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "botId and messages are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user info from auth header
    let userId: string | null = null;
    let userTier = "free";
    let userEmail: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
          userEmail = userData.user.email;

          // Get user tier
          userTier = await getUserTier(supabaseClient, userId, userEmail!);

          // Log request for usage tracking
          await supabaseClient.from("ai_requests").insert({
            user_id: userId,
            bot_id: botId,
            task_type: taskType,
            tier: userTier,
            created_at: new Date().toISOString(),
          });
        }
      }
    }

    // Get bot persona
    const { data: bot } = await supabaseClient
      .from("bots")
      .select("*")
      .eq("id", botId)
      .single();

    if (!bot) {
      return new Response(JSON.stringify({ error: "Bot not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Analyze complexity and route model
    const complexity = analyzeComplexity(messages);
    const selectedModel = routeModel(userTier, complexity, taskType);

    // Build system prompt with context injection
    let systemPrompt = bot.persona || `You are ${bot.name}, a helpful assistant.`;

    if (context && Object.keys(context).length > 0) {
      systemPrompt += "\n\n## Context Information\n";
      Object.entries(context).forEach(([key, value]) => {
        systemPrompt += `${key}: ${JSON.stringify(value)}\n`;
      });
    }

    // Prepare messages
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
    ];

    // Call AI model
    const stream = await callAIModel(selectedModel, apiMessages, parameters);

    // Return streaming response
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Error in AI engine:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
