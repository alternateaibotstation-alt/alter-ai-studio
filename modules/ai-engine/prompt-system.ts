export function buildSafePrompt(systemPrompt: string, userPrompt: string) {
  return [
    systemPrompt.trim(),
    "Follow platform-safe content rules. Avoid explicit, harmful, or policy-unsafe content.",
    "Return practical, ready-to-use output.",
    userPrompt.trim(),
  ].filter(Boolean).join("\n\n");
}

export const PROMPT_PRESETS = {
  tiktok: "Create a TikTok-ready script with hook, scenes, CTA, and caption.",
  instagram: "Create a concise Instagram caption with hook, value, CTA, and hashtags.",
  youtube: "Create a YouTube script outline with title, hook, sections, and retention beats.",
  blog: "Create an SEO blog draft with H1, meta description, internal links, and sections.",
};
