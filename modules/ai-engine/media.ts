import { runAIRequest } from "./gateway";
import type { AIRequest } from "./types";

export type MediaKind = "image" | "video" | "script" | "chat";

const ACTION_BY_MEDIA_KIND = {
  image: "image_generation",
  video: "video_generation",
  script: "content_generation",
  chat: "chat_message",
} as const;

export function runMediaGeneration(kind: MediaKind, request: Omit<AIRequest, "action"> & Partial<Pick<AIRequest, "action">>) {
  return runAIRequest({
    ...request,
    action: request.action ?? ACTION_BY_MEDIA_KIND[kind],
    metadata: {
      mediaKind: kind,
      ...request.metadata,
    },
  });
}