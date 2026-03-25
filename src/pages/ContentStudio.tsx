import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clapperboard, Copy, Check, Loader2, Download, ImageIcon, Sparkles,
  Film, Type, Camera, Hash, MessageSquare, Zap, FastForward, Pencil,
  Video, Globe, Mic, Volume2, Square, Play, Pause
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import VideoCompiler from "@/components/VideoCompiler";
import CharacterProfileEditor, { StoryProfile, emptyStoryProfile } from "@/components/CharacterProfileEditor";
import { toast } from "sonner";

// Platform definitions
const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "bg-pink-500/20 text-pink-400 border-pink-500/30" },
  { id: "instagram", label: "Instagram", icon: "📸", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  { id: "facebook", label: "Facebook", icon: "📘", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { id: "pinterest", label: "Pinterest", icon: "📌", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", color: "bg-sky-500/20 text-sky-400 border-sky-500/30" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
] as const;

type PlatformId = typeof PLATFORMS[number]["id"];

// Inline editable text
function EditableText({ value, onChange, multiline = false, className = "" }: {
  value: string; onChange: (val: string) => void; multiline?: boolean; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const startEdit = () => { setDraft(value); setEditing(true); };
  const save = () => { onChange(draft); setEditing(false); };
  const cancel = () => setEditing(false);

  if (editing) {
    return multiline ? (
      <div className="space-y-2">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="bg-background border-border text-sm min-h-[60px]" autoFocus onKeyDown={(e) => { if (e.key === "Escape") cancel(); }} />
        <div className="flex gap-2"><Button size="sm" onClick={save}>Save</Button><Button size="sm" variant="ghost" onClick={cancel}>Cancel</Button></div>
      </div>
    ) : (
      <div className="flex gap-2 items-center w-full">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="bg-background border-border text-sm h-8 flex-1" autoFocus onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }} />
        <Button size="sm" onClick={save} className="h-8">Save</Button><Button size="sm" variant="ghost" onClick={cancel} className="h-8">Cancel</Button>
      </div>
    );
  }
  return (
    <div className={`group cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 ${className}`} onClick={startEdit} title="Click to edit">
      <span>{value}</span>
      <Pencil className="w-3 h-3 text-muted-foreground ml-2 inline opacity-0 group-hover:opacity-100" />
    </div>
  );
}

export default function ContentStudio() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(["tiktok"]);
  const [platformContent, setPlatformContent] = useState<Record<string, any>>({});
  const [platformErrors, setPlatformErrors] = useState<Record<string, string>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<{ scene_number: number; url: string }[]>([]);
  const [storyProfile, setStoryProfile] = useState<StoryProfile>(emptyStoryProfile);
  const [storySegments, setStorySegments] = useState<any[]>([]);
  const [continuePrompt, setContinuePrompt] = useState("");
  const [continuing, setContinuing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("tiktok");

  const hasStoryProfile = storyProfile.characters.length > 0 || storyProfile.visualStyle || storyProfile.mood || storyProfile.setting;

  const togglePlatform = (id: PlatformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedPlatforms(PLATFORMS.map(p => p.id));

  const handleGenerate = async () => {
    if (!prompt.trim() || selectedPlatforms.length === 0) return;
    setLoading(true);
    setPlatformContent({});
    setPlatformErrors({});
    setGeneratedImages([]);
    setStorySegments([]);

    try {
      const body: any = { prompt: prompt.trim(), platforms: selectedPlatforms };
      if (hasStoryProfile) body.storyProfile = storyProfile;

      const { data, error } = await supabase.functions.invoke("content-studio", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setPlatformContent(data.content || {});
      setPlatformErrors(data.errors || {});

      if (data.content?.tiktok) {
        setStorySegments([{ content: data.content.tiktok, images: [] }]);
      }

      const successCount = Object.keys(data.content || {}).length;
      const errorCount = Object.keys(data.errors || {}).length;
      if (successCount > 0) toast.success(`Content generated for ${successCount} platform${successCount > 1 ? "s" : ""}!`);
      if (errorCount > 0) toast.error(`Failed for ${errorCount} platform${errorCount > 1 ? "s" : ""}`);

      // Auto-switch to first successful platform tab
      const firstSuccess = selectedPlatforms.find(p => data.content?.[p]);
      if (firstSuccess) setActiveTab(firstSuccess);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueStory = async () => {
    if (!continuePrompt.trim() || !platformContent.tiktok) return;
    setContinuing(true);
    try {
      const allScenes = storySegments.flatMap((seg: any) => seg.content.scenes || []);
      const body: any = { prompt: continuePrompt.trim(), platforms: ["tiktok"], previousScenes: allScenes };
      if (hasStoryProfile) body.storyProfile = storyProfile;

      const { data, error } = await supabase.functions.invoke("content-studio", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newTiktok = data.content?.tiktok;
      if (newTiktok) {
        setStorySegments(prev => [...prev, { content: newTiktok, images: [] }]);
        setPlatformContent(prev => {
          const oldTk = prev.tiktok || {};
          return {
            ...prev,
            tiktok: {
              ...oldTk,
              scenes: [...(oldTk.scenes || []), ...(newTiktok.scenes || [])],
              image_prompts: [...(oldTk.image_prompts || []), ...(newTiktok.image_prompts || [])],
              video_scenes: [...(oldTk.video_scenes || []), ...(newTiktok.video_scenes || [])],
              hook: oldTk.hook,
              caption: newTiktok.caption,
              cta: newTiktok.cta,
              hashtags: [...new Set([...(oldTk.hashtags || []), ...(newTiktok.hashtags || [])])],
              editing: newTiktok.editing,
            },
          };
        });
        setContinuePrompt("");
        toast.success("Story continued!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to continue story");
    } finally {
      setContinuing(false);
    }
  };

  const handleGenerateImage = async (sceneNumber: number, imagePrompt: string) => {
    setGeneratingImages(prev => ({ ...prev, [sceneNumber]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", { body: { prompt: imagePrompt } });
      if (error) throw error;
      const imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || data?.image;
      if (imageUrl) {
        setGeneratedImages(prev => [...prev, { scene_number: sceneNumber, url: imageUrl }]);
        toast.success(`Image for Scene ${sceneNumber} generated!`);
      } else throw new Error("No image returned");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate image");
    } finally {
      setGeneratingImages(prev => ({ ...prev, [sceneNumber]: false }));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copied!");
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(text, field)}>
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const copyPlatformContent = (platformId: string) => {
    const data = platformContent[platformId];
    if (!data) return;
    copyToClipboard(JSON.stringify(data, null, 2), `platform-${platformId}`);
  };

  const exportAllPlatforms = () => {
    const all = Object.entries(platformContent)
      .map(([p, c]) => `=== ${p.toUpperCase()} ===\n${JSON.stringify(c, null, 2)}`)
      .join("\n\n");
    const blob = new Blob([all], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "content-all-platforms.txt"; a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = Object.keys(platformContent).length > 0;
  const tiktokContent = platformContent.tiktok;

  // Update helpers for TikTok inline editing
  const updateTikTokField = (field: string, value: any) => {
    setPlatformContent(prev => ({ ...prev, tiktok: { ...prev.tiktok, [field]: value } }));
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
            Generate viral, platform-optimized content for TikTok, Instagram, Facebook, Pinterest, LinkedIn, and Twitter — all from a single prompt.
          </p>
        </div>

        {/* Character Profile */}
        <div className="mb-4">
          <CharacterProfileEditor profile={storyProfile} onChange={setStoryProfile} />
        </div>

        {/* Platform Selector */}
        <Card className="mb-4 border-accent/20">
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" /> Platforms
              </label>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>
                Select All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selectedPlatforms.includes(p.id)
                      ? p.color + " ring-1 ring-current"
                      : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                  }`}
                >
                  <span>{p.icon}</span> {p.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Input */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="pt-6">
            <Textarea
              placeholder="e.g. Promote AlterAI as the ultimate AI companion platform..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] text-base mb-4 bg-background border-border"
              maxLength={500}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{prompt.length}/500 · {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}</span>
              <Button onClick={handleGenerate} disabled={loading || !prompt.trim() || selectedPlatforms.length === 0} size="lg">
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? "s" : ""}...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Generate Content</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {hasContent && (
          <div className="space-y-6">
            {/* Export bar */}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={exportAllPlatforms}>
                <Download className="w-3.5 h-3.5 mr-1.5" /> Export All Platforms
              </Button>
              {Object.keys(platformContent).map(p => {
                const plat = PLATFORMS.find(x => x.id === p);
                return (
                  <Button key={p} variant="outline" size="sm" onClick={() => copyPlatformContent(p)}>
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> {plat?.icon} Copy {plat?.label}
                  </Button>
                );
              })}
            </div>

            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Pencil className="w-3 h-3" /> Click any text to edit before using
            </div>

            {/* Platform Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
                {Object.keys(platformContent).map(p => {
                  const plat = PLATFORMS.find(x => x.id === p);
                  return (
                    <TabsTrigger key={p} value={p} className="text-xs gap-1">
                      <span>{plat?.icon}</span> {plat?.label}
                    </TabsTrigger>
                  );
                })}
                {tiktokContent && (
                  <>
                    <TabsTrigger value="continue" className="text-xs gap-1 text-accent">
                      <FastForward className="w-3 h-3" /> Continue
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-xs gap-1 text-primary">
                      <Video className="w-3 h-3" /> Video
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              {/* TikTok Tab */}
              {platformContent.tiktok && (
                <TabsContent value="tiktok" className="space-y-4 mt-4">
                  {storySegments.length > 1 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground">Segments:</span>
                      {storySegments.map((_: any, idx: number) => (
                        <Badge key={idx} variant={idx === storySegments.length - 1 ? "default" : "secondary"} className="text-xs">Part {idx + 1}</Badge>
                      ))}
                      <Badge variant="outline" className="text-xs">{tiktokContent.scenes?.length || 0} scenes</Badge>
                    </div>
                  )}

                  <TikTokSection content={tiktokContent} onUpdate={updateTikTokField} copyToClipboard={copyToClipboard} copiedField={copiedField} generatedImages={generatedImages} generatingImages={generatingImages} onGenerateImage={handleGenerateImage} setGeneratedImages={setGeneratedImages} storySegments={storySegments} />
                </TabsContent>
              )}

              {/* Instagram Tab */}
              {platformContent.instagram && (
                <TabsContent value="instagram" className="space-y-4 mt-4">
                  <GenericPlatformDisplay platform="instagram" data={platformContent.instagram} copyToClipboard={copyToClipboard} copiedField={copiedField} />
                </TabsContent>
              )}

              {/* Facebook Tab */}
              {platformContent.facebook && (
                <TabsContent value="facebook" className="space-y-4 mt-4">
                  <GenericPlatformDisplay platform="facebook" data={platformContent.facebook} copyToClipboard={copyToClipboard} copiedField={copiedField} />
                </TabsContent>
              )}

              {/* Pinterest Tab */}
              {platformContent.pinterest && (
                <TabsContent value="pinterest" className="space-y-4 mt-4">
                  <GenericPlatformDisplay platform="pinterest" data={platformContent.pinterest} copyToClipboard={copyToClipboard} copiedField={copiedField} />
                </TabsContent>
              )}

              {/* LinkedIn Tab */}
              {platformContent.linkedin && (
                <TabsContent value="linkedin" className="space-y-4 mt-4">
                  <GenericPlatformDisplay platform="linkedin" data={platformContent.linkedin} copyToClipboard={copyToClipboard} copiedField={copiedField} />
                </TabsContent>
              )}

              {/* Twitter Tab */}
              {platformContent.twitter && (
                <TabsContent value="twitter" className="space-y-4 mt-4">
                  <GenericPlatformDisplay platform="twitter" data={platformContent.twitter} copyToClipboard={copyToClipboard} copiedField={copiedField} />
                </TabsContent>
              )}

              {/* Continue Story Tab */}
              {tiktokContent && (
                <TabsContent value="continue" className="mt-4">
                  <Card className="border-accent/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FastForward className="w-4 h-4 text-accent" /> Continue the Story
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Add more TikTok scenes continuing from your existing {tiktokContent.scenes?.length || 0} scenes.
                      </p>
                      <Textarea
                        placeholder="What happens next?"
                        value={continuePrompt}
                        onChange={(e) => setContinuePrompt(e.target.value)}
                        className="min-h-[80px] bg-background border-border"
                        maxLength={500}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{continuePrompt.length}/500</span>
                        <Button onClick={handleContinueStory} disabled={continuing || !continuePrompt.trim()}>
                          {continuing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Continuing...</> : <><FastForward className="w-4 h-4 mr-2" /> Continue Story</>}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Video Tab */}
              {tiktokContent && (
                <TabsContent value="video" className="mt-4">
                  <VideoCompiler
                    scenes={tiktokContent.scenes || []}
                    imagePrompts={tiktokContent.image_prompts || []}
                    hook={tiktokContent.hook || ""}
                    existingImages={generatedImages}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        {/* Error display */}
        {Object.keys(platformErrors).length > 0 && (
          <div className="mt-4 space-y-2">
            {Object.entries(platformErrors).map(([p, err]) => {
              const plat = PLATFORMS.find(x => x.id === p);
              return (
                <div key={p} className="text-sm text-destructive flex items-center gap-2">
                  <span>{plat?.icon}</span> {plat?.label}: {err}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// TikTok-specific detailed section with scenes, images, editing, voiceover
function TikTokSection({ content, onUpdate, copyToClipboard, copiedField, generatedImages, generatingImages, onGenerateImage, setGeneratedImages, storySegments }: any) {
  const [selectedVoice, setSelectedVoice] = useState("JBFqnCBsd6RMkjVDRZzb");
  const [voiceLoading, setVoiceLoading] = useState<Record<string, boolean>>({});
  const [sceneAudios, setSceneAudios] = useState<Record<number, string>>({});
  const [fullAudio, setFullAudio] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  const VOICES = [
    { id: "JBFqnCBsd6RMkjVDRZzb", name: "George" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah" },
    { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam" },
    { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice" },
    { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel" },
    { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily" },
    { id: "cjVigY5qzO86Huf0OWal", name: "Eric" },
    { id: "iP95p4xoKVk53GoZ742B", name: "Chris" },
  ];

  const generateVoiceover = async (key: string, text: string, isFull = false) => {
    setVoiceLoading(prev => ({ ...prev, [key]: true }));
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
      const body = isFull
        ? { action: "generate_full", voiceId: selectedVoice, scenes: content.scenes }
        : { action: "generate", voiceId: selectedVoice, text };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "TTS failed" }));
        throw new Error(err.error || `TTS error: ${response.status}`);
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      if (isFull) {
        setFullAudio(audioUrl);
      } else {
        const sceneNum = parseInt(key.replace("scene-", ""));
        setSceneAudios(prev => ({ ...prev, [sceneNum]: audioUrl }));
      }
      toast.success(isFull ? "Full voiceover generated!" : "Scene voiceover generated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate voiceover");
    } finally {
      setVoiceLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const togglePlayAudio = (key: string, audioUrl: string) => {
    if (playingAudio === key) {
      audioElements[key]?.pause();
      setPlayingAudio(null);
      return;
    }
    // Stop any currently playing
    if (playingAudio && audioElements[playingAudio]) {
      audioElements[playingAudio].pause();
    }
    const audio = new Audio(audioUrl);
    audio.onended = () => setPlayingAudio(null);
    audio.play();
    setAudioElements(prev => ({ ...prev, [key]: audio }));
    setPlayingAudio(key);
  };

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(text, field)}>
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="overview"><Zap className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Overview</TabsTrigger>
        <TabsTrigger value="scenes"><Film className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Scenes</TabsTrigger>
        <TabsTrigger value="images"><ImageIcon className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Images</TabsTrigger>
        <TabsTrigger value="directions"><Camera className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Direction</TabsTrigger>
        <TabsTrigger value="voiceover"><Mic className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Voice</TabsTrigger>
        <TabsTrigger value="editing"><Type className="w-3.5 h-3.5 mr-1 hidden sm:inline" /> Editing</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4 mt-4">
        {content.hook && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Hook <CopyBtn text={content.hook} field="tk-hook" /></CardTitle></CardHeader>
            <CardContent><EditableText value={content.hook} onChange={(v) => onUpdate("hook", v)} className="text-lg font-semibold text-foreground" /></CardContent>
          </Card>
        )}
        {content.caption && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" /> Caption <CopyBtn text={content.caption} field="tk-caption" /></CardTitle></CardHeader>
            <CardContent><EditableText value={content.caption} onChange={(v) => onUpdate("caption", v)} className="text-foreground" /></CardContent>
          </Card>
        )}
        {content.cta && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> CTA <CopyBtn text={content.cta} field="tk-cta" /></CardTitle></CardHeader>
            <CardContent><EditableText value={content.cta} onChange={(v) => onUpdate("cta", v)} className="text-foreground" /></CardContent>
          </Card>
        )}
        {content.hashtags?.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Hash className="w-4 h-4 text-primary" /> Hashtags <CopyBtn text={content.hashtags.map((h: string) => `#${h}`).join(" ")} field="tk-tags" /></CardTitle></CardHeader>
            <CardContent><div className="flex flex-wrap gap-2">{content.hashtags.map((t: string) => <Badge key={t} variant="secondary">#{t}</Badge>)}</div></CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="scenes" className="space-y-3 mt-4">
        {content.scenes?.map((scene: any, idx: number) => {
          let segIdx = 0, count = 0;
          for (let s = 0; s < storySegments.length; s++) {
            count += storySegments[s].content.scenes?.length || 0;
            if (idx < count) { segIdx = s; break; }
          }
          return (
            <Card key={`${scene.number}-${idx}`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5">{scene.number}</Badge>
                  {storySegments.length > 1 && <Badge variant="secondary" className="shrink-0 mt-0.5 text-xs">Part {segIdx + 1}</Badge>}
                  <div className="flex-1">
                    <EditableText value={scene.text} onChange={(v) => {
                      const scenes = [...content.scenes];
                      scenes[idx] = { ...scenes[idx], text: v };
                      onUpdate("scenes", scenes);
                    }} multiline className="text-foreground" />
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Duration:</span>
                      <input type="number" value={scene.duration_seconds} onChange={(e) => {
                        const scenes = [...content.scenes];
                        scenes[idx] = { ...scenes[idx], duration_seconds: Math.max(1, parseInt(e.target.value) || 3) };
                        onUpdate("scenes", scenes);
                      }} className="w-14 h-6 text-xs bg-background border border-border rounded px-1.5 text-foreground" min={1} max={30} />
                      <span className="text-xs text-muted-foreground">s</span>
                    </div>
                  </div>
                  <CopyBtn text={scene.text} field={`tk-scene-${scene.number}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>

      <TabsContent value="images" className="space-y-4 mt-4">
        {content.image_prompts?.map((ip: any, idx: number) => {
          const genImg = generatedImages.find((g: any) => g.scene_number === ip.scene_number);
          return (
            <Card key={ip.scene_number}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3 mb-3 flex-1">
                  <Badge variant="outline" className="shrink-0 mt-0.5">{ip.scene_number}</Badge>
                  <EditableText value={ip.prompt} onChange={(v) => {
                    const prompts = [...content.image_prompts];
                    prompts[idx] = { ...prompts[idx], prompt: v };
                    onUpdate("image_prompts", prompts);
                  }} multiline className="text-sm text-foreground" />
                </div>
                {genImg ? (
                  <div className="space-y-2">
                    <img src={genImg.url} alt={`Scene ${ip.scene_number}`} className="rounded-lg w-full max-w-md border border-border" />
                    <Button variant="outline" size="sm" onClick={() => setGeneratedImages((prev: any[]) => prev.filter((g: any) => g.scene_number !== ip.scene_number))}>
                      <ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => onGenerateImage(ip.scene_number, ip.prompt)} disabled={generatingImages[ip.scene_number]}>
                    {generatingImages[ip.scene_number] ? <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</> : <><ImageIcon className="w-3.5 h-3.5 mr-1.5" /> Generate Image</>}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>

      <TabsContent value="directions" className="space-y-3 mt-4">
        {content.video_scenes?.map((vs: any, idx: number) => (
          <Card key={vs.scene_number}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">{vs.scene_number}</Badge>
                <EditableText value={vs.description} onChange={(v) => {
                  const vss = [...content.video_scenes];
                  vss[idx] = { ...vss[idx], description: v };
                  onUpdate("video_scenes", vss);
                }} multiline className="text-sm text-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Voiceover Tab */}
      <TabsContent value="voiceover" className="space-y-4 mt-4">
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" /> AI Voiceover
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Voice Selector */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Voice</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-48 h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Full Script Voiceover */}
            <Card className="border-accent/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Script Narration</p>
                    <p className="text-xs text-muted-foreground">Generate voiceover for all {content.scenes?.length || 0} scenes combined</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {fullAudio && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePlayAudio("full", fullAudio)}
                      >
                        {playingAudio === "full" ? <Pause className="w-3.5 h-3.5 mr-1.5" /> : <Play className="w-3.5 h-3.5 mr-1.5" />}
                        {playingAudio === "full" ? "Pause" : "Play"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => generateVoiceover("full", "", true)}
                      disabled={voiceLoading["full"]}
                    >
                      {voiceLoading["full"] ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Generating...</>
                      ) : fullAudio ? (
                        <><Mic className="w-3.5 h-3.5 mr-1.5" /> Regenerate</>
                      ) : (
                        <><Mic className="w-3.5 h-3.5 mr-1.5" /> Generate Full Voiceover</>
                      )}
                    </Button>
                  </div>
                </div>
                {fullAudio && (
                  <div className="mt-3">
                    <audio controls src={fullAudio} className="w-full h-10" />
                    <a href={fullAudio} download="voiceover-full.mp3" className="text-xs text-primary hover:underline mt-1 inline-block">
                      <Download className="w-3 h-3 inline mr-1" />Download MP3
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Per-Scene Voiceovers */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Per-Scene Voiceover</p>
              {content.scenes?.map((scene: any) => {
                const key = `scene-${scene.number}`;
                const audioUrl = sceneAudios[scene.number];
                return (
                  <Card key={key} className="border-border">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0 mt-0.5">{scene.number}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{scene.text}</p>
                          {audioUrl && (
                            <div className="mt-2">
                              <audio controls src={audioUrl} className="w-full h-8" />
                              <a href={audioUrl} download={`voiceover-scene-${scene.number}.mp3`} className="text-xs text-primary hover:underline mt-1 inline-block">
                                <Download className="w-3 h-3 inline mr-1" />Download
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {audioUrl && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => togglePlayAudio(key, audioUrl)}>
                              {playingAudio === key ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => generateVoiceover(key, scene.text)}
                            disabled={voiceLoading[key]}
                          >
                            {voiceLoading[key] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <><Mic className="w-3.5 h-3.5 mr-1" /> {audioUrl ? "Redo" : "Generate"}</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="editing" className="mt-4">
        {content.editing && (
          <Card>
            <CardContent className="pt-4 space-y-4">
              {Object.entries(content.editing).map(([key, value]) => (
                <div key={key}>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{key.replace(/_/g, " ")}</p>
                  <EditableText value={String(value)} onChange={(v) => onUpdate("editing", { ...content.editing, [key]: v })} className="text-foreground mt-0.5" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}

// Generic platform content display
function GenericPlatformDisplay({ platform, data, copyToClipboard, copiedField }: { platform: string; data: any; copyToClipboard: (t: string, f: string) => void; copiedField: string | null }) {
  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(text, field)}>
      {copiedField === field ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
    </Button>
  );

  const renderField = (label: string, key: string, value: any) => {
    if (!value) return null;

    if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        // String array — hashtags, keywords, thread tweets
        const isThread = key === "thread";
        return (
          <Card key={key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {label} <CopyBtn text={isThread ? value.join("\n\n") : value.join(" ")} field={`${platform}-${key}`} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isThread ? (
                <div className="space-y-3">
                  {value.map((tweet: string, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">{i + 1}</Badge>
                      <EditableText value={tweet} onChange={() => {}} className="text-foreground text-sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {value.map((item: string) => (
                    <Badge key={item} variant="secondary">{key.includes("hash") || key.includes("keyword") ? `#${item}` : item}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      }
      // Object arrays (scenes, image_prompts)
      return (
        <Card key={key}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {value.map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3">
                <Badge variant="outline" className="shrink-0 mt-0.5">{item.number || item.scene_number || i + 1}</Badge>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.text || item.prompt || item.description}</p>
                  {item.duration_seconds && <span className="text-xs text-muted-foreground">{item.duration_seconds}s</span>}
                </div>
                <CopyBtn text={item.text || item.prompt || item.description || ""} field={`${platform}-${key}-${i}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    if (typeof value === "object") {
      return (
        <Card key={key}>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(value).map(([k, v]) => (
              <div key={k}>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{k.replace(/_/g, " ")}</p>
                <p className="text-foreground text-sm mt-0.5">{String(v)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }

    // String value
    return (
      <Card key={key}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {label} <CopyBtn text={String(value)} field={`${platform}-${key}`} />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EditableText value={String(value)} onChange={() => {}} multiline={String(value).length > 100} className="text-foreground" />
        </CardContent>
      </Card>
    );
  };

  // Pretty labels
  const labels: Record<string, string> = {
    hook: "🪝 Hook", reel_hook: "🎬 Reel Hook", post: "📝 Post", caption: "💬 Caption",
    cta: "✨ Call to Action", hashtags: "# Hashtags", visual_direction: "🎨 Visual Direction",
    visual_prompt: "🖼️ Visual Prompt", engagement_question: "❓ Engagement Question",
    pin_title: "📌 Pin Title", pin_description: "📝 Pin Description", keywords: "🔑 Keywords",
    board_suggestion: "📋 Board Suggestion", main_tweet: "🐦 Main Tweet", thread: "🧵 Thread",
    scenes: "🎬 Scenes", image_prompts: "🖼️ Image Prompts", video_scenes: "📹 Video Scenes",
    editing: "✂️ Editing", 
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([key, value]) =>
        renderField(labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), key, value)
      )}
    </div>
  );
}
