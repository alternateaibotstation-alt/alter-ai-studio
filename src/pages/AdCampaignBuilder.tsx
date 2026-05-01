import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Target,
  Megaphone,
  Zap,
  Globe,
  Video,
  Type,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { runAdPipeline } from "@modules/ad-engine/pipeline";
import type { AdPlatform, AdTone, CampaignBrief } from "@modules/ad-engine/types";
import { useCampaigns } from "@/hooks/use-campaigns";

const PLATFORMS: {
  id: AdPlatform;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "tiktok",
    label: "TikTok Ads",
    icon: "🎵",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  },
  {
    id: "instagram_reels",
    label: "Instagram Reels",
    icon: "📸",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  },
  {
    id: "facebook",
    label: "Facebook Ads",
    icon: "📘",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  {
    id: "google_ads",
    label: "Google Ads",
    icon: "🔍",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    icon: "🎬",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    id: "landing_page",
    label: "Landing Page",
    icon: "🌐",
    color: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
];

const TONES: { id: AdTone; label: string; description: string }[] = [
  { id: "viral", label: "Viral", description: "Optimized for shares & saves" },
  { id: "aggressive", label: "Aggressive", description: "Bold, direct, competitive" },
  { id: "emotional", label: "Emotional", description: "Story-driven, relatable" },
  { id: "luxury", label: "Luxury", description: "Aspirational, premium feel" },
  { id: "urgency", label: "Urgency", description: "Scarcity & FOMO-driven" },
  { id: "professional", label: "Professional", description: "Data-backed, B2B-ready" },
  { id: "playful", label: "Playful", description: "Fun, witty, approachable" },
  { id: "storytelling", label: "Storytelling", description: "Narrative arc, characters" },
];

export default function AdCampaignBuilder() {
  const navigate = useNavigate();
  const { saveCampaign } = useCampaigns();

  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState<AdTone>("viral");
  const [selectedPlatforms, setSelectedPlatforms] = useState<AdPlatform[]>([
    "tiktok",
    "facebook",
  ]);
  const [callToAction, setCallToAction] = useState("");
  const [brandVoice, setBrandVoice] = useState("");

  const [generating, setGenerating] = useState(false);
  const [progressStage, setProgressStage] = useState("");
  const [progressPct, setProgressPct] = useState(0);

  const togglePlatform = (id: AdPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !productDescription.trim() || !targetAudience.trim()) {
      toast.error("Please fill in product name, description, and target audience.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }

    const brief: CampaignBrief = {
      productName: productName.trim(),
      productDescription: productDescription.trim(),
      targetAudience: targetAudience.trim(),
      tone,
      platforms: selectedPlatforms,
      callToAction: callToAction.trim() || undefined,
      brandVoice: brandVoice.trim() || undefined,
    };

    setGenerating(true);
    setProgressPct(0);
    setProgressStage("Initializing pipeline...");

    try {
      const result = await runAdPipeline(brief, (stage, pct) => {
        setProgressStage(stage);
        setProgressPct(pct);
      });

      saveCampaign(result);
      toast.success(`Campaign generated! ${result.creditsUsed} credits used.`);
      navigate(`/campaign/${result.id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Campaign generation failed";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-24">
        {/* Header */}
        <div className="mb-10">
          <Badge
            variant="secondary"
            className="mb-3 border-primary/30 bg-primary/10 text-primary"
          >
            <Sparkles className="mr-1 h-3 w-3" />
            AI Ad Engine
          </Badge>
          <h1 className="text-3xl font-bold text-foreground md:text-5xl">
            Create Your Ad Campaign
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            One prompt. Every platform. Conversion-optimized ad copy generated by a
            multi-step AI pipeline — not a single generic prompt.
          </p>
        </div>

        {generating ? (
          <Card className="border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
              <h2 className="mb-2 text-xl font-semibold text-foreground">
                Building your campaign...
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">{progressStage}</p>
              <Progress value={progressPct} className="w-full max-w-md" />
              <p className="mt-2 text-xs text-muted-foreground">{progressPct}% complete</p>
              <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-muted-foreground sm:grid-cols-5">
                {[
                  { label: "Product Analysis", threshold: 10 },
                  { label: "Audience Targeting", threshold: 25 },
                  { label: "Hook Generation", threshold: 40 },
                  { label: "Ad Creation", threshold: 50 },
                  { label: "Optimization", threshold: 85 },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center gap-1.5 ${
                      progressPct >= s.threshold ? "text-primary" : ""
                    }`}
                  >
                    {progressPct >= s.threshold ? (
                      <Zap className="h-3 w-3" />
                    ) : (
                      <div className="h-3 w-3 rounded-full border border-border" />
                    )}
                    {s.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            {/* Left column — form */}
            <div className="space-y-6">
              {/* Product Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Product / Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Product Name *
                    </label>
                    <Input
                      placeholder="e.g. GlowSkin Vitamin C Serum"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Description *
                    </label>
                    <Textarea
                      placeholder="What does it do? What makes it special? Key features, price point, etc."
                      className="min-h-[100px]"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Target Audience *
                    </label>
                    <Input
                      placeholder="e.g. Women 25-40 who care about skincare, active on TikTok and Instagram"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5 text-primary" />
                    Platforms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Select the platforms for your ad campaign. Each platform gets
                    custom-formatted, optimized ad copy.
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PLATFORMS.map((p) => {
                      const selected = selectedPlatforms.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => togglePlatform(p.id)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                            selected
                              ? `${p.color} border-current`
                              : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          }`}
                        >
                          <span className="text-base">{p.icon}</span>
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Tone */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Campaign Tone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {TONES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTone(t.id)}
                        className={`rounded-lg border px-3 py-2 text-left transition-all ${
                          tone === t.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs opacity-70">{t.description}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Optional */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Optional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Call to Action
                    </label>
                    <Input
                      placeholder="e.g. Shop Now, Book a Demo, Link in bio"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Brand Voice Notes
                    </label>
                    <Textarea
                      placeholder="Any specific brand voice guidelines, words to avoid, etc."
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column — summary + generate */}
            <div className="space-y-6">
              <Card className="sticky top-24 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Campaign Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Product</span>
                      <span className="font-medium text-foreground">
                        {productName || "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tone</span>
                      <Badge variant="secondary" className="text-xs">
                        {TONES.find((t) => t.id === tone)?.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms</span>
                      <span className="font-medium text-foreground">
                        {selectedPlatforms.length}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      AI Pipeline Stages
                    </h4>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      {[
                        { icon: Target, label: "Product deep-analysis" },
                        { icon: BarChart3, label: "Audience profiling" },
                        { icon: Zap, label: "Hook generation (6 variants)" },
                        { icon: Video, label: `Platform ads (${selectedPlatforms.length})` },
                        { icon: Type, label: "Conversion optimization" },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center gap-2">
                          <s.icon className="h-3 w-3 text-primary/60" />
                          {s.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-center">
                    <div className="text-2xl font-bold text-primary">
                      {3 + selectedPlatforms.length * 2}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      AI stages will run
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={
                      !productName.trim() ||
                      !productDescription.trim() ||
                      !targetAudience.trim() ||
                      selectedPlatforms.length === 0
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Campaign
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Uses ~{3 + selectedPlatforms.length * 2 * 3} credits
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
