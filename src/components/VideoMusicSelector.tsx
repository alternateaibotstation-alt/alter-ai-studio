import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Music, Upload, X, Play, Pause, Volume2 } from "lucide-react";

export interface MusicSettings {
  audioFile: File | null;
  audioUrl: string | null;
  volume: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export const defaultMusicSettings: MusicSettings = {
  audioFile: null,
  audioUrl: null,
  volume: 70,
  fadeIn: true,
  fadeOut: true,
};

interface Props {
  settings: MusicSettings;
  onChange: (settings: MusicSettings) => void;
}

export default function VideoMusicSelector({ settings, onChange }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof MusicSettings>(key: K, value: MusicSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      return;
    }

    // Revoke previous URL
    if (settings.audioUrl) {
      URL.revokeObjectURL(settings.audioUrl);
    }

    const url = URL.createObjectURL(file);
    onChange({ ...settings, audioFile: file, audioUrl: url });
    setIsPlaying(false);
  };

  const removeAudio = () => {
    if (settings.audioUrl) {
      URL.revokeObjectURL(settings.audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onChange({ ...settings, audioFile: null, audioUrl: null });
    setIsPlaying(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePreview = () => {
    if (!settings.audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(settings.audioUrl);
      audioRef.current.volume = settings.volume / 100;
      audioRef.current.onended = () => setIsPlaying(false);
    }
    audioRef.current.volume = settings.volume / 100;
    audioRef.current.play();
    setIsPlaying(true);
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Music className="w-4 h-4 text-primary" /> Background Music
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Audio Track (MP3, WAV, OGG)</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {settings.audioFile ? (
            <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
              <Music className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm text-foreground truncate flex-1">
                {settings.audioFile.name}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={togglePreview}>
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={removeAudio}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload Audio File
            </Button>
          )}
        </div>

        {/* Volume */}
        {settings.audioFile && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Volume2 className="w-3 h-3" /> Volume ({settings.volume}%)
              </Label>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[settings.volume]}
                onValueChange={([v]) => {
                  update("volume", v);
                  if (audioRef.current) audioRef.current.volume = v / 100;
                }}
              />
            </div>

            {/* Fade options */}
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fadeIn}
                  onChange={(e) => update("fadeIn", e.target.checked)}
                  className="accent-primary"
                />
                Fade in
              </label>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.fadeOut}
                  onChange={(e) => update("fadeOut", e.target.checked)}
                  className="accent-primary"
                />
                Fade out
              </label>
            </div>
          </>
        )}

        <p className="text-[10px] text-muted-foreground/70">
          Upload any royalty-free audio file. The track will be mixed into the video with your chosen volume.
        </p>
      </CardContent>
    </Card>
  );
}
