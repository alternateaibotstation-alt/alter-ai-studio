import { buildSafePrompt, PROMPT_PRESETS, runAIRequest } from "@modules/ai-engine";

export function generateTikTokScript(prompt: string) {
  return runAIRequest({ action: "content_generation", prompt: buildSafePrompt(PROMPT_PRESETS.tiktok, prompt) });
}

export function generateInstagramCaption(prompt: string) {
  return runAIRequest({ action: "content_generation", prompt: buildSafePrompt(PROMPT_PRESETS.instagram, prompt) });
}

export function generateYouTubeScript(prompt: string) {
  return runAIRequest({ action: "content_generation", prompt: buildSafePrompt(PROMPT_PRESETS.youtube, prompt) });
}

export function generateBlogDraft(prompt: string) {
  return runAIRequest({ action: "content_generation", prompt: buildSafePrompt(PROMPT_PRESETS.blog, prompt) });
}
