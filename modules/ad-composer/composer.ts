import type { AspectRatio, Scene } from "@modules/ad-orchestrator";
import {
  ASPECT_RATIO_DIMENSIONS,
  type ComposedScene,
  type CompositionConfig,
  type TextOverlay,
} from "./types";

function buildOverlays(scene: Scene): TextOverlay[] {
  const overlays: TextOverlay[] = [];

  if (scene.textOverlay) {
    overlays.push({
      text: scene.textOverlay,
      position: scene.type === "cta" ? "center" : "bottom",
      style: scene.type === "cta" ? "cta" : "bold",
    });
  }

  return overlays;
}

export function composeScene(
  scene: Scene,
  config: CompositionConfig,
): ComposedScene {
  const dims = ASPECT_RATIO_DIMENSIONS[config.aspectRatio];

  return {
    ...scene,
    overlays: buildOverlays(scene),
    aspectRatio: config.aspectRatio,
    outputWidth: dims.width,
    outputHeight: dims.height,
  };
}

export function composeScenes(
  scenes: Scene[],
  config: CompositionConfig,
): ComposedScene[] {
  return scenes.map((scene) => composeScene(scene, config));
}

export function getAspectRatiosForPlatform(
  platform: string,
): AspectRatio[] {
  switch (platform) {
    case "tiktok":
      return ["9:16"];
    case "instagram":
      return ["9:16", "1:1"];
    case "facebook":
      return ["1:1", "16:9"];
    case "youtube":
      return ["16:9"];
    default:
      return ["9:16", "1:1", "16:9"];
  }
}

export function generateHookText(hook: string, maxLength = 60): string {
  return hook.length > maxLength
    ? hook.substring(0, maxLength - 3) + "..."
    : hook;
}

export function generateCtaText(cta: string): string {
  return cta.toUpperCase();
}
