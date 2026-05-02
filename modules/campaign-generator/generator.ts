import {
  generateCampaignStrategy,
  buildScenes,
  type AdPlatform,
  type AdVariation,
} from "@modules/ad-orchestrator";
import { composeScenes } from "@modules/ad-composer";
import { reserveCredits, deductCredits, refundCredits, getActionCreditCost, isVideoAllowed } from "@modules/billing";
import type { BillableAction, SaaSPlan } from "@modules/billing";
import { runMediaGeneration } from "@modules/ai-engine";
import {
  DEFAULT_CAMPAIGN_CONFIG,
  type CampaignInput,
  type GeneratedCampaign,
  type TextAsset,
} from "./types";

interface CreditLedgerEntry {
  action: BillableAction;
  quantity: number;
}

export async function generateFullCampaign(
  input: CampaignInput,
  userPlan: SaaSPlan = "free",
): Promise<GeneratedCampaign> {
  const campaignId = crypto.randomUUID();
  let totalCreditsUsed = 0;
  const creditLedger: CreditLedgerEntry[] = [];

  const campaign: GeneratedCampaign = {
    id: campaignId,
    input: input.userInput,
    strategy: {
      id: "",
      productDescription: input.userInput,
      targetAudience: "",
      emotionalAngles: [],
      platforms: input.platforms ?? ["tiktok", "instagram", "facebook", "youtube"],
      adFormats: [],
      hooks: [],
      ctaVariations: [],
      audienceTargetingSuggestions: [],
    },
    videoAds: [],
    imageAds: [],
    textAssets: [],
    status: "generating",
    creditsUsed: 0,
    createdAt: new Date(),
  };

  try {
    const estimatedCredits = estimateCampaignCost(input, userPlan);
    const creditCheck = await reserveCredits(
      "text_generation",
      estimatedCredits,
      userPlan,
    );
    if (!creditCheck.allowed) {
      campaign.status = "failed";
      return campaign;
    }

    const strategy = await generateCampaignStrategy({
      userInput: input.userInput,
      platforms: input.platforms,
      includeVideo: input.includeVideo,
      includeImages: input.includeImages,
    });
    campaign.strategy = strategy;

    await deductCredits("text_generation", 1);
    creditLedger.push({ action: "text_generation", quantity: 1 });
    totalCreditsUsed += 1;

    const textAssets = generateTextAssets(strategy);
    campaign.textAssets = textAssets;

    if (input.includeImages !== false) {
      const imageCount =
        input.imageCount ?? DEFAULT_CAMPAIGN_CONFIG.imageCount;
      const imageAds = await generateImageAds(
        strategy,
        imageCount,
        userPlan,
      );
      campaign.imageAds = imageAds;
      if (imageAds.length > 0) {
        creditLedger.push({ action: "image_generation", quantity: imageAds.length });
      }
      totalCreditsUsed += imageAds.length * 8;
    }

    if (input.includeVideo && isVideoAllowed(userPlan)) {
      const videoCount =
        input.videoCount ?? DEFAULT_CAMPAIGN_CONFIG.videoCount;
      const videoAds = await generateVideoAds(
        strategy,
        videoCount,
        userPlan,
      );
      campaign.videoAds = videoAds;
      if (videoAds.length > 0) {
        creditLedger.push({ action: "video_generation", quantity: videoAds.length });
      }
      totalCreditsUsed += videoAds.length * 30;
    }

    campaign.creditsUsed = totalCreditsUsed;
    campaign.status = "completed";
    campaign.completedAt = new Date();
  } catch {
    campaign.status = "failed";
    for (const entry of creditLedger) {
      await refundCredits(entry.action, entry.quantity).catch(() => {});
    }
  }

  return campaign;
}

function generateTextAssets(
  strategy: import("@modules/ad-orchestrator").CampaignStrategy,
): TextAsset[] {
  const assets: TextAsset[] = [];

  for (const platform of strategy.platforms) {
    for (const hook of strategy.hooks) {
      assets.push({
        id: crypto.randomUUID(),
        type: "hook",
        platform,
        content: hook,
      });
    }

    for (const cta of strategy.ctaVariations) {
      assets.push({
        id: crypto.randomUUID(),
        type: "cta",
        platform,
        content: cta,
      });
    }

    assets.push({
      id: crypto.randomUUID(),
      type: "hashtags",
      platform,
      content: generateHashtags(strategy.productDescription, platform),
    });
  }

  return assets;
}

