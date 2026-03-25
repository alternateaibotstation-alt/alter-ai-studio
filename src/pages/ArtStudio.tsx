import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, Sparkles, Image as ImageIcon, Trash2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PaywallModal from "@/components/PaywallModal";
import UsageBadge from "@/components/UsageBadge";
import { useCreations } from "@/hooks/use-creations";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

const MODELS = [
  { value: "google/gemini-2.5-flash-image", label: "Nano Banana (Fast)" },
  { value: "google/gemini-3-pro-image-preview", label: "Nano Banana Pro (High Quality)" },
  { value: "google/gemini-3.1-flash-image-preview", label: "Nano Banana 2 (Fast + Quality)" },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  imageUrl: string;
  model: string;
  createdAt: Date;
}

export default function ArtStudio() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash-image");
  const [generating, setGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const { canGenerateImage, refresh: refreshSub } = useSubscription();

  const generate = async () => {
    if (!prompt.trim()) return;

    // Check image generation limits
    if (!canGenerateImage()) {
      setPaywallOpen(true);
      return;
    }

    setGenerating(true);
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: prompt.trim(), model }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageUrl) throw new Error("No image returned");

      setGallery((prev) => [
        {
          id: Date.now().toString(),
          prompt: prompt.trim(),
          imageUrl,
          model,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      toast.success("Image generated!");
    } catch (err: any) {
      const errMsg = err.message || "Failed to generate image";
      if (errMsg === "LIMIT_IMAGES") {
        setPaywallOpen(true);
      } else {
        toast.error(errMsg);
      }
    } finally {
      setGenerating(false);
      refreshSub();
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement("a");
    link.href = img.imageUrl;
    link.download = `art-${img.id}.png`;
    link.click();
  };

  const removeImage = (id: string) => {
    setGallery((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            Art Studio
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-muted-foreground">
              Generate AI art and images using text prompts
            </p>
            <UsageBadge />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to create... e.g. 'A serene mountain landscape at sunset with vibrant colors'"
            className="bg-secondary border-border min-h-[100px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                generate();
              }
            }}
          />
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-1 block">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generate} disabled={generating || !prompt.trim()} className="min-w-[140px]">
              {generating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><ImageIcon className="w-4 h-4 mr-2" /> Generate</>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Press ⌘+Enter to generate. Use detailed descriptions for better results.
          </p>
        </div>

        {gallery.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-foreground mb-4">Gallery</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gallery.map((img) => (
                <div key={img.id} className="rounded-xl border border-border bg-card overflow-hidden group">
                  <div className="aspect-square relative">
                    <img
                      src={img.imageUrl}
                      alt={img.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => downloadImage(img)}>
                        <Download className="w-4 h-4 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => removeImage(img.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{img.prompt}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {MODELS.find((m) => m.value === img.model)?.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason="images" />
    </div>
  );
}
