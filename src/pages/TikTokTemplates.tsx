import { useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Copy, Check, Loader2, Upload, ImageIcon, X,
  Zap, Film, Play, ArrowRight, ShoppingBag, Eye, MessageSquare,
  Hash, Camera, Type, Pencil, Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HookGenerator from "@/components/HookGenerator";

// ── Template definitions ──
interface TemplateScene {
  number: number;
  label: string;
  text: string;
  duration_seconds: number;
  hasProductSlot: boolean;
  productSlotLabel?: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  scenes: TemplateScene[];
  hookPlaceholder: string;
  ctaPlaceholder: string;
}

const TEMPLATES: VideoTemplate[] = [
  {
    id: "problem-solution",
    name: "Problem → Solution",
    description: "Show a pain point, then reveal your product as the fix. Highest conversion rate.",
    icon: "💡",
    color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    hookPlaceholder: "Stop wasting money on [problem]...",
    ctaPlaceholder: "Link in bio — limited time offer 🔥",
    scenes: [
      { number: 1, label: "The Problem", text: "You know that feeling when [pain point]?", duration_seconds: 3, hasProductSlot: false },
      { number: 2, label: "Agitate", text: "You've tried everything. Nothing works.", duration_seconds: 3, hasProductSlot: false },
      { number: 3, label: "The Solution", text: "Until I found THIS 👇", duration_seconds: 2, hasProductSlot: true, productSlotLabel: "Product reveal shot" },
      { number: 4, label: "Demo/Proof", text: "Watch how easy it is...", duration_seconds: 4, hasProductSlot: true, productSlotLabel: "Product in action" },
      { number: 5, label: "Result", text: "Now I [benefit] every single day.", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Results / before-after" },
    ],
  },
  {
    id: "pov",
    name: "POV",
    description: "First-person perspective that makes viewers feel like they're experiencing it.",
    icon: "👁️",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    hookPlaceholder: "POV: You just discovered the best [category] product...",
    ctaPlaceholder: "Follow for more POVs like this 🎬",
    scenes: [
      { number: 1, label: "POV Setup", text: "POV: You finally try [product]", duration_seconds: 3, hasProductSlot: false },
      { number: 2, label: "First Reaction", text: "*opens package* Wait, this is actually...", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Unboxing / first look" },
      { number: 3, label: "Using It", text: "*tries it* Oh. My. God.", duration_seconds: 4, hasProductSlot: true, productSlotLabel: "Using the product" },
      { number: 4, label: "The Result", text: "Why didn't anyone tell me about this sooner?!", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Final result" },
    ],
  },
  {
    id: "before-after",
    name: "Before / After",
    description: "Visual transformation that creates instant desire. Perfect for beauty, fitness, home.",
    icon: "✨",
    color: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    hookPlaceholder: "This transformation is INSANE 😱",
    ctaPlaceholder: "Want the same results? Link in bio 👆",
    scenes: [
      { number: 1, label: "Before (Wide)", text: "Here's what I was dealing with...", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Before photo/video" },
      { number: 2, label: "The Product", text: "Then I started using [product]", duration_seconds: 2, hasProductSlot: true, productSlotLabel: "Product shot" },
      { number: 3, label: "Process", text: "After [timeframe] of consistent use...", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Process / application" },
      { number: 4, label: "After (Reveal)", text: "THE RESULTS SPEAK FOR THEMSELVES 🤯", duration_seconds: 4, hasProductSlot: true, productSlotLabel: "After photo/video" },
    ],
  },
  {
    id: "storytime",
    name: "Storytime",
    description: "Personal narrative that builds trust and emotional connection before the sell.",
    icon: "📖",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    hookPlaceholder: "I need to tell you about something that changed my life...",
    ctaPlaceholder: "Save this for later & follow for more stories 💫",
    scenes: [
      { number: 1, label: "Hook", text: "Story time: How I went from [struggle] to [success]", duration_seconds: 3, hasProductSlot: false },
      { number: 2, label: "Background", text: "I used to [relatable struggle]...", duration_seconds: 4, hasProductSlot: false },
      { number: 3, label: "Turning Point", text: "Then one day, someone recommended [product]", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Product introduction" },
      { number: 4, label: "Journey", text: "At first I was skeptical, but after [timeframe]...", duration_seconds: 4, hasProductSlot: true, productSlotLabel: "Using the product" },
      { number: 5, label: "Transformation", text: "Now I [amazing result] and I'll never go back.", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Lifestyle / result" },
      { number: 6, label: "CTA", text: "If you're struggling with [problem], try this.", duration_seconds: 3, hasProductSlot: false },
    ],
  },
  {
    id: "product-demo",
    name: "Product Demo",
    description: "Straight-to-the-point showcase. Best for products that sell themselves visually.",
    icon: "🎥",
    color: "from-red-500/20 to-rose-500/20 border-red-500/30",
    hookPlaceholder: "This product is going viral for a reason...",
    ctaPlaceholder: "Grab yours before they sell out — link in bio 🛒",
    scenes: [
      { number: 1, label: "Attention Grab", text: "Wait till you see what this can do 👀", duration_seconds: 2, hasProductSlot: true, productSlotLabel: "Eye-catching product shot" },
      { number: 2, label: "Feature 1", text: "First, it [key feature]...", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Feature demonstration" },
      { number: 3, label: "Feature 2", text: "But the BEST part? It also [feature]!", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Second feature demo" },
      { number: 4, label: "Social Proof", text: "Over [number] people already love it ⭐", duration_seconds: 3, hasProductSlot: false },
      { number: 5, label: "Urgency + CTA", text: "And right now it's [discount/offer] 🔥", duration_seconds: 3, hasProductSlot: true, productSlotLabel: "Product with offer overlay" },
    ],
  },
];

// ── Product media type ──
interface ProductMedia {
  sceneNumber: number;
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

export default function TikTokTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<VideoTemplate | null>(null);
  const [editedScenes, setEditedScenes] = useState<TemplateScene[]>([]);
  const [hookText, setHookText] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [productMedia, setProductMedia] = useState<ProductMedia[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const selectTemplate = (template: VideoTemplate) => {
    setSelectedTemplate(template);
    setEditedScenes(template.scenes.map(s => ({ ...s })));
    setHookText(template.hookPlaceholder);
    setCtaText(template.ctaPlaceholder);
    setProductMedia([]);
    setGeneratedContent(null);
  };

  const updateSceneText = (idx: number, text: string) => {
    setEditedScenes(prev => prev.map((s, i) => i === idx ? { ...s, text } : s));
  };

  const handleFileUpload = (sceneNumber: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    if (!isVideo && !isImage) {
      toast.error("Please upload an image or video file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File must be under 20MB");
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setProductMedia(prev => [
      ...prev.filter(m => m.sceneNumber !== sceneNumber),
      { sceneNumber, file, previewUrl, type: isVideo ? "video" : "image" },
    ]);
  };

  const removeMedia = (sceneNumber: number) => {
    setProductMedia(prev => {
      const removed = prev.find(m => m.sceneNumber === sceneNumber);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter(m => m.sceneNumber !== sceneNumber);
    });
  };

  const generateFromTemplate = async () => {
    if (!selectedTemplate || !productName.trim()) return;
    setGenerating(true);
    try {
      const sceneDescriptions = editedScenes.map(s => `Scene ${s.number} (${s.label}): ${s.text}`).join("\n");
      const prompt = `Create a TikTok ${selectedTemplate.name} video for: ${productName.trim()}\n\nTemplate structure:\nHook: ${hookText}\nScenes:\n${sceneDescriptions}\nCTA: ${ctaText}\n\nAdapt ALL text to specifically promote this product. Keep the template structure but make it compelling and specific.`;

      const { data, error } = await supabase.functions.invoke("content-studio", {
        body: { prompt, platforms: ["tiktok"] },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedContent(data.content?.tiktok || null);
      if (data.content?.tiktok) toast.success("Content generated! Edit and customize below.");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate content");
    } finally {
      setGenerating(false);
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

  const exportScript = () => {
    const content = generatedContent || { hook: hookText, scenes: editedScenes, cta: ctaText };
    const lines = [
      `# ${selectedTemplate?.name} — ${productName}`,
      "",
      `## Hook`,
      content.hook || hookText,
      "",
      `## Scenes`,
      ...(content.scenes || editedScenes).map((s: any) => {
        const media = productMedia.find(m => m.sceneNumber === s.number);
        return `${s.number}. [${s.label || "Scene"}] ${s.text}${s.duration_seconds ? ` (${s.duration_seconds}s)` : ""}${media ? ` 📎 ${media.file.name}` : ""}`;
      }),
      "",
      `## CTA`,
      content.cta || ctaText,
      "",
      ...(content.caption ? [`## Caption`, content.caption, ""] : []),
      ...(content.hashtags?.length ? [`## Hashtags`, content.hashtags.map((h: string) => `#${h}`).join(" ")] : []),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.id || "tiktok"}-script.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script exported!");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Film className="w-8 h-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">TikTok Templates</h1>
          </div>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Pick a proven template, swap in your product, and get a ready-to-film script in seconds.
          </p>
        </div>

        {!selectedTemplate ? (
          <>
            {/* Template Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
              {TEMPLATES.map(t => (
                <Card
                  key={t.id}
                  className={`cursor-pointer hover:scale-[1.02] transition-all duration-200 border bg-gradient-to-br ${t.color}`}
                  onClick={() => selectTemplate(t)}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="text-3xl mb-3">{t.icon}</div>
                    <h3 className="text-lg font-bold text-foreground mb-1">{t.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{t.scenes.length} scenes</Badge>
                      <Badge variant="outline" className="text-xs">
                        {t.scenes.filter(s => s.hasProductSlot).length} product slots
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Hook Generator Section */}
            <HookGenerator />
          </>
        ) : (
          <>
            {/* Back button */}
            <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => setSelectedTemplate(null)}>
              ← Back to templates
            </Button>

            {/* Template Editor */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">{selectedTemplate.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedTemplate.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
              </div>
            </div>

            {/* Product Name Input */}
            <Card className="mb-6 border-primary/20">
              <CardContent className="pt-5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <ShoppingBag className="w-3.5 h-3.5" /> What are you selling?
                </label>
                <Input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. LED face mask, protein powder, AI writing tool..."
                  className="text-base bg-background"
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="script" className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="script"><Type className="w-3.5 h-3.5 mr-1.5" /> Script</TabsTrigger>
                <TabsTrigger value="media"><Camera className="w-3.5 h-3.5 mr-1.5" /> Product Swap</TabsTrigger>
                <TabsTrigger value="preview"><Eye className="w-3.5 h-3.5 mr-1.5" /> Preview</TabsTrigger>
              </TabsList>

              {/* Script Tab */}
              <TabsContent value="script" className="space-y-4 mt-4">
                {/* Hook */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" /> Hook Line
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={hookText}
                      onChange={(e) => setHookText(e.target.value)}
                      className="text-base font-semibold bg-background"
                    />
                  </CardContent>
                </Card>

                {/* Scenes */}
                {editedScenes.map((scene, idx) => (
                  <Card key={scene.number} className={scene.hasProductSlot ? "border-primary/20" : ""}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant={scene.hasProductSlot ? "default" : "outline"} className="shrink-0">
                            {scene.number}
                          </Badge>
                          {scene.hasProductSlot && (
                            <ImageIcon className="w-3 h-3 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{scene.label}</span>
                            <input
                              type="number"
                              value={scene.duration_seconds}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(30, parseInt(e.target.value) || 3));
                                setEditedScenes(prev => prev.map((s, i) => i === idx ? { ...s, duration_seconds: val } : s));
                              }}
                              className="w-12 h-5 text-xs bg-muted/50 border border-border rounded px-1 text-foreground"
                              min={1}
                              max={30}
                            />
                            <span className="text-xs text-muted-foreground">sec</span>
                          </div>
                          <Textarea
                            value={scene.text}
                            onChange={(e) => updateSceneText(idx, e.target.value)}
                            className="min-h-[50px] text-sm bg-background"
                            rows={2}
                          />
                          {scene.hasProductSlot && (
                            <div className="text-xs text-primary flex items-center gap-1">
                              <Upload className="w-3 h-3" /> {scene.productSlotLabel} — swap in Product Swap tab
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* CTA */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Call to Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="text-base bg-background"
                    />
                  </CardContent>
                </Card>

                {/* Generate button */}
                <Button
                  onClick={generateFromTemplate}
                  disabled={generating || !productName.trim()}
                  size="lg"
                  className="w-full"
                >
                  {generating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating AI-optimized script...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Generate Selling Script for "{productName || "..."}"</>
                  )}
                </Button>
              </TabsContent>

              {/* Product Swap Tab */}
              <TabsContent value="media" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Upload your product images or short video clips for each scene slot. These will be included in your exported script.
                </p>
                {editedScenes.filter(s => s.hasProductSlot).map(scene => {
                  const media = productMedia.find(m => m.sceneNumber === scene.number);
                  return (
                    <Card key={scene.number} className="border-primary/20">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <Badge className="shrink-0">{scene.number}</Badge>
                          <div className="flex-1 space-y-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{scene.label}</p>
                              <p className="text-xs text-muted-foreground">{scene.productSlotLabel}</p>
                            </div>

                            {media ? (
                              <div className="relative">
                                {media.type === "image" ? (
                                  <img src={media.previewUrl} alt={scene.label} className="rounded-lg w-full max-w-xs border border-border" />
                                ) : (
                                  <video src={media.previewUrl} controls className="rounded-lg w-full max-w-xs border border-border" />
                                )}
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-2 right-2 h-7 w-7"
                                  onClick={() => removeMedia(scene.number)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">{media.file.name}</p>
                              </div>
                            ) : (
                              <div
                                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                                onClick={() => fileInputRefs.current[scene.number]?.click()}
                              >
                                <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">Click to upload image or video</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, MP4, MOV — max 20MB</p>
                              </div>
                            )}

                            <input
                              ref={el => { fileInputRefs.current[scene.number] = el; }}
                              type="file"
                              accept="image/*,video/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(scene.number, e)}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="mt-4">
                <Card className="border-border">
                  <CardContent className="pt-5 space-y-4">
                    {/* Phone mockup preview */}
                    <div className="mx-auto max-w-[280px] bg-black rounded-[2rem] p-2 shadow-2xl">
                      <div className="bg-muted/10 rounded-[1.5rem] overflow-hidden aspect-[9/16] flex flex-col">
                        {/* Status bar */}
                        <div className="h-8 bg-black/50 flex items-center justify-center">
                          <span className="text-[10px] text-white/60">TikTok Preview</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 relative bg-gradient-to-b from-muted/20 to-muted/40 p-4 flex flex-col justify-end">
                          {/* Product media preview for first slot */}
                          {productMedia[0] && (
                            <div className="absolute inset-0">
                              {productMedia[0].type === "image" ? (
                                <img src={productMedia[0].previewUrl} alt="Product" className="w-full h-full object-cover opacity-40" />
                              ) : (
                                <video src={productMedia[0].previewUrl} className="w-full h-full object-cover opacity-40" muted autoPlay loop />
                              )}
                            </div>
                          )}

                          <div className="relative z-10 space-y-2">
                            <p className="text-xs font-bold text-white drop-shadow">{hookText}</p>
                            {editedScenes.slice(0, 3).map(s => (
                              <p key={s.number} className="text-[10px] text-white/80 drop-shadow">{s.text}</p>
                            ))}
                            <p className="text-[10px] text-white/90 font-medium drop-shadow">{ctaText}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" size="sm" onClick={exportScript}>
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Export Script
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => {
                        const script = [hookText, ...editedScenes.map(s => s.text), ctaText].join("\n\n");
                        copyToClipboard(script, "full-script");
                      }}>
                        <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy Script
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Generated AI Content */}
            {generatedContent && (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> AI-Generated Script
                </h3>

                {generatedContent.hook && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Hook <CopyBtn text={generatedContent.hook} field="gen-hook" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg font-semibold text-foreground">{generatedContent.hook}</p>
                    </CardContent>
                  </Card>
                )}

                {generatedContent.scenes?.map((scene: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="shrink-0">{scene.number}</Badge>
                        <div className="flex-1">
                          <p className="text-foreground">{scene.text}</p>
                          <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                        </div>
                        <CopyBtn text={scene.text} field={`gen-scene-${idx}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {generatedContent.caption && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-primary" /> Caption <CopyBtn text={generatedContent.caption} field="gen-caption" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{generatedContent.caption}</p>
                    </CardContent>
                  </Card>
                )}

                {generatedContent.cta && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" /> CTA <CopyBtn text={generatedContent.cta} field="gen-cta" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-foreground">{generatedContent.cta}</p>
                    </CardContent>
                  </Card>
                )}

                {generatedContent.hashtags?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Hash className="w-4 h-4 text-primary" /> Hashtags
                        <CopyBtn text={generatedContent.hashtags.map((h: string) => `#${h}`).join(" ")} field="gen-hashtags" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {generatedContent.hashtags.map((h: string) => (
                          <Badge key={h} variant="secondary">#{h}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Button variant="outline" onClick={exportScript} className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Export Full Script
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
