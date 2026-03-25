import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Palette, Type, Move } from "lucide-react";

export interface VideoStyle {
  fontFamily: string;
  sceneTextSize: number;
  hookTextSize: number;
  badgeTextSize: number;
  textColor: string;
  hookColor: string;
  badgeColor: string;
  bgGradientTop: string;
  bgGradientMid: string;
  bgGradientBot: string;
  overlayOpacity: number;
  textPosition: "center" | "upper" | "lower";
  hookPosition: "top" | "center";
  showBadge: boolean;
  showProgressBar: boolean;
  progressBarColor: string;
}

export const defaultVideoStyle: VideoStyle = {
  fontFamily: "sans-serif",
  sceneTextSize: 42,
  hookTextSize: 36,
  badgeTextSize: 24,
  textColor: "#ffffff",
  hookColor: "#ec4899",
  badgeColor: "#ec4899",
  bgGradientTop: "#0a0a0f",
  bgGradientMid: "#1a1a2e",
  bgGradientBot: "#0a0a0f",
  overlayOpacity: 35,
  textPosition: "lower",
  hookPosition: "top",
  showBadge: true,
  showProgressBar: true,
  progressBarColor: "#ec4899",
};

const FONT_OPTIONS = [
  { value: "sans-serif", label: "Sans Serif (Default)" },
  { value: "serif", label: "Serif" },
  { value: "monospace", label: "Monospace" },
  { value: "'Arial Black', sans-serif", label: "Arial Black" },
  { value: "'Georgia', serif", label: "Georgia" },
  { value: "'Impact', sans-serif", label: "Impact" },
  { value: "'Courier New', monospace", label: "Courier New" },
];

interface Props {
  style: VideoStyle;
  onChange: (style: VideoStyle) => void;
}

export default function VideoStyleSettings({ style, onChange }: Props) {
  const update = <K extends keyof VideoStyle>(key: K, value: VideoStyle[K]) => {
    onChange({ ...style, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Typography */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Type className="w-4 h-4 text-primary" /> Typography
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Font</Label>
            <Select value={style.fontFamily} onValueChange={(v) => update("fontFamily", v)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Scene Text</Label>
              <Slider min={24} max={72} step={2} value={[style.sceneTextSize]} onValueChange={([v]) => update("sceneTextSize", v)} />
              <span className="text-[10px] text-muted-foreground">{style.sceneTextSize}px</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hook Text</Label>
              <Slider min={20} max={60} step={2} value={[style.hookTextSize]} onValueChange={([v]) => update("hookTextSize", v)} />
              <span className="text-[10px] text-muted-foreground">{style.hookTextSize}px</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Badge</Label>
              <Slider min={16} max={40} step={2} value={[style.badgeTextSize]} onValueChange={([v]) => update("badgeTextSize", v)} />
              <span className="text-[10px] text-muted-foreground">{style.badgeTextSize}px</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" /> Colors
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Text</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={style.textColor} onChange={(e) => update("textColor", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
                <span className="text-[10px] text-muted-foreground font-mono">{style.textColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hook</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={style.hookColor} onChange={(e) => update("hookColor", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
                <span className="text-[10px] text-muted-foreground font-mono">{style.hookColor}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Badge</Label>
              <div className="flex items-center gap-2">
                <Input type="color" value={style.badgeColor} onChange={(e) => update("badgeColor", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
                <span className="text-[10px] text-muted-foreground font-mono">{style.badgeColor}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">BG Top</Label>
              <Input type="color" value={style.bgGradientTop} onChange={(e) => update("bgGradientTop", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">BG Mid</Label>
              <Input type="color" value={style.bgGradientMid} onChange={(e) => update("bgGradientMid", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">BG Bottom</Label>
              <Input type="color" value={style.bgGradientBot} onChange={(e) => update("bgGradientBot", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image Overlay Dimness ({style.overlayOpacity}%)</Label>
            <Slider min={0} max={80} step={5} value={[style.overlayOpacity]} onValueChange={([v]) => update("overlayOpacity", v)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Progress Bar</Label>
            <div className="flex items-center gap-2">
              <Input type="color" value={style.progressBarColor} onChange={(e) => update("progressBarColor", e.target.value)} className="w-8 h-8 p-0.5 cursor-pointer border-border" />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={style.showProgressBar} onChange={(e) => update("showProgressBar", e.target.checked)} className="accent-primary" />
                Show
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Move className="w-4 h-4 text-primary" /> Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Scene Text Position</Label>
              <Select value={style.textPosition} onValueChange={(v) => update("textPosition", v as VideoStyle["textPosition"])}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upper">Upper Third</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="lower">Lower Third</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hook Position</Label>
              <Select value={style.hookPosition} onValueChange={(v) => update("hookPosition", v as VideoStyle["hookPosition"])}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={style.showBadge} onChange={(e) => update("showBadge", e.target.checked)} className="accent-primary" />
            Show scene number badge
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
