export function buildSafePrompt(systemPrompt: string, userPrompt: string) {
  return [
    systemPrompt.trim(),
    "Follow platform-safe content rules. Avoid explicit, harmful, or policy-unsafe content.",
    "Return practical, ready-to-use advertising output.",
    userPrompt.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const PROMPT_PRESETS = {
  tiktok_ad:
    "Create a TikTok ad script with hook (first 3 seconds), problem, solution, and CTA. Include scene directions.",
  instagram_ad:
    "Create an Instagram ad caption with a scroll-stopping hook, value proposition, CTA, and hashtags.",
  facebook_ad:
    "Create a Facebook ad with headline, primary text, description, and CTA button text.",
  youtube_ad:
    "Create a YouTube ad script with attention hook, problem-agitation, solution reveal, and strong CTA.",
  video_hook:
    "Generate 5 attention-grabbing hooks for a video ad. Each hook must be under 10 words and designed to stop scrolling.",
  image_prompt:
    "Generate a detailed visual description for an ad image. Include composition, colors, mood, and product placement.",
};
