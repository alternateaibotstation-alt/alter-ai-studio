import type {
  AdPlatform,
  AdVariation,
  CampaignStrategy,
} from "@modules/ad-orchestrator";

export interface CampaignInput {
  userInput: string;
  platforms?: AdPlatform[];
  includeVideo?: boolean;
  includeImages?: boolean;
  videoCount?: number;
  imageCount?: number;
}

export interface GeneratedCampaign {
  id: string;
  input: string;
  strategy: CampaignStrategy;
  videoAds: AdVariation[];
  imageAds: AdVariation[];
  textAssets: TextAsset[];
  status: "pending" | "generating" | "completed" | "failed";
  creditsUsed: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface TextAsset {
  id: string;
  type: "hook" | "caption" | "cta" | "hashtags";
  platform: AdPlatform;
  content: string;
}

export const DEFAULT_CAMPAIGN_CONFIG = {
  videoCount: 3,
  imageCount: 5,
  hookVariations: 5,
  captionVariations: 4,
  ctaVariations: 3,
} as const;
