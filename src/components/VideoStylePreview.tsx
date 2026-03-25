import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import type { VideoStyle } from "./VideoStyleSettings";

interface Props {
  style: VideoStyle;
}

const CANVAS_W = 180;
const CANVAS_H = 320;
const SCALE = CANVAS_W / 1080;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

export default function VideoStylePreview({ style }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = CANVAS_W;
    const H = CANVAS_H;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, style.bgGradientTop);
    grad.addColorStop(0.5, style.bgGradientMid);
    grad.addColorStop(1, style.bgGradientBot);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Fake image placeholder (subtle rectangle)
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    const imgW = W * 0.7;
    const imgH = H * 0.4;
    ctx.fillRect((W - imgW) / 2, H * 0.2, imgW, imgH);

    // Overlay
    ctx.fillStyle = `rgba(0, 0, 0, ${style.overlayOpacity / 100})`;
    ctx.fillRect(0, 0, W, H);

    // Badge
    if (style.showBadge) {
      const badgeSize = 14 * SCALE * 3;
      const badgeX = W / 2 - badgeSize / 2;
      const badgeY = H * 0.12;
      ctx.fillStyle = hexToRgba(style.badgeColor, 0.9);
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = style.textColor;
      ctx.font = `bold ${Math.round(style.badgeTextSize * SCALE)}px ${style.fontFamily}`;
      ctx.textAlign = "center";
      ctx.fillText("1", W / 2, badgeY + badgeSize / 2 + Math.round(style.badgeTextSize * SCALE) / 3);
    }

    // Hook text
    const hookYFactor = style.hookPosition === "top" ? 0.25 : 0.5;
    ctx.fillStyle = style.hookColor;
    ctx.font = `bold ${Math.round(style.hookTextSize * SCALE)}px ${style.fontFamily}`;
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.7;
    wrapText(ctx, "Hook text preview", W / 2, H * hookYFactor, W - 20, Math.round(style.hookTextSize * SCALE * 1.35));
    ctx.globalAlpha = 1;

    // Scene text
    const textYFactor = style.textPosition === "upper" ? 0.3 : style.textPosition === "center" ? 0.5 : 0.75;
    ctx.fillStyle = style.textColor;
    ctx.font = `bold ${Math.round(style.sceneTextSize * SCALE)}px ${style.fontFamily}`;
    ctx.textAlign = "center";
    wrapText(ctx, "Scene text will appear here", W / 2, H * textYFactor, W - 20, Math.round(style.sceneTextSize * SCALE * 1.35));

    // Progress bar
    if (style.showProgressBar) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fillRect(0, H - 3, W, 3);
      ctx.fillStyle = style.progressBarColor;
      ctx.fillRect(0, H - 3, W * 0.4, 3);
    }
  }, [style]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="w-4 h-4 text-primary" /> Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="rounded-lg border border-border/50"
          style={{ width: CANVAS_W, height: CANVAS_H }}
        />
      </CardContent>
    </Card>
  );
}
