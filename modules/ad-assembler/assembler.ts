import type { ComposedScene } from "@modules/ad-composer";
import {
  DEFAULT_ASSEMBLY_CONFIG,
  type AssemblyConfig,
  type AssemblyJob,
} from "./types";

export function createAssemblyJob(
  scenes: ComposedScene[],
  config: Partial<AssemblyConfig> = {},
  voiceoverUrl?: string,
): AssemblyJob {
  const mergedConfig = { ...DEFAULT_ASSEMBLY_CONFIG, ...config };

  return {
    id: crypto.randomUUID(),
    scenes,
    voiceoverUrl: mergedConfig.includeVoiceover ? voiceoverUrl : undefined,
    outputFormat: "mp4",
    status: "queued",
    createdAt: new Date(),
  };
}

export function calculateTotalDuration(scenes: ComposedScene[]): number {
  return scenes.reduce((total, scene) => total + scene.duration, 0);
}

const SAFE_URL_PATTERN = /^https?:\/\/[^\s"'`;|&$(){}]+$/;

function validateMediaUrl(url: string): string {
  if (!SAFE_URL_PATTERN.test(url)) {
    throw new Error(`Invalid media URL: contains disallowed characters`);
  }
  return url;
}

export function generateFFmpegArgs(
  job: AssemblyJob,
  outputPath = "output.mp4",
): string[] {
  const args: string[] = [];

  for (const scene of job.scenes) {
    if (scene.mediaUrl) {
      args.push("-i", validateMediaUrl(scene.mediaUrl));
    } else {
      args.push(
        "-f", "lavfi",
        "-t", String(scene.duration),
        "-i", `color=c=black:s=${scene.outputWidth}x${scene.outputHeight}`,
      );
    }
  }

  const filterParts = job.scenes.map((_, i) => `[${i}:v]`).join("");
  const concat = `${filterParts}concat=n=${job.scenes.length}:v=1:a=0[outv]`;

  args.push("-filter_complex", concat);

  if (job.voiceoverUrl) {
    args.push("-i", validateMediaUrl(job.voiceoverUrl));
    args.push("-map", "[outv]", "-map", `${job.scenes.length}:a`);
  } else {
    args.push("-map", "[outv]");
  }

  args.push("-c:v", "libx264", "-preset", "fast", "-crf", "23", outputPath);

  return args;
}

export function getAssemblyStatus(
  job: AssemblyJob,
): {
  progress: number;
  label: string;
} {
  switch (job.status) {
    case "queued":
      return { progress: 0, label: "Queued" };
    case "processing":
      return { progress: 50, label: "Assembling video..." };
    case "completed":
      return { progress: 100, label: "Complete" };
    case "failed":
      return { progress: 0, label: "Failed" };
  }
}
