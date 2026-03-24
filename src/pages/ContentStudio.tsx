import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clapperboard, Copy, Check, Loader2, Download, ImageIcon, Sparkles,
  Film, Type, Camera, Hash, MessageSquare, Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Scene {
  number: number;
  text: string;
  duration_seconds: number;
}

interface ImagePrompt {
  scene_number: number;
  prompt: string;
}

interface VideoScene {
  scene_number: number;
  description: string;
}

interface EditingInstructions {
  pacing: string;
  transitions: string;
  zoom_effects: string;
  caption_style: string;
  music_mood: string;
}

interface GeneratedContent {
  hook: string;
  scenes: Scene[];
  image_prompts: ImagePrompt[];
  video_scenes: VideoScene[];
  editing: EditingInstructions;
  caption: string;
  cta: string;
  hashtags: string[];
}

interface GeneratedImage {
  scene_number: number;
  url: string;
}

export default function ContentStudio() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setContent(null);
    setGeneratedImages([]);

    try {
      const { data, error } = await supabase.functions.invoke("content-studio", {
        body: { prompt: prompt.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data.content);
      toast.success("Content generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (sceneNumber: number, imagePrompt: string) => {
    setGeneratingImages((prev) => ({ ...prev, [sceneNumber]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: imagePrompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.image) {
        setGeneratedImages((prev) => [...prev, { scene_number: sceneNumber, url: data.image }]);
        toast.success(`Image for Scene ${sceneNumber} generated!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate image");
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copied to clipboard!");
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const exportFullScript = () => {
    if (!content) return;
    const script = [
      `HOOK:\n${content.hook}`,
      `\nSCENES:\n${content.scenes.map((s) => `${s.number}. ${s.text} (${s.duration_seconds}s)`).join("\n")}`,
      `\nIMAGE PROMPTS:\n${content.image_prompts.map((p) => `Scene ${p.scene_number}: ${p.prompt}`).join("\n\n")}`,
      `\nVIDEO SCENES:\n${content.video_scenes.map((v) => `Scene ${v.scene_number}: ${v.description}`).join("\n\n")}`,
      `\nEDITING INSTRUCTIONS:\n- Pacing: ${content.editing.pacing}\n- Transitions: ${content.editing.transitions}\n- Zoom: ${content.editing.zoom_effects}\n- Captions: ${content.editing.caption_style}\n- Music: ${content.editing.music_mood}`,
      `\nCAPTION:\n${content.caption}`,
      `\nCTA:\n${content.cta}`,
      `\nHASHTAGS:\n${content.hashtags.map((h) => `#${h}`).join(" ")}`,
    ].join("\n");
    copyToClipboard(script, "full-script");
  };

  const downloadImagePrompts = () => {
    if (!content) return;
    const text = content.image_prompts.map((p) => `Scene ${p.scene_number}:\n${p.prompt}`).join("\n\n---\n\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "image-prompts.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportForCanva = () => {
    if (!content) return;
    const csv = [
      "Scene,Text,Duration,Direction",
      ...content.scenes.map((s) => {
        const vid = content.video_scenes.find((v) => v.scene_number === s.number);
        return `${s.number},"${s.text}",${s.duration_seconds}s,"${vid?.description || ""}"`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scenes-for-canva.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Clapperboard className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Content Studio</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Generate complete, viral-ready TikTok content — scripts, image prompts, video scenes, and editing instructions — all from a single prompt.
          </p>
        </div>

        {/* Input */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="pt-6">
            <Textarea
              placeholder="e.g. Create a viral TikTok about AlterAI bots that make money online..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] text-base mb-4 bg-background border-border"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{prompt.length}/500</span>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim()} size="lg">
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {content && (
          <div className="space-y-6">
            {/* Export bar */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportFullScript}>
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Full Script
              </Button>
              <Button variant="outline" size="sm" onClick={downloadImagePrompts}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Download Image Prompts
              </Button>
              <Button variant="outline" size="sm" onClick={exportForCanva}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export for Canva (CSV)
              </Button>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview"><Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Overview</TabsTrigger>
                <TabsTrigger value="scenes"><Film className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Scenes</TabsTrigger>
                <TabsTrigger value="images"><ImageIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Images</TabsTrigger>
                <TabsTrigger value="video"><Camera className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Video</TabsTrigger>
                <TabsTrigger value="editing"><Type className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Editing</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Hook
                      <CopyBtn text={content.hook} field="hook" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-lg font-semibold text-foreground">{content.hook}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" /> Caption
                      <CopyBtn text={content.caption} field="caption" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{content.caption}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Call to Action
                      <CopyBtn text={content.cta} field="cta" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{content.cta}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Hash className="w-4 h-4 text-primary" /> Hashtags
                      <CopyBtn text={content.hashtags.map((h) => `#${h}`).join(" ")} field="hashtags" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {content.hashtags.map((tag) => (
                        <Badge key={tag} variant="secondary">#{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scenes Tab */}
              <TabsContent value="scenes" className="space-y-3 mt-4">
                {content.scenes.map((scene) => (
                  <Card key={scene.number}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0 mt-0.5">{scene.number}</Badge>
                          <div>
                            <p className="text-foreground">{scene.text}</p>
                            <p className="text-xs text-muted-foreground mt-1">{scene.duration_seconds}s</p>
                          </div>
                        </div>
                        <CopyBtn text={scene.text} field={`scene-${scene.number}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Image Prompts Tab */}
              <TabsContent value="images" className="space-y-4 mt-4">
                {content.image_prompts.map((ip) => {
                  const genImg = generatedImages.find((g) => g.scene_number === ip.scene_number);
                  return (
                    <Card key={ip.scene_number}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="shrink-0 mt-0.5">{ip.scene_number}</Badge>
                            <p className="text-sm text-foreground">{ip.prompt}</p>
                          </div>
                          <CopyBtn text={ip.prompt} field={`img-${ip.scene_number}`} />
                        </div>
                        {genImg ? (
                          <img
                            src={genImg.url}
                            alt={`Scene ${ip.scene_number}`}
                            className="rounded-lg w-full max-w-md border border-border"
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateImage(ip.scene_number, ip.prompt)}
                            disabled={generatingImages[ip.scene_number]}
                          >
                            {generatingImages[ip.scene_number] ? (
                              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
                            ) : (
                              <><ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Generate Image</>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Video Scenes Tab */}
              <TabsContent value="video" className="space-y-3 mt-4">
                {content.video_scenes.map((vs) => (
                  <Card key={vs.scene_number}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="shrink-0 mt-0.5">{vs.scene_number}</Badge>
                          <p className="text-sm text-foreground">{vs.description}</p>
                        </div>
                        <CopyBtn text={vs.description} field={`vid-${vs.scene_number}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Editing Tab */}
              <TabsContent value="editing" className="mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {Object.entries(content.editing).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {key.replace(/_/g, " ")}
                          </p>
                          <p className="text-foreground mt-0.5">{value}</p>
                        </div>
                        <CopyBtn text={value} field={`edit-${key}`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
