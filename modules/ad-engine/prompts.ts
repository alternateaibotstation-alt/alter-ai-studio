/**
 * Multi-step prompt pipeline for the AlterAI Ad Engine.
 *
 * Each function builds a structured system + user prompt for one stage
 * of the ad generation pipeline. The stages are:
 *
 *   1. Product Understanding
 *   2. Audience Targeting
 *   3. Hook Generation
 *   4. Platform Formatting (per platform)
 *   5. Conversion Optimization (review pass)
 */

import type {
  AdPlatform,
  AdTone,
  CampaignBrief,
  ProductInsight,
  AudienceProfile,
  HookVariant,
} from "./types";

const TONE_INSTRUCTIONS: Record<AdTone, string> = {
  luxury:
    "Use aspirational, refined language. Evoke exclusivity, premium quality, and elevated status. Avoid discounts or urgency unless subtly implied.",
  aggressive:
    "Be direct, bold, and confrontational. Challenge the reader. Use strong imperatives, short punchy sentences, and competitive framing.",
  emotional:
    "Lead with feelings. Use storytelling, vulnerability, and relatability. Create an emotional arc that resolves with the product as the answer.",
  viral:
    "Optimize for shareability. Use unexpected hooks, meme-worthy phrasing, pattern interrupts, and trends. Prioritize watch time and saves.",
  professional:
    "Use clear, credible, data-informed language. Reference results, metrics, and authority. Suitable for B2B and high-consideration purchases.",
  playful:
    "Be witty, fun, and approachable. Use humor, casual tone, and pop culture references. Make the brand feel like a friend, not a corporation.",
  urgency:
    "Create time pressure and scarcity. Use countdown language, limited availability, and fear of missing out. Drive immediate action.",
  storytelling:
    "Build a narrative arc: setup, conflict, resolution. Use the product as the turning point. Create characters or scenarios the audience relates to.",
};

/* ── Stage 1: Product Understanding ── */

export function buildProductInsightPrompt(brief: CampaignBrief): {
  system: string;
  user: string;
} {
  const system = `You are a senior brand strategist at a top advertising agency. Your job is to deeply analyze a product/service and extract strategic insights that will inform a high-converting ad campaign.

You must return ONLY valid JSON matching this exact schema — no markdown fences, no commentary:

{
  "uniqueSellingPoints": ["string", ...],
  "emotionalBenefits": ["string", ...],
  "rationalBenefits": ["string", ...],
  "idealCustomerProfile": "string",
  "painPoints": ["string", ...],
  "marketPositioning": "string"
}

Rules:
- uniqueSellingPoints: 3-5 differentiators that set this apart from competitors
- emotionalBenefits: 3-5 feelings the customer gets (status, relief, joy, belonging, etc.)
- rationalBenefits: 3-5 practical, measurable benefits
- idealCustomerProfile: A vivid 2-3 sentence profile of the perfect customer
- painPoints: 3-5 problems the customer has BEFORE using this product
- marketPositioning: A single sentence positioning statement (e.g. "The Uber of X for Y audience")`;

  const user = `Analyze this product for an ad campaign:

Product: ${brief.productName}
Description: ${brief.productDescription}
Target Audience (initial): ${brief.targetAudience}
${brief.competitorContext ? `Competitor Context: ${brief.competitorContext}` : ""}
${brief.brandVoice ? `Brand Voice: ${brief.brandVoice}` : ""}

Extract deep strategic insights. Think like a $500/hr brand strategist.`;

  return { system, user };
}

/* ── Stage 2: Audience Targeting ── */

