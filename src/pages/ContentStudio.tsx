import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clapperboard, Copy, Check, Loader2, Download, ImageIcon, Sparkles,
  Film, Type, Camera, Hash, MessageSquare, Zap, FastForward, Pencil,
  Video
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

// Inline editable text component
function EditableText({ value, onChange, multiline = false, className = "" }: {
  value: string;
  onChange: (val: string) => void;
  multiline?: boolean;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => { setDraft(value); setEditing(true); };
  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => setEditing(false);

  if (editing) {
    return multiline ? (
      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="bg-background border-border text-sm min-h-[60px]"
          autoFocus
          onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
        />
        <div className="flex gap-2">
          <Button size="sm" variant="default" onClick={save}>Save</Button>
          <Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button>
        </div>
      </div>
    ) : (
      <div className="flex gap-2 items-center w-full">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="bg-background border-border text-sm h-8 flex-1"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
        <Button size="sm" variant="default" onClick={save} className="h-8">Save</Button>
        <Button size="sm" variant="ghost" onClick={cancel} className="h-8">Cancel</Button>
      </div>
    );
  }

  return (
    <div
      className={`group cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 ${className}`}
      onClick={startEdit}
      title="Click to edit"
    >
      <span>{value}</span>
      <Pencil className="w-3 h-3 text-muted-foreground ml-2 inline opacity-0 group-hover:opacity-100" />
    </div>
  );
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

  // Updaters for inline editing
  const updateHook = (val: string) => setContent(prev => prev ? { ...prev, hook: val } : prev);
  const updateCaption = (val: string) => setContent(prev => prev ? { ...prev, caption: val } : prev);
  const updateCta = (val: string) => setContent(prev => prev ? { ...prev, cta: val } : prev);
  const updateSceneText = (idx: number, val: string) => setContent(prev => {
    if (!prev) return prev;
    const scenes = [...prev.scenes];
    scenes[idx] = { ...scenes[idx], text: val };
    return { ...prev, scenes };
  });
  const updateSceneDuration = (idx: number, val: number) => setContent(prev => {
    if (!prev) return prev;
    const scenes = [...prev.scenes];
    scenes[idx] = { ...scenes[idx], duration_seconds: Math.max(1, val) };
    return { ...prev, scenes };
  });
  const updateImagePrompt = (idx: number, val: string) => setContent(prev => {
    if (!prev) return prev;
    const prompts = [...prev.image_prompts];
    prompts[idx] = { ...prompts[idx], prompt: val };
    return { ...prev, image_prompts: prompts };
  });
  const updateVideoScene = (idx: number, val: string) => setContent(prev => {
    if (!prev) return prev;
    const vs = [...prev.video_scenes];
    vs[idx] = { ...vs[idx], description: val };
    return { ...prev, video_scenes: vs };
  });
  const updateEditing = (key: string, val: string) => setContent(prev => {
    if (!prev) return prev;
    return { ...prev, editing: { ...prev.editing, [key]: val } };
  });

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
      const allScenes = storySegments.flatMap(seg => seg.content.scenes);
      const body: any = { prompt: continuePrompt.trim(), previousScenes: allScenes };
      if (hasStoryProfile) body.storyProfile = storyProfile;

      const { data, error } = await supabase.functions.invoke("content-studio", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newContent = data.content as GeneratedContent;
      setStorySegments(prev => [...prev, { content: newContent, images: [] }]);

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

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Pencil className="w-3 h-3" /> Click any text to edit it before generating your video
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview"><Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Overview</TabsTrigger>
                <TabsTrigger value="scenes"><Film className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Scenes</TabsTrigger>
                <TabsTrigger value="images"><ImageIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Images</TabsTrigger>
                <TabsTrigger value="editing"><Type className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Editing</TabsTrigger>
                <TabsTrigger value="continue" className="text-accent"><FastForward className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Continue</TabsTrigger>
                <TabsTrigger value="video" className="text-primary"><Video className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Video</TabsTrigger>
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
                    <EditableText
                      value={content.hook}
                      onChange={updateHook}
                      className="text-lg font-semibold text-foreground"
                    />
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
                    <EditableText
                      value={content.caption}
                      onChange={updateCaption}
                      className="text-foreground"
                    />
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
                    <EditableText
                      value={content.cta}
                      onChange={updateCta}
                      className="text-foreground"
                    />
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
                          <div className="flex items-start gap-3 flex-1">
                            <Badge variant="outline" className="shrink-0 mt-0.5">{scene.number}</Badge>
                            {storySegments.length > 1 && (
                              <Badge variant="secondary" className="shrink-0 mt-0.5 text-xs">Part {segIdx + 1}</Badge>
                            )}
                            <div className="flex-1">
                              <EditableText
                                value={scene.text}
                                onChange={(val) => updateSceneText(idx, val)}
                                multiline
                                className="text-foreground"
                              />
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-muted-foreground">Duration:</span>
                                <input
                                  type="number"
                                  value={scene.duration_seconds}
                                  onChange={(e) => updateSceneDuration(idx, parseInt(e.target.value) || 3)}
                                  className="w-14 h-6 text-xs bg-background border border-border rounded px-1.5 text-foreground"
                                  min={1}
                                  max={30}
                                />
                                <span className="text-xs text-muted-foreground">s</span>
                              </div>
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
                {content.image_prompts.map((ip, idx) => {
                  const genImg = generatedImages.find((g) => g.scene_number === ip.scene_number);
                  return (
                    <Card key={ip.scene_number}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Badge variant="outline" className="shrink-0 mt-0.5">{ip.scene_number}</Badge>
                            <EditableText
                              value={ip.prompt}
                              onChange={(val) => updateImagePrompt(idx, val)}
                              multiline
                              className="text-sm text-foreground"
                            />
                          </div>
                          <CopyBtn text={ip.prompt} field={`img-${ip.scene_number}`} />
                        </div>
                        {genImg ? (
                          <div className="space-y-2">
                            <img
                              src={genImg.url}
                              alt={`Scene ${ip.scene_number}`}
                              className="rounded-lg w-full max-w-md border border-border"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setGeneratedImages(prev => prev.filter(g => g.scene_number !== ip.scene_number));
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Regenerate Image
                            </Button>
                          </div>
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

              {/* Editing Tab */}
              <TabsContent value="editing" className="mt-4 space-y-4">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    {Object.entries(content.editing).map(([key, value]) => (
                      <div key={key} className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {key.replace(/_/g, " ")}
                          </p>
                          <EditableText
                            value={value}
                            onChange={(val) => updateEditing(key, val)}
                            className="text-foreground mt-0.5"
                          />
                        </div>
                        <CopyBtn text={value} field={`edit-${key}`} />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Video direction notes */}
                {content.video_scenes.length > 0 && (
                  <>
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2 pt-2">
                      <Camera className="w-4 h-4" /> Video Direction Notes
                    </h3>
                    {content.video_scenes.map((vs, idx) => (
                      <Card key={vs.scene_number}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <Badge variant="outline" className="shrink-0 mt-0.5">{vs.scene_number}</Badge>
                              <EditableText
                                value={vs.description}
                                onChange={(val) => updateVideoScene(idx, val)}
                                multiline
                                className="text-sm text-foreground"
                              />
                            </div>
                            <CopyBtn text={vs.description} field={`vid-${vs.scene_number}`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
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

              {/* Video Generation Tab */}
              <TabsContent value="video" className="mt-4">
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
