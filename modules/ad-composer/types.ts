import type { AspectRatio, Scene } from "@modules/ad-orchestrator";

export interface TextOverlay {
  text: string;
  position: "top" | "center" | "bottom";
  style: "bold" | "subtitle" | "cta";
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
}

export interface ComposedScene extends Scene {
  overlays: TextOverlay[];
  aspectRatio: AspectRatio;
  outputWidth: number;
  outputHeight: number;
}

export interface CompositionConfig {
  aspectRatio: AspectRatio;
  brandColor?: string;
  fontFamily?: string;
  logoUrl?: string;
  watermark?: boolean;
}

export const ASPECT_RATIO_DIMENSIONS: Record<
  AspectRatio,
  { width: number; height: number; label: string }
> = {
  "9:16": { width: 1080, height: 1920, label: "TikTok / Reels" },
  "1:1": { width: 1080, height: 1080, label: "Instagram / Facebook" },
  "16:9": { width: 1920, height: 1080, label: "YouTube" },
};
