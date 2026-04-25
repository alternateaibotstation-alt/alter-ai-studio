import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UsageRequest {
  action: 'record' | 'stats' | 'check' | 'breakdown';
  resourceType?: string;
  amount?: number;
}

const COST_CONFIG: Record<string, number> = {
  messages: 0.0001,
  chat_message: 0.0001,
  content_generation: 0.0003,
  bot_execution: 0.0002,
  image_generation: 0.001,
  video_generation: 0.01,
  images: 0.001,
  videos: 0.01,
  audio: 0.0005,
  tokens: 0.000001,
  api_calls: 0.00001,
  api_call: 0.00001,
};

const PLAN_LIMITS: Record<string, { dailyCredits: number; monthlyCredits: number }> = {
  free: { dailyCredits: 15, monthlyCredits: 150 },
  starter: { dailyCredits: 40, monthlyCredits: 1200 },
  creator: { dailyCredits: 140, monthlyCredits: 3500 },
  pro: { dailyCredits: 400, monthlyCredits: 10000 },
  studio: { dailyCredits: 1600, monthlyCredits: 40000 },
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_UBEIVHEtYoy7QP: 'creator',
  prod_UBEJiRN7lDcB4u: 'studio',
};

function normalizeResource(resourceType: string): 'message' | 'image' {
  return ['images', 'image_generation'].includes(resourceType) ? 'image' : 'message';
}

async function getPlan(supabaseClient: any, userId: string): Promise<string> {
  const { data } = await supabaseClient
    .from('subscriptions')
    .select('product_id,status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return PRODUCT_TO_PLAN[data?.product_id] || 'free';
}

async function getCurrentUsage(supabaseClient: any, userId: string): Promise<any> {
  const { data, error } = await supabaseClient.rpc('get_or_reset_usage', { p_user_id: userId });
  if (error) throw error;
  return data;
}

function usedCreditsFromUsage(usage: any): number {
  return Number(usage?.messages_used_today || 0) + Number(usage?.images_used_today || 0) * 8;
}

/**
 * Record usage
 */
async function recordUsage(
  supabaseClient: any,
  userId: string,
  resourceType: string,
  amount: number
): Promise<any> {
  const cost = (COST_CONFIG[resourceType] || 0) * amount;
  const usageType = normalizeResource(resourceType);

  for (let i = 0; i < Math.max(1, amount); i++) {
    const { error } = await supabaseClient.rpc('increment_usage', {
      p_user_id: userId,
      p_type: usageType,
    });
    if (error) throw error;
  }

  const usage = await getCurrentUsage(supabaseClient, userId);
  const plan = await getPlan(supabaseClient, userId);
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

  return {
    resourceType,
    amount,
    cost,
    credits: {
      usedToday: usedCreditsFromUsage(usage),
      balance: Math.max(0, limits.dailyCredits - usedCreditsFromUsage(usage)),
      dailyLimit: limits.dailyCredits,
    },
    recorded: true,
  };
}

/**
 * Get usage stats
 */
async function getUsageStats(supabaseClient: any, userId: string): Promise<any> {
  const { data, error } = await supabaseClient
    .rpc('get_user_usage_stats', { p_user_id: userId })
    .single();

  if (error) throw error;

  return {
    tier: data.tier,
    monthlyUsage: {
      tokens: data.monthly_tokens,
      cost: data.monthly_cost,
    },
    dailyUsage: {
      tokens: data.daily_tokens,
      cost: data.daily_cost,
    },
    percentageUsed: data.percentage_used,
  };
}

/**
 * Check if action is allowed
 */
async function checkAction(
  supabaseClient: any,
  userId: string,
  resourceType: string,
  amount: number = 1
): Promise<any> {
  const { data, error } = await supabaseClient
    .rpc('can_perform_action', {
      p_user_id: userId,
      p_resource_type: resourceType,
      p_amount: amount,
    })
    .single();

  if (error) throw error;

  return {
    allowed: data.allowed,
    reason: data.reason,
  };
}

/**
 * Get cost breakdown
 */
async function getCostBreakdown(supabaseClient: any, userId: string): Promise<any> {
  const { data: summaryData, error: summaryError } = await supabaseClient
    .from('usage_summary')
    .select('*')
    .eq('user_id', userId)
    .eq('date', new Date().toISOString().split('T')[0])
    .single();

  if (summaryError && summaryError.code !== 'PGRST116') throw summaryError;

  const breakdown: Record<string, number> = {};

  if (summaryData) {
    breakdown.messages = (summaryData.messages_used || 0) * COST_CONFIG.messages;
    breakdown.images = (summaryData.images_used || 0) * COST_CONFIG.images;
    breakdown.videos = (summaryData.videos_used || 0) * COST_CONFIG.videos;
    breakdown.audio = (summaryData.audio_used || 0) * COST_CONFIG.audio;
    breakdown.tokens = (summaryData.tokens_used || 0) * COST_CONFIG.tokens;
    breakdown.api_calls = (summaryData.api_calls || 0) * COST_CONFIG.api_calls;
  }

  const totalCost = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    breakdown,
    totalCost,
    date: new Date().toISOString().split('T')[0],
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: UsageRequest = await req.json();
    const { action, resourceType, amount } = requestData;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Extract user ID
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

      if (token !== anonKey) {
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          userId = userData.user.id;
        }
      }
    }

    if (!userId) {
      throw new Error("Authentication required");
    }

    let result: any;

    switch (action) {
      case 'record':
        if (!resourceType || !amount) {
          throw new Error("resourceType and amount are required");
        }
        result = await recordUsage(supabaseClient, userId, resourceType, amount);
        break;

      case 'stats':
        result = await getUsageStats(supabaseClient, userId);
        break;

      case 'check':
        if (!resourceType) {
          throw new Error("resourceType is required");
        }
        result = await checkAction(supabaseClient, userId, resourceType, amount || 1);
        break;

      case 'breakdown':
        result = await getCostBreakdown(supabaseClient, userId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in usage tracking:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
