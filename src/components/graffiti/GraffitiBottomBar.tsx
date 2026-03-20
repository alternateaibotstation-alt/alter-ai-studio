import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Trash2, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  getCanvasDataUrl: () => string | null;
  addWatermark: boolean;
}

function applyWatermark(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return reject(new Error("No context"));

    ctx.drawImage(canvas, 0, 0);

    const text = "Remixed with Alter AI ✨";
    ctx.save();
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    const x = canvas.width - 20;
    const y = canvas.height - 16;

    const metrics = ctx.measureText(text);
    const pad = 10;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.roundRect(
      x - metrics.width - pad * 2,
      y - 26 - pad,
      metrics.width + pad * 3,
      26 + pad * 2,
      12
    );
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.fillText(text, x - pad, y);
    ctx.restore();

    offscreen.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

export default function GraffitiBottomBar({ canUndo, canRedo, onUndo, onRedo, onClear, getCanvasDataUrl, addWatermark }: Props) {
  const getExportBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return null;

    if (addWatermark) {
      const img = new Image();
      return new Promise((resolve) => {
        img.onload = async () => {
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = img.width;
          tempCanvas.height = img.height;
          const ctx = tempCanvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);
          try {
            const blob = await applyWatermark(tempCanvas);
            resolve({ blob, dataUrl: URL.createObjectURL(blob) });
          } catch {
            const blob = await (await fetch(dataUrl)).blob();
            resolve({ blob, dataUrl });
          }
        };
        img.src = dataUrl;
      });
    }

    const blob = await (await fetch(dataUrl)).blob();
    return { blob, dataUrl };
  };

  const handleDownload = async () => {
    const result = await getExportBlob();
    if (!result) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(result.blob);
    link.download = `graffiti-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Image downloaded!");
  };

  const handleShare = async () => {
    const result = await getExportBlob();
    if (!result) return;

    try {
      const file = new File([result.blob], "graffiti.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My Graffiti — Alter AI",
          text: "Check out this graffiti I made with AI! 🎨🔥",
          files: [file],
        });
      } else {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": result.blob })]);
        toast.success("Copied to clipboard!");
      }
    } catch {
      toast.error("Sharing failed");
    }
  };

  return (
    <div className="h-14 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 overflow-x-auto">
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo} className="shrink-0">
        <Undo2 className="w-4 h-4 sm:mr-1" />
        <span className="hidden sm:inline">Undo</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo} className="shrink-0">
        <Redo2 className="w-4 h-4 sm:mr-1" />
        <span className="hidden sm:inline">Redo</span>
      </Button>
      <div className="w-px h-6 bg-border mx-1 sm:mx-2 shrink-0" />
      <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive hover:text-destructive shrink-0">
        <Trash2 className="w-4 h-4 sm:mr-1" />
        <span className="hidden sm:inline">Clear</span>
      </Button>
      <div className="w-px h-6 bg-border mx-1 sm:mx-2 shrink-0" />
      <Button variant="ghost" size="sm" onClick={handleDownload} className="shrink-0">
        <Download className="w-4 h-4 sm:mr-1" />
        <span className="hidden sm:inline">Download</span>
      </Button>
      <Button size="sm" onClick={handleShare} className="gap-1 shrink-0">
        <Share2 className="w-4 h-4" />
        <span className="hidden sm:inline">Share</span>
      </Button>
    </div>
  );
}