function generateHashtags(product: string, platform: AdPlatform): string {
  const words = product
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3);

  const base = words.map((w) => `#${w}`);
  const platformTags: Record<AdPlatform, string[]> = {
    tiktok: ["#fyp", "#foryoupage", "#viral", "#ad"],
    instagram: ["#instagood", "#explore", "#ad", "#sponsored"],
    facebook: ["#ad", "#sponsored", "#shopnow"],
    youtube: ["#shorts", "#ad", "#subscribe"],
  };

  return [...base, ...platformTags[platform]].join(" ");
}

async function generateImageAds(
  strategy: import("@modules/ad-orchestrator").CampaignStrategy,
  count: number,
  userPlan: SaaSPlan,
): Promise<AdVariation[]> {
  const ads: AdVariation[] = [];

  for (let i = 0; i < count; i++) {
    const creditCheck = await reserveCredits(
      "image_generation",
      1,
      userPlan,
    );
    if (!creditCheck.allowed) break;

    const platform =
      strategy.platforms[i % strategy.platforms.length];
    const hook = strategy.hooks[i % strategy.hooks.length];

    try {
      await runMediaGeneration("image", {
        prompt: `Create a professional ad image for: ${strategy.productDescription}. Style: modern, clean, scroll-stopping. Hook: "${hook}"`,
        metadata: { campaignPhase: "image_generation", platform },
      });

      await deductCredits("image_generation", 1);

      ads.push({
        id: crypto.randomUUID(),
        platform,
        format: "image",
        aspectRatio: platform === "youtube" ? "16:9" : "1:1",
        scenes: [],
        caption: `${hook}\n\n${strategy.ctaVariations[i % strategy.ctaVariations.length]}`,
        hashtags: generateHashtags(strategy.productDescription, platform).split(" "),
        hookText: hook,
        ctaText: strategy.ctaVariations[i % strategy.ctaVariations.length],
        status: "completed",
      });
    } catch {
      await refundCredits("image_generation", 1).catch(() => {});
    }
  }

  return ads;
}

async function generateVideoAds(
  strategy: import("@modules/ad-orchestrator").CampaignStrategy,
  count: number,
  userPlan: SaaSPlan,
): Promise<AdVariation[]> {
  const ads: AdVariation[] = [];

  for (let i = 0; i < count; i++) {
    const creditCheck = await reserveCredits(
      "video_generation",
      1,
      userPlan,
    );
    if (!creditCheck.allowed) break;

    const platform =
      strategy.platforms[i % strategy.platforms.length];

    try {
      const scenes = await buildScenes(strategy, platform, i);
      const composed = composeScenes(scenes, {
        aspectRatio: platform === "tiktok" ? "9:16" : "16:9",
      });

      await deductCredits("video_generation", 1);

      ads.push({
        id: crypto.randomUUID(),
        platform,
        format: "video",
        aspectRatio: platform === "tiktok" ? "9:16" : "16:9",
        scenes: composed,
        caption: `${strategy.hooks[i % strategy.hooks.length]}\n\n${strategy.ctaVariations[i % strategy.ctaVariations.length]}`,
        hashtags: generateHashtags(strategy.productDescription, platform).split(" "),
        hookText: strategy.hooks[i % strategy.hooks.length],
        ctaText: strategy.ctaVariations[i % strategy.ctaVariations.length],
        status: "completed",
      });
    } catch {
      await refundCredits("video_generation", 1).catch(() => {});
    }
  }

  return ads;
}

function estimateCampaignCost(input: CampaignInput, userPlan: SaaSPlan): number {
  let cost = getActionCreditCost("text_generation", 1);

  if (input.includeImages !== false) {
    const imageCount = input.imageCount ?? DEFAULT_CAMPAIGN_CONFIG.imageCount;
    cost += getActionCreditCost("image_generation", imageCount);
  }

  if (input.includeVideo && isVideoAllowed(userPlan)) {
    const videoCount = input.videoCount ?? DEFAULT_CAMPAIGN_CONFIG.videoCount;
    cost += getActionCreditCost("video_generation", videoCount);
  }

  return cost;
}
