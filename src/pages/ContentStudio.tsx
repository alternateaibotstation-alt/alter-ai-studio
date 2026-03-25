import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clapperboard, Copy, Check, Loader2, Download, ImageIcon, Sparkles,
  Film, Type, Camera, Hash, MessageSquare, Zap, Video, FastForward
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import VideoCompiler from "@/components/VideoCompiler";
import CharacterProfileEditor, { StoryProfile, emptyStoryProfile } from "@/components/CharacterProfileEditor";
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

interface StorySegment {
  content: GeneratedContent;
  images: GeneratedImage[];
}

export default function ContentStudio() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [storyProfile, setStoryProfile] = useState<StoryProfile>(emptyStoryProfile);

  // Story continuation state
  const [storySegments, setStorySegments] = useState<StorySegment[]>([]);
  const [continuePrompt, setContinuePrompt] = useState("");
  const [continuing, setContinuing] = useState(false);

  const hasStoryProfile = storyProfile.characters.length > 0 || storyProfile.visualStyle || storyProfile.mood || storyProfile.setting;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setContent(null);
    setGeneratedImages([]);
    setStorySegments([]);

    try {
      const body: any = { prompt: prompt.trim() };
      if (hasStoryProfile) body.storyProfile = storyProfile;

      const { data, error } = await supabase.functions.invoke("content-studio", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setContent(data.content);
      setStorySegments([{ content: data.content, images: [] }]);
      toast.success("Content generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStory = async () => {
    if (!continuePrompt.trim() || !content) return;
    setContinuing(true);

    try {
      // Collect all scenes across segments for context
      const allScenes = storySegments.flatMap(seg => seg.content.scenes);

      const body: any = {
        prompt: continuePrompt.trim(),
        previousScenes: allScenes,
      };
      if (hasStoryProfile) body.storyProfile = storyProfile;

      const { data, error } = await supabase.functions.invoke("content-studio", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newContent = data.content as GeneratedContent;
      setStorySegments(prev => [...prev, { content: newContent, images: [] }]);

      // Merge into combined content for video generation
      setContent(prev => {
        if (!prev) return newContent;
        return {
          ...prev,
          scenes: [...prev.scenes, ...newContent.scenes],
          image_prompts: [...prev.image_prompts, ...newContent.image_prompts],
          video_scenes: [...prev.video_scenes, ...newContent.video_scenes],
          hook: prev.hook,
          caption: newContent.caption,
          cta: newContent.cta,
          hashtags: [...new Set([...prev.hashtags, ...newContent.hashtags])],
          editing: newContent.editing,
        };
      });

      setContinuePrompt("");
      toast.success("Story continued! New scenes added.");
    } catch (err: any) {
      toast.error(err.message || "Failed to continue story");
    } finally {
      setContinuing(false);
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
      const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || data?.image;
      if (imageUrl) {
        setGeneratedImages((prev) => [...prev, { scene_number: sceneNumber, url: imageUrl }]);
        toast.success(`Image for Scene ${sceneNumber} generated!`);
      } else {
        throw new Error("No image returned from AI");
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
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(text, field)}>
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

        {/* Character & Style Profile */}
        <div className="mb-4">
          <CharacterProfileEditor profile={storyProfile} onChange={setStoryProfile} />
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
            {/* Segment indicator */}
            {storySegments.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-medium">Story segments:</span>
                {storySegments.map((_, idx) => (
                  <Badge key={idx} variant={idx === storySegments.length - 1 ? "default" : "secondary"} className="text-xs">
                    Part {idx + 1}
                  </Badge>
                ))}
                <Badge variant="outline" className="text-xs">
                  {content.scenes.length} total scenes
                </Badge>
              </div>
            )}

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
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="overview"><Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Overview</TabsTrigger>
                <TabsTrigger value="scenes"><Film className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Scenes</TabsTrigger>
                <TabsTrigger value="images"><ImageIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Images</TabsTrigger>
                <TabsTrigger value="video"><Camera className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Video</TabsTrigger>
                <TabsTrigger value="editing"><Type className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Editing</TabsTrigger>
                <TabsTrigger value="continue" className="text-accent"><FastForward className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Continue</TabsTrigger>
                <TabsTrigger value="generate" className="text-primary"><Video className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Generate</TabsTrigger>
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
                {content.scenes.map((scene, idx) => {
                  // Find which segment this scene belongs to
                  let segIdx = 0;
                  let count = 0;
                  for (let s = 0; s < storySegments.length; s++) {
                    count += storySegments[s].content.scenes.length;
                    if (idx < count) { segIdx = s; break; }
                  }
                  return (
                    <Card key={`${scene.number}-${idx}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="shrink-0 mt-0.5">{scene.number}</Badge>
                            {storySegments.length > 1 && (
                              <Badge variant="secondary" className="shrink-0 mt-0.5 text-xs">Part {segIdx + 1}</Badge>
                            )}
                            <div>
                              <p className="text-foreground">{scene.text}</p>
                              <p className="text-xs text-muted-foreground mt-1">{scene.duration_seconds}s</p>
                            </div>
                          </div>
                          <CopyBtn text={scene.text} field={`scene-${scene.number}`} />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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

              {/* Continue Story Tab */}
              <TabsContent value="continue" className="mt-4 space-y-4">
                <Card className="border-accent/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FastForward className="w-4 h-4 text-accent" />
                      Continue the Story
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Add more scenes that continue from your existing {content.scenes.length} scenes.
                      {hasStoryProfile && " Your character profile will be maintained for consistency."}
                    </p>
                    <Textarea
                      placeholder="What happens next? e.g. 'The character discovers a hidden message and must make a choice...'"
                      value={continuePrompt}
                      onChange={(e) => setContinuePrompt(e.target.value)}
                      className="min-h-[80px] bg-background border-border"
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{continuePrompt.length}/500</span>
                      <Button onClick={handleContinueStory} disabled={continuing || !continuePrompt.trim()}>
                        {continuing ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Continuing...</>
                        ) : (
                          <><FastForward className="w-4 h-4 mr-2" /> Continue Story</>
                        )}
                      </Button>
                    </div>

                    {storySegments.length > 1 && (
                      <div className="pt-3 border-t border-border">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Story Timeline</p>
                        <div className="space-y-2">
                          {storySegments.map((seg, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <Badge variant={idx === 0 ? "default" : "secondary"} className="shrink-0 text-xs">
                                Part {idx + 1}
                              </Badge>
                              <span className="text-muted-foreground">
                                {seg.content.scenes.length} scenes — "{seg.content.hook}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Generate Video Tab */}
              <TabsContent value="generate" className="mt-4">
                <VideoCompiler
                  scenes={content.scenes}
                  imagePrompts={content.image_prompts}
                  hook={content.hook}
                  existingImages={generatedImages}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
