import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SprayCan, Pen, Lightbulb, Droplets } from "lucide-react";
import type { BrushType } from "@/hooks/use-graffiti-canvas";

const BRUSHES: { type: BrushType; label: string; icon: React.ElementType }[] = [
  { type: "spray", label: "Spray Paint", icon: SprayCan },
  { type: "marker", label: "Marker", icon: Pen },
  { type: "neon", label: "Neon Brush", icon: Lightbulb },
  { type: "drip", label: "Drip Effect", icon: Droplets },
];

const PALETTE = [
  "#FF1493", "#FF4500", "#FFD700", "#00FF7F",
  "#00BFFF", "#8A2BE2", "#FF69B4", "#FFFFFF",
  "#E0E0E0", "#808080", "#1a1a2e", "#000000",
];

interface Props {
  brush: BrushType;
  setBrush: (b: BrushType) => void;
  color: string;
  setColor: (c: string) => void;
  size: number;
  setSize: (s: number) => void;
}

export default function GraffitiToolPanel({ brush, setBrush, color, setColor, size, setSize }: Props) {
  return (
    <div className="w-56 shrink-0 bg-card/80 backdrop-blur-xl border-r border-border p-4 flex flex-col gap-6 overflow-y-auto">
      {/* Brushes */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Brushes</h3>
        <div className="space-y-1">
          {BRUSHES.map((b) => (
            <button
              key={b.type}
              onClick={() => setBrush(b.type)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                brush === b.type
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent"
              }`}
            >
              <b.icon className="w-4 h-4" />
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Colors</h3>
        <div className="grid grid-cols-4 gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-9 h-9 rounded-lg border-2 transition-all hover:scale-110 ${
                color === c ? "border-primary ring-2 ring-primary/30 scale-110" : "border-border"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="mt-3">
          <label className="text-xs text-muted-foreground block mb-1">Custom</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-8 rounded-md cursor-pointer border border-border bg-transparent"
          />
        </div>
      </div>

      {/* Size */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Size <span className="text-primary">{size}px</span>
        </h3>
        <Slider
          value={[size]}
          onValueChange={(v) => setSize(v[0])}
          min={2}
          max={80}
          step={1}
        />
      </div>

      {/* Preview */}
      <div className="flex-1 flex items-end">
        <div className="w-full rounded-lg bg-secondary/50 border border-border p-4 flex items-center justify-center">
          <div
            className="rounded-full transition-all"
            style={{
              width: Math.min(size * 2, 80),
              height: Math.min(size * 2, 80),
              backgroundColor: color,
              boxShadow: `0 0 ${size}px ${color}40`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
