export type UserTier = "free" | "pro" | "power";

export const TIER_LIMITS = {
  free: { messages: 15, images: 2 },
  pro: { messages: Infinity, images: 20 },
  power: { messages: Infinity, images: Infinity },
} as const;

export const TIER_MODELS = {
  free: "openai/gpt-4.1-mini",
  pro: "openai/gpt-4.1",
  power: "openai/gpt-4.1",
} as const;

export const TIER_CONFIG = {
  pro: {
    price_id: "price_1TCrq74NFqfF77IyKyIACANQ",
    product_id: "prod_UBEIVHEtYoy7QP",
    price: 9,
    name: "Pro",
    features: [
      "Unlimited messages",
      "20 image generations/day",
      "Higher-quality AI models",
      "Faster responses",
    ],
  },
  power: {
    price_id: "price_1TCrqY4NFqfF77IysRR6Lq4Z",
    product_id: "prod_UBEJiRN7lDcB4u",
    price: 29,
    name: "Power",
    features: [
      "Unlimited messages",
      "Unlimited image generation",
      "Priority processing",
      "Access to best AI models",
    ],
  },
} as const;
