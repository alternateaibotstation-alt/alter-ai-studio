import { Button } from "@/components/ui/button";
import { Undo2, Redo2, Trash2, Save, Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  getCanvasDataUrl: () => string | null;
}

export default function GraffitiBottomBar({ canUndo, canRedo, onUndo, onRedo, onClear, getCanvasDataUrl }: Props) {
  const handleDownload = () => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `graffiti-${Date.now()}.png`;
    link.click();
    toast.success("Image downloaded!");
  };

  const handleShare = async () => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "graffiti.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "My Graffiti — Alter AI",
          text: "Check out this graffiti I made with AI! 🎨🔥",
          files: [file],
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        toast.success("Copied to clipboard!");
      }
    } catch {
      toast.error("Sharing failed");
    }
  };

  return (
    <div className="h-14 bg-card/80 backdrop-blur-xl border-t border-border flex items-center justify-center gap-2 px-4">
      <Button variant="ghost" size="sm" onClick={onUndo} disabled={!canUndo}>
        <Undo2 className="w-4 h-4 mr-1" /> Undo
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} disabled={!canRedo}>
        <Redo2 className="w-4 h-4 mr-1" /> Redo
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button variant="ghost" size="sm" onClick={onClear} className="text-destructive hover:text-destructive">
        <Trash2 className="w-4 h-4 mr-1" /> Clear
      </Button>
      <div className="w-px h-6 bg-border mx-2" />
      <Button variant="ghost" size="sm" onClick={handleDownload}>
        <Download className="w-4 h-4 mr-1" /> Download
      </Button>
      <Button size="sm" onClick={handleShare} className="gap-1">
        <Share2 className="w-4 h-4" /> Share
      </Button>
    </div>
  );
}
