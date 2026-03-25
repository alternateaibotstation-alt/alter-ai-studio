import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Loader2, Download, Play, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import VideoStyleSettings, { VideoStyle, defaultVideoStyle } from "./VideoStyleSettings";
import VideoMusicSelector, { MusicSettings, defaultMusicSettings } from "./VideoMusicSelector";

interface Scene {
  number: number;
  text: string;
  duration_seconds: number;
}

interface ImagePrompt {
  scene_number: number;
  prompt: string;
}

interface Props {
  scenes: Scene[];
  imagePrompts: ImagePrompt[];
  hook: string;
  existingImages: { scene_number: number; url: string }[];
}

type Phase = "idle" | "generating-images" | "compiling" | "done" | "error";

function extractImageUrl(data: any): string | null {
  const images = data?.choices?.[0]?.message?.images;
  if (images?.[0]?.image_url?.url) return images[0].image_url.url;
  if (data?.image) return data.image;
  return null;
}

export default function VideoCompiler({ scenes, imagePrompts, hook, existingImages }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [style, setStyle] = useState<VideoStyle>(defaultVideoStyle);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateVideo = useCallback(async () => {
    setPhase("generating-images");
    setProgress(0);
    setVideoUrl(null);

    const WIDTH = 1080;
    const HEIGHT = 1920;
    const FPS = 30;

    try {
      const sceneImages: Map<number, HTMLImageElement> = new Map();
      const totalScenes = imagePrompts.length;

      for (let i = 0; i < totalScenes; i++) {
        const ip = imagePrompts[i];
        setStatusText(`Generating image ${i + 1}/${totalScenes}...`);
        setProgress(((i) / totalScenes) * 50);

        const existing = existingImages.find(e => e.scene_number === ip.scene_number);
        let imageUrl = existing?.url;

        if (!imageUrl) {
          try {
            const { data, error } = await supabase.functions.invoke("generate-image", {
              body: { prompt: ip.prompt },
            });
            if (error) throw error;
            imageUrl = extractImageUrl(data);
            if (!imageUrl) throw new Error("No image returned");
          } catch (err: any) {
            console.error(`Failed to generate image for scene ${ip.scene_number}:`, err);
            imageUrl = null;
          }
        }

        if (imageUrl) {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = imageUrl!;
          });
          if (img.complete && img.naturalWidth > 0) {
            sceneImages.set(ip.scene_number, img);
          }
        }
      }

      setProgress(50);
      setPhase("compiling");
      setStatusText("Compiling video...");

      const canvas = canvasRef.current!;
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext("2d")!;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      const stream = canvas.captureStream(FPS);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      const videoReady = new Promise<string>((resolve) => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(URL.createObjectURL(blob));
        };
      });

      recorder.start();

      const totalDuration = scenes.reduce((sum, s) => sum + s.duration_seconds, 0);
      const totalFrames = totalDuration * FPS;
      const transitionFrames = Math.floor(FPS * 0.5);

      // Text Y position based on style
      const textYFactor = style.textPosition === "upper" ? 0.3 : style.textPosition === "center" ? 0.5 : 0.75;
      const hookYFactor = style.hookPosition === "top" ? 0.25 : 0.5;

      let currentFrame = 0;

      for (let sceneIdx = 0; sceneIdx < scenes.length; sceneIdx++) {
        const scene = scenes[sceneIdx];
        const sceneFrames = scene.duration_seconds * FPS;
        const img = sceneImages.get(scene.number);

        for (let f = 0; f < sceneFrames; f++) {
          // Background gradient
          const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
          grad.addColorStop(0, style.bgGradientTop);
          grad.addColorStop(0.5, style.bgGradientMid);
          grad.addColorStop(1, style.bgGradientBot);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Scene image with Ken Burns
          if (img) {
            const p = f / sceneFrames;
            const scale = 1.0 + p * 0.08;
            const panX = Math.sin(p * Math.PI) * 20;
            const panY = Math.cos(p * Math.PI * 0.5) * 15;

            const imgAspect = img.naturalWidth / img.naturalHeight;
            const canvasAspect = WIDTH / HEIGHT;
            let drawW: number, drawH: number;
            if (imgAspect > canvasAspect) {
              drawH = HEIGHT * scale;
              drawW = drawH * imgAspect;
            } else {
              drawW = WIDTH * scale;
              drawH = drawW / imgAspect;
            }

            const x = (WIDTH - drawW) / 2 + panX;
            const y = (HEIGHT - drawH) / 2 + panY;

            let opacity = 1;
            if (f < transitionFrames) opacity = f / transitionFrames;
            if (f > sceneFrames - transitionFrames) opacity = (sceneFrames - f) / transitionFrames;

            ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
            ctx.drawImage(img, x, y, drawW, drawH);
            ctx.globalAlpha = 1;

            // Dim overlay
            ctx.fillStyle = `rgba(0, 0, 0, ${style.overlayOpacity / 100})`;
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
          }

          // Scene number badge
          if (style.showBadge) {
            ctx.fillStyle = hexToRgba(style.badgeColor, 0.9);
            const badgeX = WIDTH / 2 - 25;
            const badgeY = HEIGHT * 0.12;
            roundRect(ctx, badgeX, badgeY, 50, 50, 25);
            ctx.fill();
            ctx.fillStyle = style.textColor;
            ctx.font = `bold ${style.badgeTextSize}px ${style.fontFamily}`;
            ctx.textAlign = "center";
            ctx.fillText(`${scene.number}`, WIDTH / 2, badgeY + 33);
          }

          // Scene text
          const textProgress = Math.min(1, f / (FPS * 0.8));
          const textOpacity = easeOutCubic(textProgress);
          const textSlide = (1 - easeOutCubic(textProgress)) * 40;

          ctx.globalAlpha = textOpacity;
          ctx.fillStyle = style.textColor;
          ctx.font = `bold ${style.sceneTextSize}px ${style.fontFamily}`;
          ctx.textAlign = "center";
          wrapText(ctx, scene.text, WIDTH / 2, HEIGHT * textYFactor + textSlide, WIDTH - 120, style.sceneTextSize * 1.35);
          ctx.globalAlpha = 1;

          // Hook text (first scene)
          if (sceneIdx === 0 && f < FPS * 2) {
            const hookOpacity = f < FPS * 1.5 ? Math.min(1, f / (FPS * 0.5)) : Math.max(0, 1 - (f - FPS * 1.5) / (FPS * 0.5));
            ctx.globalAlpha = hookOpacity;
            ctx.fillStyle = style.hookColor;
            ctx.font = `bold ${style.hookTextSize}px ${style.fontFamily}`;
            wrapText(ctx, hook, WIDTH / 2, HEIGHT * hookYFactor, WIDTH - 100, style.hookTextSize * 1.35);
            ctx.globalAlpha = 1;
          }

          // Progress bar
          if (style.showProgressBar) {
            const overallProgress = currentFrame / totalFrames;
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(0, HEIGHT - 6, WIDTH, 6);
            ctx.fillStyle = style.progressBarColor;
            ctx.fillRect(0, HEIGHT - 6, WIDTH * overallProgress, 6);
          }

          currentFrame++;
          setProgress(50 + (currentFrame / totalFrames) * 50);

          if (f % 5 === 0) {
            await new Promise(r => setTimeout(r, 0));
          }
        }
      }

      recorder.stop();
      const url = await videoReady;
      setVideoUrl(url);
      setPhase("done");
      setProgress(100);
      setStatusText("Video ready!");
      toast.success("Video generated! Click download to save.");
    } catch (err: any) {
      console.error("Video generation error:", err);
      setPhase("error");
      setStatusText(err.message || "Failed to generate video");
      toast.error("Video generation failed");
    }
  }, [scenes, imagePrompts, hook, existingImages, style]);

  const downloadVideo = () => {
    if (!videoUrl) return;
    const a = document.createElement("a");
    a.href = videoUrl;
    a.download = "tiktok-content.webm";
    a.click();
  };

  return (
    <div className="space-y-4">
      {/* Style Settings */}
      <VideoStyleSettings style={style} onChange={setStyle} />

      {/* Video Generation */}
      <Card className="border-primary/20">
        <CardContent className="pt-6 space-y-4">
          <div className="text-center space-y-2">
            <Film className="w-10 h-10 mx-auto text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Generate Video</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Compile scenes into a TikTok-ready video with your custom styles.
            </p>
          </div>

          {phase !== "idle" && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">{statusText}</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex items-center gap-2 text-destructive text-sm justify-center">
              <AlertCircle className="w-4 h-4" />
              <span>{statusText}</span>
            </div>
          )}

          {videoUrl && (
            <video
              src={videoUrl}
              controls
              className="w-full max-w-sm mx-auto rounded-lg border border-border"
              style={{ aspectRatio: "9/16", maxHeight: "500px" }}
            />
          )}

          <div className="flex gap-2 justify-center">
            {(phase === "idle" || phase === "error") && (
              <Button onClick={generateVideo} size="lg">
                <Play className="w-4 h-4 mr-2" /> Generate Video
              </Button>
            )}
            {(phase === "generating-images" || phase === "compiling") && (
              <Button disabled size="lg">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {phase === "generating-images" ? "Generating Images..." : "Compiling..."}
              </Button>
            )}
            {phase === "done" && videoUrl && (
              <>
                <Button onClick={downloadVideo} size="lg">
                  <Download className="w-4 h-4 mr-2" /> Download Video
                </Button>
                <Button variant="outline" onClick={generateVideo}>
                  Regenerate
                </Button>
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>
    </div>
  );
}

// Helpers
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let ly = y;
  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, ly);
      line = word;
      ly += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, ly);
}
