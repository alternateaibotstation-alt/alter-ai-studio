import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings2, Upload, Trash2, Volume2 } from "lucide-react";
import { toast } from "sonner";

export interface VoiceConfig {
  enabled: boolean;
  voiceId: string; // "browser-default" | built-in name | "custom-<n>"
  customVoiceUrl?: string;
  customVoiceName?: string;
}

const BUILT_IN_VOICES = [
  { id: "browser-default", name: "Default", description: "Your browser's default voice" },
  { id: "Google UK English Male", name: "British Male", description: "UK English accent" },
  { id: "Google UK English Female", name: "British Female", description: "UK English accent" },
  { id: "Google US English", name: "American", description: "US English accent" },
  { id: "Microsoft David", name: "David", description: "Natural male voice" },
  { id: "Microsoft Zira", name: "Zira", description: "Natural female voice" },
  { id: "Alex", name: "Alex", description: "macOS voice" },
  { id: "Samantha", name: "Samantha", description: "macOS voice" },
];

interface Props {
  config: VoiceConfig;
  onChange: (config: VoiceConfig) => void;
}

export default function VoiceSettingsPanel({ config, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadVoices = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          setAvailableVoices(window.speechSynthesis.getVoices());
        };
      }
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) loadVoices();
  };

  const previewVoice = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hey! This is how I sound. Pretty cool, right?");

    if (config.voiceId !== "browser-default") {
      const match = availableVoices.find(
        (v) => v.name === config.voiceId || v.name.includes(config.voiceId)
      );
      if (match) utterance.voice = match;
    }

    utterance.onstart = () => setPreviewPlaying(true);
    utterance.onend = () => setPreviewPlaying(false);
    utterance.onerror = () => setPreviewPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file (MP3, WAV, etc.)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    onChange({
      ...config,
      voiceId: "custom-upload",
      customVoiceUrl: url,
      customVoiceName: file.name,
    });
    toast.success(`Voice sample "${file.name}" loaded!`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const clearCustomVoice = () => {
    if (config.customVoiceUrl) URL.revokeObjectURL(config.customVoiceUrl);
    onChange({
      ...config,
      voiceId: "browser-default",
      customVoiceUrl: undefined,
      customVoiceName: undefined,
    });
  };

  // Get system voices grouped
  const systemVoices = availableVoices.filter((v) => v.lang.startsWith("en"));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" title="Voice settings">
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[340px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-foreground">Voice Settings</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Enable/Disable TTS */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Voice Responses</p>
              <p className="text-xs text-muted-foreground">Bot reads responses aloud</p>
            </div>
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => onChange({ ...config, enabled: checked })}
            />
          </div>

          {config.enabled && (
            <>
              {/* Voice Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Choose Voice</label>
                <Select
                  value={config.voiceId}
                  onValueChange={(val) => onChange({ ...config, voiceId: val })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="browser-default">Default Voice</SelectItem>
                    {systemVoices.length > 0 && (
                      <>
                        {systemVoices.map((v) => (
                          <SelectItem key={v.name} value={v.name}>
                            {v.name} {v.lang && `(${v.lang})`}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {systemVoices.length === 0 &&
                      BUILT_IN_VOICES.filter((v) => v.id !== "browser-default").map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name} — {v.description}
                        </SelectItem>
                      ))}
                    {config.customVoiceUrl && (
                      <SelectItem value="custom-upload">
                        🎤 {config.customVoiceName || "Custom Upload"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={previewVoice}
                disabled={previewPlaying || config.voiceId === "custom-upload"}
              >
                <Volume2 className="w-4 h-4" />
                {previewPlaying ? "Playing..." : "Preview Voice"}
              </Button>

              {/* Upload Custom Voice */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Upload Voice Sample</label>
                <p className="text-xs text-muted-foreground">
                  Upload an audio file to use as a reference voice. The bot will speak in a style inspired by the sample.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Upload Audio File
                </Button>

                {config.customVoiceUrl && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary border border-border">
                    <span className="text-xs text-foreground flex-1 truncate">
                      🎤 {config.customVoiceName}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearCustomVoice}>
                      <Trash2 className="w-3 h-3 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Info note */}
              <div className="rounded-lg bg-secondary/50 border border-border p-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  💡 Voice availability depends on your browser. Chrome offers the most voices. Custom uploads play the sample audio alongside bot responses for a personalized feel.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
