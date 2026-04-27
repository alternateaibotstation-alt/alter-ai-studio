import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { CREDIT_COST_USD, PRODUCT_TO_PLAN, getActionCreditCost, getPlanLimits, normalizeUsageType, usedCreditsFromUsage } from "../_shared/billing-safety.ts";

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

/**
 * Record usage
 */
async function recordUsage(
  supabaseClient: any,
  userId: string,
  resourceType: string,
  amount: number
): Promise<any> {
  const creditsRequired = getActionCreditCost(resourceType, amount);
  const precheck = await checkAction(supabaseClient, userId, resourceType, creditsRequired);
  if (!precheck.allowed) return { ...precheck, recorded: false };

  const cost = creditsRequired * CREDIT_COST_USD;
  const usageType = normalizeUsageType(resourceType);
  const unitsToRecord = usageType === 'image' ? Math.ceil(creditsRequired / getActionCreditCost('image_generation')) : creditsRequired;

  for (let i = 0; i < Math.max(1, unitsToRecord); i++) {
    const { error } = await supabaseClient.rpc('increment_usage', {
      p_user_id: userId,
      p_type: usageType,
    });
    if (error) throw error;
  }

  const usage = await getCurrentUsage(supabaseClient, userId);
  const plan = await getPlan(supabaseClient, userId);
  const limits = getPlanLimits(plan);

  return {
    resourceType,
    amount: creditsRequired,
    cost,
    credits: {
      usedToday: usedCreditsFromUsage(usage),
      balance: Math.max(0, limits.dailyCredits - usedCreditsFromUsage(usage)),
      dailyLimit: limits.dailyCredits,
      monthlyLimit: limits.monthlyCredits,
    },
    profitability: limits,
    recorded: true,
  };
}

/**
 * Get usage stats
 */
async function getUsageStats(supabaseClient: any, userId: string): Promise<any> {
  const usage = await getCurrentUsage(supabaseClient, userId);
  const tier = await getPlan(supabaseClient, userId);
  const limits = getPlanLimits(tier);
  const usedToday = usedCreditsFromUsage(usage);

  return {
    tier,
    credits: {
      balance: Math.max(0, limits.dailyCredits - usedToday),
      usedToday,
      dailyLimit: limits.dailyCredits,
      monthlyLimit: limits.monthlyCredits,
    },
    monthlyUsage: {
      credits: usedToday,
      cost: usedToday * CREDIT_COST_USD,
    },
    dailyUsage: {
      credits: usedToday,
      cost: usedToday * CREDIT_COST_USD,
    },
    profitability: limits,
    percentageUsed: Math.min(100, Math.round((usedToday / Math.max(1, limits.dailyCredits)) * 100)),
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
  const creditsRequired = getActionCreditCost(resourceType, amount);
  const usage = await getCurrentUsage(supabaseClient, userId);
  const plan = await getPlan(supabaseClient, userId);
  const limits = getPlanLimits(plan);
  const usedToday = usedCreditsFromUsage(usage);
  const balance = Math.max(0, limits.dailyCredits - usedToday);
  const allowed = balance >= creditsRequired;

  return {
    allowed,
    creditsRequired,
    balance,
    plan,
    profitability: limits,
    reason: allowed ? null : 'INSUFFICIENT_CREDITS',
  };
}

/**
 * Get cost breakdown
 */
async function getCostBreakdown(supabaseClient: any, userId: string): Promise<any> {
  const usage = await getCurrentUsage(supabaseClient, userId);
  const breakdown: Record<string, number> = {};
  breakdown.chat_message = (usage?.messages_used_today || 0) * CREDIT_COST_USD;
  breakdown.image_generation = (usage?.images_used_today || 0) * getActionCreditCost('image_generation') * CREDIT_COST_USD;

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
