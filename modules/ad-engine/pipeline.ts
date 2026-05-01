/**
 * AlterAI Ad Engine — Multi-step generation pipeline.
 *
 * Orchestrates 5 stages to produce a complete ad campaign:
 *   1. Product Understanding  → ProductInsight
 *   2. Audience Targeting     → AudienceProfile
 *   3. Hook Generation        → HookVariant[]
 *   4. Platform Formatting    → PlatformAdOutput[] (per selected platform)
 *   5. Conversion Optimization→ refined PlatformAdOutput[]
 */

import { runAIRequest } from "@modules/ai-engine";
import type { BillableAction } from "@modules/billing/plans";
import {
  buildProductInsightPrompt,
  buildAudienceProfilePrompt,
  buildHookGenerationPrompt,
  buildPlatformAdPrompt,
  buildConversionOptimizationPrompt,
} from "./prompts";
import type {
  CampaignBrief,
  CampaignResult,
  ProductInsight,
  AudienceProfile,
  HookVariant,
  PlatformAdOutput,
  AdPlatform,
} from "./types";

const AD_GENERATION_ACTION: BillableAction = "content_generation";

export type PipelineProgressCallback = (stage: string, progress: number) => void;

function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

async function runStage<T>(
  systemPrompt: string,
  userPrompt: string,
  _stageName: string
): Promise<{ data: T; creditsUsed: number }> {
  const response = await runAIRequest({
    prompt: userPrompt,
    systemPrompt,
    action: AD_GENERATION_ACTION,
    model: "openai/gpt-4.1-mini",
    metadata: { pipeline: "ad-engine", stage: _stageName },
  });

  const data = parseJSON<T>(response.output);
  return { data, creditsUsed: response.creditsUsed };
}

export async function runAdPipeline(
  brief: CampaignBrief,
  onProgress?: PipelineProgressCallback
): Promise<CampaignResult> {
  let totalCredits = 0;

  // ── Stage 1: Product Understanding ──
  onProgress?.("Analyzing product & market positioning...", 10);
  const insightPrompt = buildProductInsightPrompt(brief);
  const { data: productInsight, creditsUsed: c1 } = await runStage<ProductInsight>(
    insightPrompt.system,
    insightPrompt.user,
    "product_insight"
  );
  totalCredits += c1;

  // ── Stage 2: Audience Targeting ──
  onProgress?.("Building audience profile & targeting...", 25);
  const audiencePrompt = buildAudienceProfilePrompt(brief, productInsight);
  const { data: audienceProfile, creditsUsed: c2 } = await runStage<AudienceProfile>(
    audiencePrompt.system,
    audiencePrompt.user,
    "audience_profile"
  );
  totalCredits += c2;

  // ── Stage 3: Hook Generation ──
  onProgress?.("Generating scroll-stopping hooks...", 40);
  const hookPrompt = buildHookGenerationPrompt(brief, productInsight, audienceProfile);
  const { data: hookData, creditsUsed: c3 } = await runStage<{ hooks: HookVariant[] }>(
    hookPrompt.system,
    hookPrompt.user,
    "hook_generation"
  );
  totalCredits += c3;
  const hooks = hookData.hooks;

  // ── Stage 4: Platform Formatting (per platform) ──
  const ads: PlatformAdOutput[] = [];
  const platformCount = brief.platforms.length;

  for (let i = 0; i < platformCount; i++) {
    const platform = brief.platforms[i];
    const pct = 50 + Math.round((i / platformCount) * 30);
    onProgress?.(`Crafting ${formatPlatformName(platform)} ad...`, pct);

    const platformPrompt = buildPlatformAdPrompt(
      platform,
      brief,
      productInsight,
      audienceProfile,
      hooks
    );
    const { data: adData, creditsUsed: c4 } = await runStage<Record<string, unknown>>(
      platformPrompt.system,
      platformPrompt.user,
      `platform_${platform}`
    );
    totalCredits += c4;

    ads.push({ platform, ad: adData } as unknown as PlatformAdOutput);
  }

  // ── Stage 5: Conversion Optimization ──
  onProgress?.("Optimizing for conversions...", 85);
  const optimizedAds: PlatformAdOutput[] = [];

  for (const adOutput of ads) {
    const optPrompt = buildConversionOptimizationPrompt(
      adOutput.platform,
      JSON.stringify(adOutput.ad),
      brief
    );
    const { data: optimized, creditsUsed: c5 } = await runStage<Record<string, unknown>>(
      optPrompt.system,
      optPrompt.user,
      `optimize_${adOutput.platform}`
    );
    totalCredits += c5;

    optimizedAds.push({
      platform: adOutput.platform,
      ad: optimized,
    } as unknown as PlatformAdOutput);
  }

  onProgress?.("Campaign ready!", 100);

  return {
    id: crypto.randomUUID(),
    brief,
    productInsight,
    audienceProfile,
    hooks,
    ads: optimizedAds,
    createdAt: new Date().toISOString(),
    creditsUsed: totalCredits,
  };
}

/** Regenerate a single platform ad within an existing campaign. */
export async function regeneratePlatformAd(
  platform: AdPlatform,
  campaign: CampaignResult
): Promise<PlatformAdOutput> {
  const prompt = buildPlatformAdPrompt(
    platform,
    campaign.brief,
    campaign.productInsight,
    campaign.audienceProfile,
    campaign.hooks
  );
  const { data } = await runStage<Record<string, unknown>>(
    prompt.system,
    prompt.user,
    `regenerate_${platform}`
  );

  const optPrompt = buildConversionOptimizationPrompt(
    platform,
    JSON.stringify(data),
    campaign.brief
  );
  const { data: optimized } = await runStage<Record<string, unknown>>(
    optPrompt.system,
    optPrompt.user,
    `optimize_regen_${platform}`
  );

  return { platform, ad: optimized } as unknown as PlatformAdOutput;
}

function formatPlatformName(platform: AdPlatform): string {
  const names: Record<AdPlatform, string> = {
    tiktok: "TikTok",
    instagram_reels: "Instagram Reels",
    facebook: "Facebook",
    google_ads: "Google Ads",
    youtube_shorts: "YouTube Shorts",
    landing_page: "Landing Page",
  };
  return names[platform];
}

export { formatPlatformName };
