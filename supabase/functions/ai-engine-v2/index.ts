import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { ACTION_CREDIT_COST, CREDIT_COST_USD, PRODUCT_TO_PLAN, getActionCreditCost, getPlanLimits, normalizeUsageType, usedCreditsFromUsage } from "../_shared/billing-safety.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type BillableAction = "chat_message" | "image_generation" | "video_generation" | "content_generation" | "bot_execution" | "api_call" | "ad_campaign";
type ChatRole = "system" | "user" | "assistant";

interface AIRequest {
  prompt?: string;
  model?: string;
  action?: BillableAction;
  systemPrompt?: string;
  metadata?: Record<string, unknown>;
  botId?: string;
  messages?: Array<{ role: ChatRole | string; content: string }>;
  taskType?: "chat" | "content" | "analysis" | "generation";
  context?: Record<string, unknown>;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
  stream?: boolean;
}

const MODEL_BY_COMPLEXITY = {
  low: "google/gemini-2.5-flash-lite",
  medium: "google/gemini-2.5-flash",
  high: "google/gemini-3-flash-preview",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function inferAction(request: AIRequest): BillableAction {
  if (request.action) return request.action;
  if (request.taskType === "content" || request.taskType === "generation") return "content_generation";
  if (request.botId) return "bot_execution";
  return "chat_message";
}

function analyzeComplexity(text: string): "low" | "medium" | "high" {
  const hasComplexKeywords = /analyze|debug|solve|reason|complex|algorithm|strategy|architecture/i.test(text);
  if (text.length > 1200 || hasComplexKeywords) return "high";
  if (text.length > 350) return "medium";
  return "low";
}

async function authenticateUser(supabaseClient: any, req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Authentication required");

  const token = authHeader.replace("Bearer ", "");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!token || token === anonKey) throw new Error("Authentication required");

  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) throw new Error("Authentication required");
  return data.user;
}

async function getPlan(supabaseClient: any, userId: string): Promise<string> {
  const { data } = await supabaseClient
    .from("subscriptions")
    .select("product_id,status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  return PRODUCT_TO_PLAN[data?.product_id] || "free";
}

async function getCurrentUsage(supabaseClient: any, userId: string) {
  const { data, error } = await supabaseClient.rpc("get_or_reset_usage", { p_user_id: userId });
  if (error) throw error;
  return data;
}

async function assertAndDeductCredits(supabaseClient: any, userId: string, action: BillableAction) {
  const creditsRequired = getActionCreditCost(action);
  const usage = await getCurrentUsage(supabaseClient, userId);
  const plan = await getPlan(supabaseClient, userId);
  const limits = getPlanLimits(plan);
  const balance = Math.max(0, limits.dailyCredits - usedCreditsFromUsage(usage));

  if (balance < creditsRequired) {
    return { allowed: false, plan, creditsRequired, balance, reason: "INSUFFICIENT_CREDITS", profitability: limits };
  }

  const usageType = normalizeUsageType(action);
  const unitsToRecord = usageType === "image" ? Math.ceil(creditsRequired / ACTION_CREDIT_COST.image_generation) : creditsRequired;
  for (let i = 0; i < unitsToRecord; i++) {
    const { error } = await supabaseClient.rpc("increment_usage", { p_user_id: userId, p_type: usageType });
    if (error) throw error;
  }

  return { allowed: true, plan, creditsRequired, balance: balance - creditsRequired, reason: null, profitability: limits };
}

async function logAIRequest(supabaseClient: any, payload: Record<string, unknown>) {
  try {
    await supabaseClient.from("ai_requests").insert(payload);
  } catch (error) {
    console.warn("AI request audit insert skipped", error);
  }
}

async function resolveMessages(supabaseClient: any, request: AIRequest) {
  const action = inferAction(request);
  const prompt = String(request.prompt || request.messages?.at(-1)?.content || "").trim();
  if (!prompt && !request.messages?.length) throw new Error("prompt or messages are required");

  let systemPrompt = request.systemPrompt || "You are Alterai.im, a helpful, brand-safe AI assistant for creator workflows.";

  if (request.botId) {
    const { data: bot } = await supabaseClient.from("bots").select("id,name,persona").eq("id", request.botId).single();
    if (!bot) throw new Error("Bot not found");
    systemPrompt = bot.persona || `You are ${bot.name}, a helpful assistant.`;
  }

  if (request.context && Object.keys(request.context).length > 0) {
    systemPrompt += "\n\nContext:\n";
    for (const [key, value] of Object.entries(request.context)) {
      systemPrompt += `${key}: ${JSON.stringify(value)}\n`;
    }
  }

  const messages = request.messages?.length
    ? [{ role: "system" as ChatRole, content: systemPrompt }, ...request.messages.map((msg) => ({ role: msg.role as ChatRole, content: msg.content }))]
    : [
        { role: "system" as ChatRole, content: systemPrompt },
        { role: "user" as ChatRole, content: prompt },
      ];

  return { action, prompt, messages };
}

async function callAIModel(request: AIRequest, messages: Array<{ role: ChatRole; content: string }>, stream: boolean) {
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) throw new Error("AI gateway is not configured");

  const prompt = messages.map((message) => message.content).join("\n");
  const complexity = analyzeComplexity(prompt);
  const model = request.model || MODEL_BY_COMPLEXITY[complexity];

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream,
      temperature: request.parameters?.temperature ?? 0.7,
      max_tokens: request.parameters?.maxTokens ?? 2048,
      top_p: request.parameters?.topP ?? 0.9,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`AI gateway error: ${response.status} ${details}`);
  }

  return { response, model };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const user = await authenticateUser(supabaseClient, req);
    const requestData: AIRequest = await req.json();
    const { action, prompt, messages } = await resolveMessages(supabaseClient, requestData);
    const creditState = await assertAndDeductCredits(supabaseClient, user.id, action);

    if (!creditState.allowed) {
      return jsonResponse({ error: creditState.reason, result: creditState }, 403);
    }

    const shouldStream = requestData.stream === true || Boolean(requestData.botId && requestData.messages?.length && !requestData.prompt);
    await logAIRequest(supabaseClient, {
      user_id: user.id,
      bot_id: requestData.botId || null,
      task_type: action,
      tier: creditState.plan,
      credits_used: creditState.creditsRequired,
      metadata: { promptLength: prompt.length, ...requestData.metadata },
      created_at: new Date().toISOString(),
    });

    const { response, model } = await callAIModel(requestData, messages, shouldStream);

    if (shouldStream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const data = await response.json();
    const output = data?.choices?.[0]?.message?.content ?? data?.output ?? data?.content ?? "";

    return jsonResponse({
      output,
      content: output,
      model,
      creditsUsed: creditState.creditsRequired,
      balance: creditState.balance,
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("Error in AI engine:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message.includes("Authentication required") ? 401 : message.includes("required") || message.includes("not found") ? 400 : 500;
    return jsonResponse({ error: message }, status);
  }
});
