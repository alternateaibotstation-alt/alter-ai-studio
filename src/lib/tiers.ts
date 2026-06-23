export type UserTier = "free" | "starter" | "creator" | "pro" | "studio" | "power";

export const TIER_LIMITS = {
  free: { campaigns: 5, images: 0, videos: 0 },
  starter: { campaigns: 20, images: 10, videos: 0 },
  creator: { campaigns: 80, images: 50, videos: 0 },
  pro: { campaigns: 200, images: 125, videos: 30 },
  studio: { campaigns: 500, images: 300, videos: 100 },
  power: { campaigns: 500, images: 300, videos: 100 },
} as const;

export const TIER_MODELS = {
  free: "openai/gpt-4.1-mini",
  starter: "openai/gpt-4.1-mini",
  creator: "openai/gpt-4.1",
  pro: "openai/gpt-4.1",
  studio: "openai/gpt-4.1",
} as const;

export const TIER_CONFIG = {
  starter: {
    price_id: "price_1TivwUBL5gimElYfebqRqPb7",
    product_id: "prod_UiMrXaLZz2YTH8",
    price: 12,
    name: "Starter",
    features: [
      "Limited image ad generation",
      "Text & caption generation",
      "Facebook & Instagram formats",
      "1,200 credits/month",
    ],
  },
  creator: {
    price_id: "price_1Tiw2TBL5gimElYf2LNMzpKg",
    product_id: "prod_UiMmsmsGxoXQMZ",
    price: 29,
    name: "Creator",
    features: [
      "Full image generation",
      "All ad formats (9:16, 1:1, 16:9)",
      "Voice generation",
      "Campaign variations",
    ],
  },
  pro: {
    price_id: "price_1Tiw5CBL5gimElYfucxheKp2",
    product_id: "prod_UiMoKro8tXhYDG",
    price: 59,
    name: "Pro",
    features: [
      "Full video generation",
      "AI voiceovers",
      "Scene-based video ads",
      "Priority processing",
    ],
  },
  studio: {
    price_id: "price_1Tiw8ABL5gimElYf8TlKEeZ2",
    product_id: "prod_UPpvkKvZISbXEs",
    price: 99,
    name: "Studio",
    features: [
      "Bulk campaign generation",
      "API access",
      "Team workflows",
      "White-label exports",
    ],
  },
} as const;
