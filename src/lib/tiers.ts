export type UserTier = "free" | "pro" | "power";

export const TIER_LIMITS = {
  free: { messages: 15, images: 2 },
  pro: { messages: 500, images: 50 },
  power: { messages: 2000, images: 250 },
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
    name: "Creator",
    features: [
      "500 messages/day",
      "50 image generations/day",
      "3,500 monthly credits",
      "Higher-quality AI models",
      "Faster responses",
    ],
  },
  power: {
    price_id: "price_1TCrqY4NFqfF77IysRR6Lq4Z",
    product_id: "prod_UBEJiRN7lDcB4u",
    price: 29,
    name: "Studio",
    features: [
      "2,000 messages/day",
      "250 image generations/day",
      "40,000 monthly credits",
      "Priority processing",
      "Access to best AI models",
    ],
  },
} as const;
