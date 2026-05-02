import { runAIRequest } from "./gateway";
import type { AIRequest } from "./types";

export type MediaKind = "image" | "video" | "voice" | "script";

const ACTION_BY_MEDIA_KIND = {
  image: "image_generation",
  video: "video_generation",
  voice: "voice_generation",
  script: "text_generation",
} as const;

export function runMediaGeneration(
  kind: MediaKind,
  request: Omit<AIRequest, "action"> & Partial<Pick<AIRequest, "action">>,
) {
  return runAIRequest({
    ...request,
    action: request.action ?? ACTION_BY_MEDIA_KIND[kind],
    metadata: {
      mediaKind: kind,
      ...request.metadata,
    },
  });
}

export function generateAdImage(prompt: string, style = "professional") {
  return runMediaGeneration("image", {
    prompt: `${prompt}. Style: ${style}, high-quality advertising visual, clean composition.`,
    metadata: { provider: "dalle", style },
  });
}

export function generateAdVideo(prompt: string, durationSeconds = 5) {
  return runMediaGeneration("video", {
    prompt: `${prompt}. Duration: ${durationSeconds}s. Style: professional advertisement, dynamic, engaging.`,
    metadata: { provider: "runway", durationSeconds },
  });
}

export function generateVoiceover(script: string, voice = "professional") {
  return runMediaGeneration("voice", {
    prompt: script,
    metadata: { provider: "elevenlabs", voice },
  });
}
