export type SaaSPlan = "free" | "starter" | "creator" | "pro" | "studio";
export type BillableAction =
  | "text_generation"
  | "image_generation"
  | "voice_generation"
  | "video_generation"
  | "campaign_generation";

export interface PlanDefinition {
  id: SaaSPlan;
  name: string;
  monthlyPrice: number;
  monthlyCredits: number;
  dailyCredits: number;
  audience: string;
  features: string[];
  videoAllowed: boolean;
  highlighted?: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
}

export const CREDIT_VALUE_USD = 0.001;
export const MINIMUM_PROFIT_MARGIN = 0.18;

export const ACTION_CREDIT_COST: Record<BillableAction, number> = {
  text_generation: 1,
  image_generation: 8,
  voice_generation: 6,
  video_generation: 30,
  campaign_generation: 50,
};

export const SAAS_PLANS: Record<SaaSPlan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    monthlyCredits: 100,
    dailyCredits: 5,
    audience: "Try the platform",
    videoAllowed: false,
    features: [
      "Text ad generation only",
      "5 daily credits",
      "Basic hooks & captions",
      "No video generation",
    ],
  },
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPrice: 12,
    monthlyCredits: 1200,
    dailyCredits: 40,
    audience: "Solo creators getting started",
    videoAllowed: false,
    features: [
      "1,200 credits/month",
      "Limited image ad generation",
      "Captions & hooks",
      "Facebook & Instagram formats",
    ],
    stripePriceId: "price_1TR0AG4NFqfF77Iy6XvkH0pQ",
    stripeProductId: "prod_UPppL11VbgtS7Y",
  },
  creator: {
    id: "creator",
    name: "Creator",
    monthlyPrice: 29,
    monthlyCredits: 3500,
    dailyCredits: 140,
    audience: "The main plan for ad creators",
    videoAllowed: false,
    highlighted: true,
    features: [
      "3,500 credits/month",
      "Full image generation",
      "All ad formats (9:16, 1:1, 16:9)",
      "Voice generation",
      "Campaign variations",
    ],
    stripePriceId: "price_1TR0E94NFqfF77IyqlUOxmkc",
    stripeProductId: "prod_UPptYZrD81LoLZ",
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPrice: 59,
    monthlyCredits: 10000,
    dailyCredits: 400,
    audience: "Full video ad generation",
    videoAllowed: true,
    features: [
      "10,000 credits/month",
      "Full video generation (Runway ML)",
      "AI voiceovers (ElevenLabs)",
      "Scene-based video ads",
      "Priority processing",
    ],
    stripePriceId: "price_1TR0Fb4NFqfF77IygzdnqHji",
    stripeProductId: "prod_UPpvzCc8g4hOwA",
  },
  studio: {
    id: "studio",
    name: "Studio",
    monthlyPrice: 99,
    monthlyCredits: 40000,
    dailyCredits: 1600,
    audience: "Agencies & bulk usage",
    videoAllowed: true,
    features: [
      "40,000 credits/month",
      "Bulk campaign generation",
      "API access",
      "Team workflows",
      "White-label exports",
    ],
    stripePriceId: "price_1TR0G34NFqfF77IyvMKP0ggx",
    stripeProductId: "prod_UPpvkKvZISbXEs",
  },
};

export function getActionCreditCost(action: BillableAction, quantity = 1) {
  return Math.max(
    1,
    Math.ceil(
      (ACTION_CREDIT_COST[action] ?? ACTION_CREDIT_COST.text_generation) *
        quantity,
    ),
  );
}

export function isVideoAllowed(plan: SaaSPlan): boolean {
  return SAAS_PLANS[plan]?.videoAllowed === true;
}
