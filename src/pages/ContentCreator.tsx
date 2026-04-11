import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import PaywallModal from "@/components/PaywallModal";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wand2, Shuffle, Download, Lock, Sparkles, Copy, Check,
  Video, Image, Layers, Film, Clock, Flame, Crown, Zap,
  Brain, Heart, Gem, Cpu, Dumbbell, Flower2,
} from "lucide-react";

const FORMATS = [
  { id: "tiktok", label: "TikTok Video", icon: Video },
  { id: "instagram", label: "Image Post", icon: Image },
  { id: "facebook", label: "Carousel", icon: Layers },
  { id: "twitter", label: "Reel", icon: Film },
  { id: "linkedin", label: "Story", icon: Clock },
];

const TREND_MODES = [
  { id: "viral_storytime", label: "Viral Storytime", icon: Flame, color: "text-orange-400" },
  { id: "dark_psychology", label: "Dark Psychology", icon: Brain, color: "text-purple-400" },
  { id: "luxury_lifestyle", label: "Luxury Lifestyle", icon: Gem, color: "text-yellow-400" },
  { id: "ai_futuristic", label: "AI Futuristic", icon: Cpu, color: "text-cyan-400" },
  { id: "motivational_viral", label: "Motivational", icon: Dumbbell, color: "text-red-400" },
  { id: "soft_feminine", label: "Soft Feminine", icon: Flower2, color: "text-pink-400" },
];

const REMIX_TONES = ["Aggressive", "Calm", "Humorous", "Mysterious", "Empowering", "Nostalgic"];