export function buildAudienceProfilePrompt(
  brief: CampaignBrief,
  insight: ProductInsight
): { system: string; user: string } {
  const system = `You are a media buying strategist who specializes in audience research and targeting. Given product insights, build a detailed audience profile for a paid ad campaign.

Return ONLY valid JSON matching this schema — no markdown fences, no commentary:

{
  "demographics": "string",
  "psychographics": "string",
  "buyingTriggers": ["string", ...],
  "objections": ["string", ...],
  "platformBehavior": {
    "tiktok": "string",
    "instagram_reels": "string",
    "facebook": "string",
    "google_ads": "string",
    "youtube_shorts": "string",
    "landing_page": "string"
  }
}

Rules:
- demographics: Age, gender, income, location, occupation
- psychographics: Values, lifestyle, media consumption, brand affinities
- buyingTriggers: 4-6 specific events/moments that make them ready to buy
- objections: 3-5 reasons they might NOT buy (price, trust, timing, etc.)
- platformBehavior: How this audience behaves on EACH platform (scroll patterns, content preferences, peak hours)`;

  const user = `Build audience profile for this campaign:

Product: ${brief.productName}
Target Audience: ${brief.targetAudience}
Ideal Customer: ${insight.idealCustomerProfile}
Pain Points: ${insight.painPoints.join(", ")}
Emotional Benefits: ${insight.emotionalBenefits.join(", ")}

Platforms we're targeting: ${brief.platforms.join(", ")}

Be specific and actionable — this will directly inform ad creative.`;

  return { system, user };
}

/* ── Stage 3: Hook Generation ── */

export function buildHookGenerationPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile
): { system: string; user: string } {
  const system = `You are a creative director specializing in scroll-stopping hooks for paid advertising. Your hooks are optimized for the first 3 seconds of video ads and the first line of text ads.

Return ONLY valid JSON matching this schema — no markdown fences, no commentary:

{
  "hooks": [
    {
      "hook": "string",
      "hookType": "curiosity" | "pain" | "benefit" | "social_proof" | "controversy" | "story",
      "estimatedStopRate": "high" | "medium" | "low"
    }
  ]
}

Generate exactly 6 hooks — one per hookType. Each hook should:
- Be under 15 words
- Create an immediate pattern interrupt
- Be platform-agnostic (will be adapted per platform later)
- Drive the viewer to keep watching/reading

Tone instructions: ${TONE_INSTRUCTIONS[brief.tone]}`;

  const user = `Generate 6 scroll-stopping hooks for:

Product: ${brief.productName}
USPs: ${insight.uniqueSellingPoints.join(", ")}
Pain Points: ${insight.painPoints.join(", ")}
Audience: ${audience.demographics}
Buying Triggers: ${audience.buyingTriggers.join(", ")}
Objections to overcome: ${audience.objections.join(", ")}

Make each hook impossible to scroll past.`;

  return { system, user };
}

/* ── Stage 4: Platform Formatting ── */

export function buildPlatformAdPrompt(
  platform: AdPlatform,
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hooks: HookVariant[]
): { system: string; user: string } {
  const bestHook =
    hooks.find((h) => h.estimatedStopRate === "high")?.hook ?? hooks[0]?.hook ?? "";

  const platformPrompts: Record<AdPlatform, { system: string; user: string }> = {
    tiktok: buildTikTokPrompt(brief, insight, audience, bestHook),
    instagram_reels: buildInstagramReelsPrompt(brief, insight, audience, bestHook),
    facebook: buildFacebookPrompt(brief, insight, audience, bestHook),
    google_ads: buildGoogleAdsPrompt(brief, insight, audience),
    youtube_shorts: buildYouTubeShortsPrompt(brief, insight, audience, bestHook),
    landing_page: buildLandingPagePrompt(brief, insight, audience, bestHook),
  };

  return platformPrompts[platform];
}

function buildTikTokPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hook: string
): { system: string; user: string } {
  return {
    system: `You are a TikTok ad creative specialist. Create a complete TikTok ad script optimized for the For You Page algorithm.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "hook": "string (first 3 seconds — must stop the scroll)",
  "script": "string (full voiceover script, 30-60 seconds)",
  "scenes": [
    { "sceneNumber": 1, "visual": "string", "duration": "string", "voiceover": "string" }
  ],
  "cta": "string (clear call to action)",
  "hashtags": ["string", ...],
  "sound": "string (suggested trending sound or music style)"
}

Rules:
- Hook must be in the first 3 seconds
- 4-6 scenes total
- Each scene 3-8 seconds
- Total duration 30-60 seconds
- CTA must be specific and actionable
- 5-8 hashtags mixing broad and niche
- Sound suggestion should match the tone

Tone: ${TONE_INSTRUCTIONS[brief.tone]}`,
    user: `Create a TikTok ad for:

Product: ${brief.productName} — ${brief.productDescription}
Suggested hook: "${hook}"
Audience: ${audience.demographics} who ${audience.psychographics}
Key benefit: ${insight.uniqueSellingPoints[0]}
Pain point to address: ${insight.painPoints[0]}
CTA: ${brief.callToAction ?? "Link in bio"}
Platform behavior: ${audience.platformBehavior.tiktok}`,
  };
}

function buildInstagramReelsPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hook: string
): { system: string; user: string } {
  return {
    system: `You are an Instagram Reels ad creative specialist. Create a complete Reels ad optimized for Explore and feed placement.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "hook": "string",
  "script": "string (full voiceover/on-screen text)",
  "visualDirection": "string (detailed visual style notes)",
  "caption": "string (Instagram caption, max 2200 chars)",
  "hashtags": ["string", ...],
  "cta": "string"
}

Tone: ${TONE_INSTRUCTIONS[brief.tone]}`,
    user: `Create an Instagram Reels ad for:

Product: ${brief.productName} — ${brief.productDescription}
Hook: "${hook}"
Audience: ${audience.demographics}
Key benefit: ${insight.uniqueSellingPoints[0]}
Emotional appeal: ${insight.emotionalBenefits[0]}
Platform behavior: ${audience.platformBehavior.instagram_reels}`,
  };
}

function buildFacebookPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hook: string
): { system: string; user: string } {
  return {
    system: `You are a Facebook ads copywriter who specializes in direct response advertising. Create a complete Facebook ad copy set.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "primaryText": "string (main ad copy, 125-500 chars for feed)",
  "headline": "string (max 40 chars)",
  "description": "string (max 30 chars, appears below headline)",
  "cta": "string",
  "imageDirection": "string (detailed creative direction for the ad image)"
}

Rules:
- Primary text: Lead with the hook, address the pain, present the solution, end with CTA
- Headline: Benefit-driven, specific, creates curiosity
- Description: Reinforces the headline
- Follow Facebook Ads character limits

Tone: ${TONE_INSTRUCTIONS[brief.tone]}`,
    user: `Create Facebook ad copy for:

Product: ${brief.productName} — ${brief.productDescription}
Hook: "${hook}"
Audience: ${audience.demographics}
Objections to overcome: ${audience.objections.join(", ")}
Platform behavior: ${audience.platformBehavior.facebook}
CTA: ${brief.callToAction ?? "Shop Now"}`,
  };
}

function buildGoogleAdsPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile
): { system: string; user: string } {
  return {
    system: `You are a Google Ads specialist. Create a complete responsive search ad set with keyword targeting.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "headlines": ["string (max 30 chars each)", ...],
  "descriptions": ["string (max 90 chars each)", ...],
  "sitelinks": [
    { "title": "string (max 25 chars)", "description": "string (max 35 chars)" }
  ],
  "keywords": ["string", ...]
}

Rules:
- Exactly 8 headlines (Google requires 3-15, we want variety)
- Exactly 4 descriptions
- 4 sitelinks
- 10-15 keywords (mix of broad, phrase, exact match)
- All character limits must be respected
- Include dynamic keyword insertion where appropriate`,
    user: `Create Google Ads for:

Product: ${brief.productName} — ${brief.productDescription}
USPs: ${insight.uniqueSellingPoints.join(", ")}
Audience intent: ${audience.buyingTriggers.join(", ")}
Rational benefits: ${insight.rationalBenefits.join(", ")}
Platform behavior: ${audience.platformBehavior.google_ads}`,
  };
}

function buildYouTubeShortsPrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hook: string
): { system: string; user: string } {
  return {
    system: `You are a YouTube Shorts ad creative specialist. Create a complete Shorts ad script optimized for the Shorts shelf.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "hook": "string (first 2-3 seconds)",
  "script": "string (full script, 15-60 seconds)",
  "scenes": [
    { "sceneNumber": 1, "visual": "string", "duration": "string" }
  ],
  "cta": "string",
  "thumbnailConcept": "string (description of the ideal thumbnail)"
}

Tone: ${TONE_INSTRUCTIONS[brief.tone]}`,
    user: `Create a YouTube Shorts ad for:

Product: ${brief.productName} — ${brief.productDescription}
Hook: "${hook}"
Audience: ${audience.demographics}
Key benefit: ${insight.uniqueSellingPoints[0]}
Platform behavior: ${audience.platformBehavior.youtube_shorts}`,
  };
}

function buildLandingPagePrompt(
  brief: CampaignBrief,
  insight: ProductInsight,
  audience: AudienceProfile,
  hook: string
): { system: string; user: string } {
  return {
    system: `You are a conversion copywriter who specializes in high-converting landing pages. Create hero section and key landing page copy blocks.

Return ONLY valid JSON — no markdown fences, no commentary:

{
  "heroHeadline": "string (max 12 words, benefit-driven)",
  "heroSubheadline": "string (max 25 words, expands on headline)",
  "heroCta": "string (button text, max 5 words)",
  "benefitBlocks": [
    { "headline": "string", "body": "string (2-3 sentences)" }
  ],
  "socialProof": "string (testimonial or social proof element)",
  "urgencyElement": "string (scarcity or time-based urgency)",
  "finalCta": "string (closing CTA text)"
}

Rules:
- 3 benefit blocks
- heroHeadline should pass the "Would I click this?" test
- Every section drives toward the CTA
- Address objections implicitly in benefit blocks

Tone: ${TONE_INSTRUCTIONS[brief.tone]}`,
    user: `Create landing page copy for:

Product: ${brief.productName} — ${brief.productDescription}
Hook: "${hook}"
Audience: ${audience.demographics}
Pain points: ${insight.painPoints.join(", ")}
Objections: ${audience.objections.join(", ")}
Emotional benefits: ${insight.emotionalBenefits.join(", ")}
CTA: ${brief.callToAction ?? "Get Started"}`,
  };
}

/* ── Stage 5: Conversion Optimization (review pass) ── */

export function buildConversionOptimizationPrompt(
  platform: AdPlatform,
  adJson: string,
  brief: CampaignBrief
): { system: string; user: string } {
  return {
    system: `You are a conversion rate optimization specialist. Review the following ${platform} ad and improve it for maximum conversions.

Return the SAME JSON schema as the input, but with improvements applied. Return ONLY valid JSON — no markdown fences, no commentary.

Optimization checklist:
- Hook: Is it stopping the scroll in under 3 seconds?
- Clarity: Can someone understand the offer in 5 seconds?
- Objection handling: Are the top 2 objections addressed?
- CTA: Is it specific, urgent, and low-friction?
- Emotional resonance: Does it connect with the audience's identity?
- Platform fit: Does it follow ${platform} best practices?
- Uniqueness: Does it stand out from competitor ads?

Apply improvements directly. Do NOT explain changes — just return the optimized JSON.`,
    user: `Optimize this ${platform} ad for conversions:

${adJson}

Product: ${brief.productName}
Target tone: ${brief.tone}
CTA goal: ${brief.callToAction ?? "Convert"}`,
  };
}
