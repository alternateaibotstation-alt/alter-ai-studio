import type { ComposedScene } from "@modules/ad-composer";

export interface AssemblyJob {
  id: string;
  scenes: ComposedScene[];
  voiceoverUrl?: string;
  musicUrl?: string;
  outputFormat: "mp4" | "webm";
  status: "queued" | "processing" | "completed" | "failed";
  outputUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface AssemblyConfig {
  includeSubtitles: boolean;
  includeVoiceover: boolean;
  includeMusic: boolean;
  transitionStyle: "cut" | "fade" | "slide";
  outputQuality: "draft" | "standard" | "high";
}

export const DEFAULT_ASSEMBLY_CONFIG: AssemblyConfig = {
  includeSubtitles: true,
  includeVoiceover: true,
  includeMusic: false,
  transitionStyle: "cut",
  outputQuality: "standard",
};
