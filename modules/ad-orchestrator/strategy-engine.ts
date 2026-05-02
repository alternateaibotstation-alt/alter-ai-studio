import { runAIRequest } from "@modules/ai-engine";
import type {
  AdFormat,
  AdPlatform,
  CampaignStrategy,
  EmotionalAngle,
  OrchestratorInput,
} from "./types";

const STRATEGY_SYSTEM_PROMPT = `You are an expert advertising strategist. Given a product, business, or idea, generate a comprehensive ad campaign strategy.

Return a JSON object with:
- targetAudience: who the ideal customer is
- emotionalAngles: array of 2-3 emotional hooks from [urgency, luxury, fear, desire, curiosity, social_proof, transformation, humor]
- platforms: recommended platforms from [tiktok, instagram, facebook, youtube]
- adFormats: recommended formats from [video, image, carousel]
- hooks: array of 5 attention-grabbing hooks (first 3 seconds / first line)
- ctaVariations: array of 3 call-to-action variations
- audienceTargetingSuggestions: array of 3-5 audience targeting suggestions for paid ads

Return ONLY valid JSON, no markdown fences.`;

export async function generateCampaignStrategy(
  input: OrchestratorInput,
): Promise<CampaignStrategy> {
  const response = await runAIRequest({
    prompt: `Product/Business: "${input.userInput}"\n\nGenerate a complete advertising campaign strategy.`,
    systemPrompt: STRATEGY_SYSTEM_PROMPT,
    action: "text_generation",
    metadata: { phase: "strategy" },
  });

  const parsed = parseStrategyResponse(response.output, input);

  return {
    id: crypto.randomUUID(),
    productDescription: input.userInput,
    targetAudience: parsed.targetAudience,
    emotionalAngles: parsed.emotionalAngles,
    platforms: input.platforms ?? parsed.platforms,
    adFormats: parsed.adFormats,
    hooks: parsed.hooks,
    ctaVariations: parsed.ctaVariations,
    audienceTargetingSuggestions: parsed.audienceTargetingSuggestions,
  };
}

interface ParsedStrategy {
  targetAudience: string;
  emotionalAngles: EmotionalAngle[];
  platforms: AdPlatform[];
  adFormats: AdFormat[];
  hooks: string[];
  ctaVariations: string[];
  audienceTargetingSuggestions: string[];
}

function parseStrategyResponse(
  raw: string,
  input: OrchestratorInput,
): ParsedStrategy {
  const defaults: ParsedStrategy = {
    targetAudience: "General consumers interested in this product",
    emotionalAngles: ["desire", "curiosity"],
    platforms: ["tiktok", "instagram", "facebook", "youtube"],
    adFormats: ["video", "image"],
    hooks: [
      `POV: You just discovered ${input.userInput}`,
      `Stop scrolling if you need ${input.userInput}`,
      `This ${input.userInput} changed everything`,
      `Nobody talks about this ${input.userInput} hack`,
      `Wait until you see what ${input.userInput} can do`,
    ],
    ctaVariations: [
      "Shop now — limited time only",
      "Link in bio to get started",
      "Tap to learn more",
    ],
    audienceTargetingSuggestions: [
      "Interest-based targeting for related products",
      "Lookalike audiences from existing customers",
      "Retargeting website visitors",
    ],
  };

  try {
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<ParsedStrategy>;
    return {
      targetAudience: parsed.targetAudience ?? defaults.targetAudience,
      emotionalAngles:
        (parsed.emotionalAngles?.filter(
          (a): a is EmotionalAngle =>
            [
              "urgency",
              "luxury",
              "fear",
              "desire",
              "curiosity",
              "social_proof",
              "transformation",
              "humor",
            ].includes(a),
        ) as EmotionalAngle[]) ?? defaults.emotionalAngles,
      platforms:
        (parsed.platforms?.filter(
          (p): p is AdPlatform =>
            ["tiktok", "instagram", "facebook", "youtube"].includes(p),
        ) as AdPlatform[]) ?? defaults.platforms,
      adFormats:
        (parsed.adFormats?.filter(
          (f): f is AdFormat =>
            ["video", "image", "carousel"].includes(f),
        ) as AdFormat[]) ?? defaults.adFormats,
      hooks: parsed.hooks ?? defaults.hooks,
      ctaVariations: parsed.ctaVariations ?? defaults.ctaVariations,
      audienceTargetingSuggestions:
        parsed.audienceTargetingSuggestions ??
        defaults.audienceTargetingSuggestions,
    };
  } catch {
    return defaults;
  }
}
