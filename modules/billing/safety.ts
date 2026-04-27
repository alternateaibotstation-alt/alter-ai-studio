import { ACTION_CREDIT_COST, CREDIT_VALUE_USD, MINIMUM_PROFIT_MARGIN, SAAS_PLANS, type BillableAction, type SaaSPlan } from "./plans";

const PAYMENT_FEE_RATE = 0.059;
const PAYMENT_FIXED_FEE_USD = 0.3;
const FREE_PLAN_MAX_MONTHLY_AI_COST_USD = 0.15;

const FIXED_MONTHLY_COST_USD: Record<SaaSPlan, number> = {
  free: 0,
  starter: 0.75,
  creator: 1.25,
  pro: 2.5,
  studio: 8,
};

export function getSafeMonthlyCredits(planId: SaaSPlan): number {
  const plan = SAAS_PLANS[planId] ?? SAAS_PLANS.free;
  if (plan.id === "free") {
    return Math.min(plan.monthlyCredits, Math.floor(FREE_PLAN_MAX_MONTHLY_AI_COST_USD / CREDIT_VALUE_USD));
  }

  const paymentFees = plan.monthlyPrice * PAYMENT_FEE_RATE + PAYMENT_FIXED_FEE_USD;
  const safeAiBudget = Math.max(0, (plan.monthlyPrice - paymentFees - FIXED_MONTHLY_COST_USD[plan.id]) * (1 - MINIMUM_PROFIT_MARGIN));
  return Math.min(plan.monthlyCredits, Math.floor(safeAiBudget / CREDIT_VALUE_USD));
}

export function getSafeDailyCredits(planId: SaaSPlan): number {
  const plan = SAAS_PLANS[planId] ?? SAAS_PLANS.free;
  return Math.max(1, Math.min(plan.dailyCredits, Math.floor(getSafeMonthlyCredits(plan.id) / 30)));
}

export function getBillingSafetySummary(planId: SaaSPlan) {
  const plan = SAAS_PLANS[planId] ?? SAAS_PLANS.free;
  return {
    plan: plan.id,
    safeDailyCredits: getSafeDailyCredits(plan.id),
    safeMonthlyCredits: getSafeMonthlyCredits(plan.id),
    advertisedDailyCredits: plan.dailyCredits,
    advertisedMonthlyCredits: plan.monthlyCredits,
    minimumProfitMargin: MINIMUM_PROFIT_MARGIN,
  };
}

export function getEstimatedActionCostUsd(action: BillableAction, quantity = 1) {
  return Math.max(1, Math.ceil((ACTION_CREDIT_COST[action] ?? ACTION_CREDIT_COST.api_call) * quantity)) * CREDIT_VALUE_USD;
}