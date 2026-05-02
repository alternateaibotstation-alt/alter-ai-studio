import { buildSafePrompt, PROMPT_PRESETS, runMediaGeneration } from "@modules/ai-engine";

export function generateTikTokAdScript(prompt: string) {
  return runMediaGeneration("script", {
    prompt: buildSafePrompt(PROMPT_PRESETS.tiktok_ad, prompt),
  });
}

export function generateInstagramAdCaption(prompt: string) {
  return runMediaGeneration("script", {
    prompt: buildSafePrompt(PROMPT_PRESETS.instagram_ad, prompt),
  });
}

export function generateFacebookAd(prompt: string) {
  return runMediaGeneration("script", {
    prompt: buildSafePrompt(PROMPT_PRESETS.facebook_ad, prompt),
  });
}

export function generateYouTubeAdScript(prompt: string) {
  return runMediaGeneration("script", {
    prompt: buildSafePrompt(PROMPT_PRESETS.youtube_ad, prompt),
  });
}

export function generateVideoHooks(prompt: string) {
  return runMediaGeneration("script", {
    prompt: buildSafePrompt(PROMPT_PRESETS.video_hook, prompt),
  });
}
