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

export function generateFFmpegCommand(job: AssemblyJob): string {
  const inputs = job.scenes
    .map((scene, i) => {
      if (scene.mediaUrl) {
        return `-i "${scene.mediaUrl}"`;
      }
      return `-f lavfi -t ${scene.duration} -i color=c=black:s=${scene.outputWidth}x${scene.outputHeight}`;
    })
    .join(" ");

  const filterParts = job.scenes.map((_, i) => `[${i}:v]`).join("");
  const concat = `${filterParts}concat=n=${job.scenes.length}:v=1:a=0[outv]`;

  const voiceover = job.voiceoverUrl
    ? `-i "${job.voiceoverUrl}" -map "[outv]" -map ${job.scenes.length}:a`
    : `-map "[outv]"`;

  return `ffmpeg ${inputs} -filter_complex "${concat}" ${voiceover} -c:v libx264 -preset fast -crf 23 output.mp4`;
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
