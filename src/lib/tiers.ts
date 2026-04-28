export type UserTier = "free" | "starter" | "creator" | "pro" | "studio" | "power";

export const TIER_LIMITS = {
  free: { messages: 15, images: 0 },
  starter: { messages: 150, images: 10 },
  creator: { messages: 500, images: 50 },
  pro: { messages: 1200, images: 125 },
  studio: { messages: 2500, images: 300 },
  power: { messages: 2500, images: 300 },
} as const;

export const TIER_MODELS = {
  free: "openai/gpt-4.1-mini",
  starter: "openai/gpt-4.1-mini",
  creator: "openai/gpt-4.1",
  pro: "openai/gpt-4.1",
  studio: "openai/gpt-4.1",
  power: "openai/gpt-4.1",
} as const;

export const TIER_CONFIG = {
  starter: {
    price_id: "price_1TR0AG4NFqfF77Iy6XvkH0pQ",
    product_id: "prod_UPppL11VbgtS7Y",
    price: 12,
    name: "Starter",
    features: [
      "Limited image generation",
      "Basic content tools",
      "Text and caption generation",
      "Profit-safe monthly credits",
    ],
  },
  creator: {
    price_id: "price_1TR0E94NFqfF77IyqlUOxmkc",
    product_id: "prod_UPptYZrD81LoLZ",
    price: 29,
    name: "Creator",
    features: [
      "Images + captions",
      "Light video usage",
      "Creator workflow tools",
      "Higher monthly credit pool",
    ],
  },
  pro: {
    price_id: "price_1TR0Fb4NFqfF77IygzdnqHji",
    product_id: "prod_UPpvzCc8g4hOwA",
    price: 59,
    name: "Pro",
    features: [
      "Full video generation",
      "Limited high-value video credits",
      "Priority AI processing",
      "Advanced creator tools",
    ],
  },
  studio: {
    price_id: "price_1TR0G34NFqfF77IyvMKP0ggx",
    product_id: "prod_UPpvkKvZISbXEs",
    price: 99,
    name: "Studio",
    features: [
      "Bulk generation",
      "API access",
      "Team features",
      "Largest protected credit pool",
    ],
  },
  power: {
    price_id: "price_1TR0G34NFqfF77IyvMKP0ggx",
    product_id: "prod_UPpvkKvZISbXEs",
    price: 99,
    name: "Studio",
    features: ["Bulk generation", "API access", "Team features", "Largest protected credit pool"],
  },
} as const;
