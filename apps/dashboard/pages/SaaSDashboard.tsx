import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Loader2,
  Download,
  Image as ImageIcon,
  Video,
  Type,
  CreditCard,
  Sparkles,
  ArrowRight,
  Hash,
  Target,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

interface CampaignPreview {
  id: string;
  input: string;
  hooks: string[];
  captions: string[];
  hashtags: string[];
  imageCount: number;
  videoCount: number;
  ctaVariations: string[];
  audienceTargeting: string[];
  status: "generating" | "completed";
}

export default function SaaSDashboard() {
  const { tier, remainingCampaigns, remainingImages, remainingVideos } =
    useSubscription();
  const [productInput, setProductInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState<CampaignPreview | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productInput.trim()) return;

    setGenerating(true);
    setCampaign(null);

    try {
      await new Promise((r) => setTimeout(r, 2000));

      setCampaign({
        id: crypto.randomUUID(),
        input: productInput,
        hooks: [
          `POV: You just discovered ${productInput}`,
          `Stop scrolling if you need ${productInput}`,
          `This ${productInput} changed everything`,
          `Nobody talks about this ${productInput} hack`,
          `Wait until you see what this can do`,
        ],
        captions: [
          `Introducing ${productInput} - the solution you've been waiting for. Link in bio.`,
          `${productInput} just dropped and the internet isn't ready. Shop now.`,
          `We built ${productInput} because you deserve better. Try it free today.`,
        ],
        hashtags: ["#fyp", "#viral", "#ad", "#sponsored", "#trending"],
        imageCount: 5,
        videoCount: tier === "pro" || tier === "studio" ? 3 : 0,
        ctaVariations: [
          "Shop Now - Limited Time",
          "Get Started Free",
          "Link in Bio",
        ],
        audienceTargeting: [
          "Interest-based targeting for related products",
          "Lookalike audiences from existing customers",
          "Retargeting website visitors",
          "Age 18-35, urban, mobile-first",
        ],
        status: "completed",
      });

      toast.success("Campaign generated successfully!");
    } catch {
      toast.error("Failed to generate campaign");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Ad Campaign Studio
            </h1>
            <p className="text-muted-foreground mt-1">
              Generate complete ad campaigns from a single input
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border">
              <CreditCard className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {remainingCampaigns()} campaigns left today
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/pricing">
                <Zap className="w-4 h-4 mr-1" /> Upgrade
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Input */}
        <form
          onSubmit={handleGenerate}
          className="mb-12 p-8 rounded-2xl border border-border bg-card/50 backdrop-blur"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Create Ad Campaign</h2>
          </div>
          <p className="text-muted-foreground mb-6 text-sm">
            Describe your product, idea, or business. We'll generate a complete
            multi-platform ad campaign in under 60 seconds.
          </p>
          <div className="flex gap-3">
            <Input
              placeholder='e.g. "Sell skincare product for acne-prone skin" or "Launch a fitness app for busy professionals"'
              value={productInput}
              onChange={(e) => setProductInput(e.target.value)}
              className="flex-1 h-12 text-base"
              disabled={generating}
            />
            <Button
              type="submit"
              size="lg"
              disabled={generating || !productInput.trim()}
              className="h-12 px-6"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Generate Campaign
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Campaign Results */}
        {campaign && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Campaign Results</h2>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  icon: Type,
                  label: "Hooks",
                  value: campaign.hooks.length,
                  color: "text-pink-500",
                },
                {
                  icon: ImageIcon,
                  label: "Image Ads",
                  value: campaign.imageCount,
                  color: "text-amber-500",
                },
                {
                  icon: Video,
                  label: "Video Ads",
                  value: campaign.videoCount,
                  color: "text-blue-500",
                },
                {
                  icon: Hash,
                  label: "Hashtags",
                  value: campaign.hashtags.length,
                  color: "text-green-500",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="p-4 rounded-xl border border-border bg-card/50"
                >
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Hooks */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Type className="w-4 h-4 text-pink-500" /> Hook Variations
              </h3>
              <div className="grid gap-3">
                {campaign.hooks.map((hook, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card/30 flex items-center justify-between"
                  >
                    <span className="text-sm">{hook}</span>
                    <Badge variant="secondary" className="ml-4 shrink-0">
                      Hook {i + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </section>

            {/* Captions */}
            <section>
              <h3 className="text-lg font-semibold mb-3">Captions</h3>
              <div className="grid gap-3">
                {campaign.captions.map((caption, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-border bg-card/30"
                  >
                    <p className="text-sm whitespace-pre-wrap">{caption}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA Variations */}
            <section>
              <h3 className="text-lg font-semibold mb-3">CTA Variations</h3>
              <div className="flex flex-wrap gap-2">
                {campaign.ctaVariations.map((cta, i) => (
                  <Badge key={i} className="px-4 py-2 text-sm">
                    {cta}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Audience Targeting */}
            <section>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" /> Audience
                Targeting
              </h3>
              <div className="grid gap-2">
                {campaign.audienceTargeting.map((target, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <ArrowRight className="w-3 h-3 text-primary" />
                    {target}
                  </div>
                ))}
              </div>
            </section>

            {/* Video Upsell */}
            {campaign.videoCount === 0 && (
              <div className="p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
                <Video className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-1">
                  Want AI Video Ads?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro to generate scene-based video ads with AI
                  voiceovers.
                </p>
                <Button asChild>
                  <Link to="/pricing">Upgrade to Pro - $59/mo</Link>
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!campaign && !generating && (
          <div className="text-center py-20 text-muted-foreground">
            <Rocket className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">
              Enter your product or idea above to generate a full campaign
            </p>
            <p className="text-sm mt-1">
              Complete ad campaigns in under 60 seconds
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
