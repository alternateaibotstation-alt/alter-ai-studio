/** Core types for the AlterAI Ad Engine pipeline. */

export type AdPlatform =
  | "tiktok"
  | "instagram_reels"
  | "facebook"
  | "google_ads"
  | "youtube_shorts"
  | "landing_page";

export type AdTone =
  | "luxury"
  | "aggressive"
  | "emotional"
  | "viral"
  | "professional"
  | "playful"
  | "urgency"
  | "storytelling";

export interface CampaignBrief {
  productName: string;
  productDescription: string;
  targetAudience: string;
  tone: AdTone;
  platforms: AdPlatform[];
  callToAction?: string;
  brandVoice?: string;
  competitorContext?: string;
  budget?: string;
}

export interface ProductInsight {
  uniqueSellingPoints: string[];
  emotionalBenefits: string[];
  rationalBenefits: string[];
  idealCustomerProfile: string;
  painPoints: string[];
  marketPositioning: string;
}

export interface AudienceProfile {
  demographics: string;
  psychographics: string;
  buyingTriggers: string[];
  objections: string[];
  platformBehavior: Record<AdPlatform, string>;
}

export interface HookVariant {
  hook: string;
  hookType: "curiosity" | "pain" | "benefit" | "social_proof" | "controversy" | "story";
  estimatedStopRate: "high" | "medium" | "low";
}

export interface TikTokAd {
  hook: string;
  script: string;
  scenes: { sceneNumber: number; visual: string; duration: string; voiceover: string }[];
  cta: string;
  hashtags: string[];
  sound: string;
}

export interface InstagramReelsAd {
  hook: string;
  script: string;
  visualDirection: string;
  caption: string;
  hashtags: string[];
  cta: string;
}

export interface FacebookAd {
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  imageDirection: string;
}

export interface GoogleAd {
  headlines: string[];
  descriptions: string[];
  sitelinks: { title: string; description: string }[];
  keywords: string[];
}

export interface YouTubeShortsAd {
  hook: string;
  script: string;
  scenes: { sceneNumber: number; visual: string; duration: string }[];
  cta: string;
  thumbnailConcept: string;
}

export interface LandingPageCopy {
  heroHeadline: string;
  heroSubheadline: string;
  heroCta: string;
  benefitBlocks: { headline: string; body: string }[];
  socialProof: string;
  urgencyElement: string;
  finalCta: string;
}

export type PlatformAdOutput =
  | { platform: "tiktok"; ad: TikTokAd }
  | { platform: "instagram_reels"; ad: InstagramReelsAd }
  | { platform: "facebook"; ad: FacebookAd }
  | { platform: "google_ads"; ad: GoogleAd }
  | { platform: "youtube_shorts"; ad: YouTubeShortsAd }
  | { platform: "landing_page"; ad: LandingPageCopy };

export interface CampaignResult {
  id: string;
  brief: CampaignBrief;
  productInsight: ProductInsight;
  audienceProfile: AudienceProfile;
  hooks: HookVariant[];
  ads: PlatformAdOutput[];
  createdAt: string;
  creditsUsed: number;
}

export interface PipelineStageResult<T> {
  data: T;
  model: string;
  creditsUsed: number;
}
