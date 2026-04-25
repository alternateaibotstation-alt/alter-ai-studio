export type SaaSPlan = "free" | "starter" | "creator" | "pro" | "studio";
export type BillableAction = "chat_message" | "image_generation" | "video_generation" | "content_generation" | "bot_execution" | "api_call";

export interface PlanDefinition {
  id: SaaSPlan;
  name: string;
  monthlyPrice: number;
  monthlyCredits: number;
  dailyCredits: number;
  audience: string;
  features: string[];
  stripePriceId?: string;
  stripeProductId?: string;
}

export const CREDIT_VALUE_USD = 0.001;
export const MINIMUM_PROFIT_MARGIN = 0.18;

export const ACTION_CREDIT_COST: Record<BillableAction, number> = {
  chat_message: 1,
  content_generation: 3,
  bot_execution: 2,
  image_generation: 8,
  video_generation: 30,
  api_call: 1,
};

export const SAAS_PLANS: Record<SaaSPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    monthlyCredits: 150,
    dailyCredits: 5,
    audience: "Testing the platform",
    features: ["5 daily credits", "Basic generators", "Community templates"],
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 9,
    monthlyCredits: 1200,
    dailyCredits: 40,
    audience: "Solo creators getting started",
    features: ["1,200 credits/month", "Content generators", "Basic bot builder"],
  },
  creator: {
    id: "creator",
    name: "Creator",
    monthlyPrice: 19,
    monthlyCredits: 3500,
    dailyCredits: 140,
    audience: "Main conversion plan for creators",
    features: ["3,500 credits/month", "All content tools", "Advanced bot builder", "Usage history"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 49,
    monthlyCredits: 10000,
    dailyCredits: 400,
    audience: "High-volume users",
    features: ["10,000 credits/month", "Priority generation", "Revenue analytics", "Premium models"],
    stripePriceId: "price_1TCrq74NFqfF77IyKyIACANQ",
    stripeProductId: "prod_UBEIVHEtYoy7QP",
  },
  studio: {
    id: "studio",
    name: "Studio",
    monthlyPrice: 149,
    monthlyCredits: 40000,
    dailyCredits: 1600,
    audience: "Teams and API access",
    features: ["40,000 credits/month", "Team workflows", "API access", "Advanced analytics"],
    stripePriceId: "price_1TCrqY4NFqfF77IysRR6Lq4Z",
    stripeProductId: "prod_UBEJiRN7lDcB4u",
  },
};

export function getActionCreditCost(action: BillableAction, quantity = 1) {
  return Math.max(1, Math.ceil((ACTION_CREDIT_COST[action] ?? ACTION_CREDIT_COST.api_call) * quantity));
}
