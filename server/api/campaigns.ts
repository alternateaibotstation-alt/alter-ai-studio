import { runAdPipeline, regeneratePlatformAd } from "@modules/ad-engine";
import type { CampaignBrief, AdPlatform, CampaignResult } from "@modules/ad-engine";

export async function createCampaignEndpoint(brief: CampaignBrief) {
  return runAdPipeline(brief);
}

export async function regenerateAdEndpoint(
  platform: AdPlatform,
  campaign: CampaignResult
) {
  return regeneratePlatformAd(platform, campaign);
}
