export type AdPlatform = "tiktok" | "instagram" | "facebook" | "youtube";
export type AdFormat = "video" | "image" | "carousel";
export type AspectRatio = "9:16" | "1:1" | "16:9";
export type EmotionalAngle =
  | "urgency"
  | "luxury"
  | "fear"
  | "desire"
  | "curiosity"
  | "social_proof"
  | "transformation"
  | "humor";

export interface Scene {
  id: string;
  order: number;
  type: "hook" | "problem" | "solution" | "social_proof" | "cta";
  description: string;
  duration: number;
  textOverlay?: string;
  voiceoverScript?: string;
  visualPrompt?: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export interface AdVariation {
  id: string;
  platform: AdPlatform;
  format: AdFormat;
  aspectRatio: AspectRatio;
  scenes: Scene[];
  caption: string;
  hashtags: string[];
  hookText: string;
  ctaText: string;
  voiceoverUrl?: string;
  finalMediaUrl?: string;
  status: "pending" | "generating" | "completed" | "failed";
}

export interface CampaignStrategy {
  id: string;
  productDescription: string;
  targetAudience: string;
  emotionalAngles: EmotionalAngle[];
  platforms: AdPlatform[];
  adFormats: AdFormat[];
  hooks: string[];
  ctaVariations: string[];
  audienceTargetingSuggestions: string[];
}

export interface CampaignResult {
  id: string;
  input: string;
  strategy: CampaignStrategy;
  videoAds: AdVariation[];
  imageAds: AdVariation[];
  captions: string[];
  hashtags: string[];
  hookVariations: string[];
  ctaVariations: string[];
  audienceTargeting: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: Date;
}

export interface OrchestratorInput {
  userInput: string;
  platforms?: AdPlatform[];
  includeVideo?: boolean;
  includeImages?: boolean;
  emotionalAngle?: EmotionalAngle;
  variations?: number;
}
