import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Drama, Building2, Gem, Loader2 } from "lucide-react";
import { useState } from "react";

const AI_ACTIONS = [
  { id: "enhance", label: "Enhance My Graffiti", icon: Sparkles, prompt: "Enhance this graffiti artwork. Make the colors more vibrant, add depth and shading, improve the line quality while keeping the raw street art feel. Make it look like a professional graffiti piece." },
  { id: "remix", label: "Remix Style", icon: RefreshCw, prompt: "Remix this graffiti in a completely different street art style. Change the aesthetic while keeping the core shapes and composition. Add new artistic elements like tags, throw-ups, or wildstyle lettering." },
  { id: "anime", label: "Turn Into Anime", icon: Drama, prompt: "Transform this graffiti artwork into anime/manga art style. Keep the composition but render it with anime aesthetics - cel shading, dramatic lighting, anime eyes if there are characters, speed lines, and vibrant anime colors." },
  { id: "mural", label: "Make It a Mural", icon: Building2, prompt: "Transform this into a large-scale photorealistic mural on a building wall. Show the artwork painted on a brick or concrete surface with realistic texture, lighting, and urban surroundings. Make it look like a real street mural." },
  { id: "upscale", label: "Clean & Upscale", icon: Gem, prompt: "Clean up and upscale this graffiti artwork. Smooth out rough edges, enhance details, improve color consistency, and make it look polished and professional while maintaining the street art character." },
];

interface Props {
  getCanvasDataUrl: () => string | null;
  loadImageToCanvas: (url: string) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export default function GraffitiAIPanel({ getCanvasDataUrl, loadImageToCanvas, onError, onSuccess }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("Draw something and let AI enhance it! 🎨");

  const handleAIAction = async (actionId: string, prompt: string) => {
    const dataUrl = getCanvasDataUrl();
    if (!dataUrl) return;

    setLoading(actionId);
    setFeedback("AI is working its magic... ✨");

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          prompt,
          model: "google/gemini-2.5-flash-image",
          editImageUrl: dataUrl,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("No image returned from AI");

      loadImageToCanvas(imageUrl);
      setFeedback("🔥 AI remix complete! Looking fire.");
      onSuccess("AI enhancement applied!");
    } catch (err: any) {
      const msg = err.message || "AI enhancement failed";
      setFeedback("Something went wrong. Try again? 🤔");
      onError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-60 shrink-0 bg-card/80 backdrop-blur-xl border-l border-border p-4 flex flex-col gap-4 overflow-y-auto">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">AI Magic 🤖</h3>

      <div className="space-y-2">
        {AI_ACTIONS.map((action) => (
          <Button
            key={action.id}
            variant="secondary"
            className="w-full justify-start gap-2 h-auto py-3 text-left"
            disabled={loading !== null}
            onClick={() => handleAIAction(action.id, action.prompt)}
          >
            {loading === action.id ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            ) : (
              <action.icon className="w-4 h-4 shrink-0" />
            )}
            <span className="text-sm">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* AI Feedback */}
      <div className="mt-auto">
        <div className="rounded-lg bg-secondary/50 border border-border p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">AI Says:</p>
          <p className="text-sm text-foreground leading-relaxed">{feedback}</p>
        </div>
      </div>
    </div>
  );
}