export default function ContentCreator() {
  const { tier, subscribed } = useSubscription();
  const isPro = tier === "pro" || tier === "power";

  const [prompt, setPrompt] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("tiktok");
  const [selectedTrend, setSelectedTrend] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showRemix, setShowRemix] = useState(false);
  const [remixTone, setRemixTone] = useState<string | null>(null);

  const handleGenerate = async (remixOptions?: any) => {
    if (!prompt.trim()) {
      toast.error("Tell us what you're selling or creating");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("content-studio", {
        body: {
          prompt: prompt.trim(),
          platforms: [selectedFormat],
          trendMode: selectedTrend,
          ...(remixOptions ? { remixOptions } : {}),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const platformResult = data.content?.[selectedFormat];
      if (!platformResult) throw new Error("No content generated");

      setResult({ ...platformResult, _tier: data.tier });
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemix = async (tone: string) => {
    setRemixTone(tone);
    setShowRemix(false);
    await handleGenerate({ tone, platform: selectedFormat });
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyText(text, label)}
      className="gap-1 text-xs"
    >
      {copied === label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied === label ? "Copied" : "Copy"}
    </Button>
  );

  const LockedOverlay = ({ features }: { features: string[] }) => (
    <div className="relative rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-primary" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-foreground">Unlock Viral Content Engine Pro</h3>
      <ul className="space-y-2 text-sm text-muted-foreground text-left max-w-xs mx-auto">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button onClick={() => setShowPaywall(true)} className="gap-2">
        <Crown className="w-4 h-4" /> Upgrade to Pro
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-7 h-7 text-primary" />
            Content Creator Engine
          </h1>
          <p className="text-muted-foreground">
            {isPro ? "Full access — generate post-ready viral content" : "Enter what you're selling to get started"}
          </p>
          {!isPro && (
            <Badge variant="outline" className="text-xs">
              Free Plan — Limited Output
            </Badge>
          )}
        </div>

        {/* Prompt Input */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Textarea
              placeholder="What are you selling or creating? (e.g. 'AI productivity app that saves 3 hours/day')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </CardContent>
        </Card>

        {/* Format Selector */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Format</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {FORMATS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={selectedFormat === id ? "default" : "outline"}
                  className="w-full gap-2 text-xs sm:text-sm"
                  onClick={() => setSelectedFormat(id)}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Modes */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
              Trend Mode {!isPro && <Lock className="w-3 h-3 inline ml-1" />}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TREND_MODES.map(({ id, label, icon: Icon, color }) => (
                <Button
                  key={id}
                  variant={selectedTrend === id ? "default" : "outline"}
                  className="w-full gap-2 text-xs sm:text-sm"
                  disabled={!isPro}
                  onClick={() => setSelectedTrend(selectedTrend === id ? null : id)}
                >
                  <Icon className={`w-4 h-4 ${selectedTrend === id ? "" : color}`} />
                  {label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <div className="flex gap-3 justify-center">
          <Button
            size="lg"
            className="gap-2 px-8"
            onClick={() => handleGenerate()}
            disabled={loading || !prompt.trim()}
          >
            {loading ? (
              <><span className="animate-spin">⚡</span> Generating...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate</>
            )}
          </Button>
          {result && isPro && (
            <>
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
                onClick={() => setShowRemix(!showRemix)}
              >
                <Shuffle className="w-5 h-5" /> Remix
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `content-${selectedFormat}-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success("Content exported!");
                }}
              >
                <Download className="w-5 h-5" /> Export
              </Button>
            </>
          )}
        </div>

        {/* Remix Panel */}
        <AnimatePresence>
          {showRemix && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold mb-3">Remix — Choose a new tone:</h3>
                  <div className="flex flex-wrap gap-2">
                    {REMIX_TONES.map((tone) => (
                      <Button
                        key={tone}
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemix(tone)}
                        disabled={loading}
                      >
                        {tone}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Output */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* FREE output */}
              {result.locked_features ? (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hook</h3>
                        <p className="text-lg font-bold text-foreground">{result.hook}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Concept</h3>
                        <p className="text-muted-foreground">{result.concept}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <LockedOverlay features={[
                    "AI video prompt generator (Runway, Sora, Pika)",
                    "Full TikTok scene builder with visuals",
                    "Viral caption + hashtag engine",
                    "1-click remix system",
                    "Export-ready content packs",
                  ]} />
                </div>
              ) : (
                /* PRO output */
                <Tabs defaultValue="preview" className="w-full">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="preview">Scenes</TabsTrigger>
                    <TabsTrigger value="prompts">AI Prompts</TabsTrigger>
                    <TabsTrigger value="caption">Captions</TabsTrigger>
                    <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                  </TabsList>

                  {/* Scenes */}
                  <TabsContent value="preview">
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        {/* Hook */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hook</h3>
                            <p className="text-lg font-bold text-foreground">{result.hook}</p>
                          </div>
                          <CopyBtn text={result.hook} label="Hook" />
                        </div>

                        {/* Alt hooks */}
                        {result.hooks?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Hook Variations</h4>
                            <div className="space-y-1">
                              {result.hooks.map((h: string, i: number) => (
                                <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50">
                                  <span className="text-foreground">{h}</span>
                                  <CopyBtn text={h} label={`Hook ${i + 1}`} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Scene breakdown */}
                        {result.scenes?.map((scene: any, i: number) => (
                          <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="secondary">Scene {scene.number || i + 1}</Badge>
                              <span className="text-xs text-muted-foreground">{scene.duration_seconds}s</span>
                            </div>
                            <p className="text-sm font-medium text-foreground">{scene.text}</p>
                            {scene.visual_direction && (
                              <p className="text-xs text-muted-foreground italic">🎬 {scene.visual_direction}</p>
                            )}
                          </div>
                        ))}

                        {/* Editing */}
                        {result.editing && (
                          <div className="border-t border-border pt-3 mt-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Editing Notes</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              {Object.entries(result.editing).map(([k, v]) => v ? (
                                <div key={k}><span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span> {v as string}</div>
                              ) : null)}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* AI Prompts */}
                  <TabsContent value="prompts">
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase">
                          Ready-to-paste AI generation prompts
                        </h3>
                        {result.ai_prompts && Object.entries(result.ai_prompts).map(([tool, promptText]) => (
                          <div key={tool} className="border border-border rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="capitalize">{tool.replace(/_/g, " ")}</Badge>
                              <CopyBtn text={promptText as string} label={tool} />
                            </div>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{promptText as string}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Captions */}
                  <TabsContent value="caption">
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        {result.caption && typeof result.caption === "object" ? (
                          <>
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Primary Caption</h4>
                                <CopyBtn text={result.caption.primary} label="Caption" />
                              </div>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{result.caption.primary}</p>
                            </div>
                            {result.caption.variation_1 && (
                              <div className="border-t border-border pt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Variation 1</h4>
                                  <CopyBtn text={result.caption.variation_1} label="Variation 1" />
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.caption.variation_1}</p>
                              </div>
                            )}
                            {result.caption.variation_2 && (
                              <div className="border-t border-border pt-3">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-xs font-semibold text-muted-foreground uppercase">Variation 2</h4>
                                  <CopyBtn text={result.caption.variation_2} label="Variation 2" />
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{result.caption.variation_2}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Caption</h4>
                              <CopyBtn text={result.caption || ""} label="Caption" />
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap">{result.caption}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Hashtags */}
                  <TabsContent value="hashtags">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xs font-semibold text-muted-foreground uppercase">Hashtag Pack</h3>
                          <CopyBtn
                            text={result.hashtags?.map((h: string) => h.startsWith("#") ? h : `#${h}`).join(" ") || ""}
                            label="Hashtags"
                          />
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.hashtags?.map((tag: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-sm">
                              {tag.startsWith("#") ? tag : `#${tag}`}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PaywallModal open={showPaywall} onOpenChange={setShowPaywall} reason="messages" />
    </div>
  );
}
