export type SaaSPlan = "free" | "starter" | "creator" | "pro" | "studio";
export type BillableAction = "chat_message" | "image_generation" | "video_generation" | "content_generation" | "bot_execution" | "api_call";

export interface PlanEconomics {
  id: SaaSPlan;
  monthlyPriceUsd: number;
  advertisedMonthlyCredits: number;
  advertisedDailyCredits: number;
  fixedMonthlyCostUsd: number;
}

export const CREDIT_COST_USD = 0.001;
export const MIN_PROFIT_MARGIN = 0.35;
export const PAYMENT_FEE_RATE = 0.059;
export const PAYMENT_FIXED_FEE_USD = 0.3;
export const FREE_PLAN_MAX_MONTHLY_AI_COST_USD = 0.15;

export const ACTION_CREDIT_COST: Record<BillableAction, number> = {
  chat_message: 1,
  api_call: 1,
  bot_execution: 2,
  content_generation: 3,
  image_generation: 8,
  video_generation: 30,
};

export const PLAN_ECONOMICS: Record<SaaSPlan, PlanEconomics> = {
  free: { id: "free", monthlyPriceUsd: 0, advertisedMonthlyCredits: 150, advertisedDailyCredits: 5, fixedMonthlyCostUsd: 0 },
  starter: { id: "starter", monthlyPriceUsd: 9, advertisedMonthlyCredits: 1200, advertisedDailyCredits: 40, fixedMonthlyCostUsd: 0.75 },
  creator: { id: "creator", monthlyPriceUsd: 19, advertisedMonthlyCredits: 3500, advertisedDailyCredits: 140, fixedMonthlyCostUsd: 1.25 },
  pro: { id: "pro", monthlyPriceUsd: 49, advertisedMonthlyCredits: 10000, advertisedDailyCredits: 400, fixedMonthlyCostUsd: 2.5 },
  studio: { id: "studio", monthlyPriceUsd: 149, advertisedMonthlyCredits: 40000, advertisedDailyCredits: 1600, fixedMonthlyCostUsd: 8 },
};

export const PRODUCT_TO_PLAN: Record<string, SaaSPlan> = {
  prod_UBEIVHEtYoy7QP: "creator",
  prod_UBEJiRN7lDcB4u: "studio",
};

export function getActionCreditCost(action: string, quantity = 1): number {
  const base = ACTION_CREDIT_COST[action as BillableAction] ?? ACTION_CREDIT_COST.api_call;
  return Math.max(1, Math.ceil(base * quantity));
}

export function getSafeMonthlyCredits(planId: string): number {
  const plan = PLAN_ECONOMICS[(planId as SaaSPlan) || "free"] ?? PLAN_ECONOMICS.free;
  if (plan.id === "free") {
    return Math.min(plan.advertisedMonthlyCredits, Math.floor(FREE_PLAN_MAX_MONTHLY_AI_COST_USD / CREDIT_COST_USD));
  }

  const paymentFees = plan.monthlyPriceUsd * PAYMENT_FEE_RATE + PAYMENT_FIXED_FEE_USD;
  const safeAiBudget = Math.max(0, (plan.monthlyPriceUsd - paymentFees - plan.fixedMonthlyCostUsd) * (1 - MIN_PROFIT_MARGIN));
  return Math.min(plan.advertisedMonthlyCredits, Math.floor(safeAiBudget / CREDIT_COST_USD));
}

export function getSafeDailyCredits(planId: string): number {
  const plan = PLAN_ECONOMICS[(planId as SaaSPlan) || "free"] ?? PLAN_ECONOMICS.free;
  return Math.max(1, Math.min(plan.advertisedDailyCredits, Math.floor(getSafeMonthlyCredits(plan.id) / 30)));
}

export function getPlanLimits(planId: string) {
  const plan = PLAN_ECONOMICS[(planId as SaaSPlan) || "free"] ?? PLAN_ECONOMICS.free;
  return {
    plan: plan.id,
    dailyCredits: getSafeDailyCredits(plan.id),
    monthlyCredits: getSafeMonthlyCredits(plan.id),
    advertisedDailyCredits: plan.advertisedDailyCredits,
    advertisedMonthlyCredits: plan.advertisedMonthlyCredits,
    minimumProfitMargin: MIN_PROFIT_MARGIN,
  };
}

export function normalizeUsageType(action: string): "message" | "image" {
  return action === "image_generation" || action === "video_generation" ? "image" : "message";
}

export function usedCreditsFromUsage(usage: any): number {
  return Number(usage?.messages_used_today || 0) + Number(usage?.images_used_today || 0) * ACTION_CREDIT_COST.image_generation;
}
