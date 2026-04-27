import { buildSafePrompt, PROMPT_PRESETS, runMediaGeneration } from "@modules/ai-engine";

export function generateTikTokScript(prompt: string) {
  return runMediaGeneration("script", { prompt: buildSafePrompt(PROMPT_PRESETS.tiktok, prompt) });
}

export function generateInstagramCaption(prompt: string) {
  return runMediaGeneration("script", { prompt: buildSafePrompt(PROMPT_PRESETS.instagram, prompt) });
}

export function generateYouTubeScript(prompt: string) {
  return runMediaGeneration("script", { prompt: buildSafePrompt(PROMPT_PRESETS.youtube, prompt) });
}

export function generateBlogDraft(prompt: string) {
  return runMediaGeneration("script", { prompt: buildSafePrompt(PROMPT_PRESETS.blog, prompt) });
}
