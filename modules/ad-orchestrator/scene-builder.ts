import { runAIRequest } from "@modules/ai-engine";
import type { AdPlatform, CampaignStrategy, Scene } from "./types";

const SCENE_SYSTEM_PROMPT = `You are an expert video ad director. Generate a scene-by-scene breakdown for a short video ad (5-15 seconds total).

Every video ad MUST follow this exact structure:
- Scene 1: Hook (grab attention in 1-3 seconds)
- Scene 2: Problem (show the pain point, 2-3 seconds)
- Scene 3: Solution (reveal the product/service, 3-4 seconds)
- Scene 4: CTA (call to action, 2-3 seconds)

For each scene return a JSON array with objects containing:
- type: "hook" | "problem" | "solution" | "cta"
- description: what visually happens in this scene
- duration: seconds (integer)
- textOverlay: text shown on screen
- voiceoverScript: what the narrator says
- visualPrompt: detailed prompt for AI image/video generation

Return ONLY valid JSON array, no markdown fences.`;

export async function buildScenes(
  strategy: CampaignStrategy,
  platform: AdPlatform,
  hookIndex = 0,
): Promise<Scene[]> {
  const hook = strategy.hooks[hookIndex] ?? strategy.hooks[0];
  const cta =
    strategy.ctaVariations[hookIndex % strategy.ctaVariations.length] ??
    strategy.ctaVariations[0];

  const response = await runAIRequest({
    prompt: `Product: "${strategy.productDescription}"
Target audience: ${strategy.targetAudience}
Platform: ${platform}
Hook to use: "${hook}"
CTA to use: "${cta}"
Emotional angle: ${strategy.emotionalAngles[0]}

Generate a 4-scene video ad breakdown.`,
    systemPrompt: SCENE_SYSTEM_PROMPT,
    action: "text_generation",
    metadata: { phase: "scene_building", platform },
  });

  return parseSceneResponse(response.output, hook, cta);
}

function parseSceneResponse(
  raw: string,
  fallbackHook: string,
  fallbackCta: string,
): Scene[] {
  const defaults: Scene[] = [
    {
      id: crypto.randomUUID(),
      order: 1,
      type: "hook",
      description: "Attention-grabbing opening shot",
      duration: 3,
      textOverlay: fallbackHook,
      voiceoverScript: fallbackHook,
      visualPrompt: "Dynamic, eye-catching opening scene",
    },
    {
      id: crypto.randomUUID(),
      order: 2,
      type: "problem",
      description: "Show the pain point",
      duration: 3,
      textOverlay: "The problem you face every day...",
      voiceoverScript: "You know the struggle...",
      visualPrompt: "Person frustrated with current solution",
    },
    {
      id: crypto.randomUUID(),
      order: 3,
      type: "solution",
      description: "Reveal the product",
      duration: 4,
      textOverlay: "Here's the solution",
      voiceoverScript: "That's where we come in.",
      visualPrompt:
        "Product reveal shot with clean lighting and professional staging",
    },
    {
      id: crypto.randomUUID(),
      order: 4,
      type: "cta",
      description: "Call to action",
      duration: 3,
      textOverlay: fallbackCta,
      voiceoverScript: fallbackCta,
      visualPrompt: "Clean CTA screen with brand colors",
    },
  ];

  try {
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<Record<string, unknown>>;
    if (!Array.isArray(parsed) || parsed.length === 0) return defaults;

    return parsed.map((s, i) => ({
      id: crypto.randomUUID(),
      order: i + 1,
      type: (s.type as Scene["type"]) ?? defaults[i]?.type ?? "hook",
      description:
        (s.description as string) ??
        defaults[i]?.description ??
        "Scene",
      duration: Number(s.duration) || defaults[i]?.duration || 3,
      textOverlay: (s.textOverlay as string) ?? defaults[i]?.textOverlay,
      voiceoverScript:
        (s.voiceoverScript as string) ?? defaults[i]?.voiceoverScript,
      visualPrompt:
        (s.visualPrompt as string) ?? defaults[i]?.visualPrompt,
    }));
  } catch {
    return defaults;
  }
}
