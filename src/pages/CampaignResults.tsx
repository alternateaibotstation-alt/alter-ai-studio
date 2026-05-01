import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Copy,
  Check,
  RefreshCw,
  Download,
  ArrowLeft,
  Loader2,
  Sparkles,
  Target,
  Users,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { useCampaigns } from "@/hooks/use-campaigns";
import { regeneratePlatformAd, formatPlatformName } from "@modules/ad-engine/pipeline";
import type { AdPlatform, PlatformAdOutput, CampaignResult } from "@modules/ad-engine/types";

const PLATFORM_ICONS: Record<AdPlatform, string> = {
  tiktok: "🎵",
  instagram_reels: "📸",
  facebook: "📘",
  google_ads: "🔍",
  youtube_shorts: "🎬",
  landing_page: "🌐",
};

export default function CampaignResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCampaign, saveCampaign } = useCampaigns();
  const campaign = getCampaign(id ?? "");

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<AdPlatform | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const activeTab = useMemo(
    () => campaign?.ads[0]?.platform ?? "tiktok",
    [campaign]
  );

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 pb-20 pt-24 text-center">
          <h1 className="text-2xl font-bold text-foreground">Campaign not found</h1>
          <p className="mt-2 text-muted-foreground">
            This campaign may have been deleted or the link is invalid.
          </p>
          <Button asChild className="mt-6">
            <Link to="/campaigns">Back to Campaigns</Link>
          </Button>
        </main>
      </div>
    );
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRegenerate = async (platform: AdPlatform) => {
    setRegenerating(platform);
    try {
      const { ad: newAd, creditsUsed: regenCredits } = await regeneratePlatformAd(platform, campaign);
      const updatedCampaign: CampaignResult = {
        ...campaign,
        ads: campaign.ads.map((a) =>
          a.platform === platform ? newAd : a
        ),
        creditsUsed: campaign.creditsUsed + regenCredits,
      };
      saveCampaign(updatedCampaign);
      toast.success(`${formatPlatformName(platform)} ad regenerated! (${regenCredits} credits)`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Regeneration failed";
      toast.error(msg);
    } finally {
      setRegenerating(null);
    }
  };

  const exportCampaign = () => {
    const blob = new Blob([JSON.stringify(campaign, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alterai-campaign-${campaign.brief.productName.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Campaign exported!");
  };

  const exportPlainText = () => {
    let text = `AlterAI Campaign: ${campaign.brief.productName}\n`;
    text += `Generated: ${new Date(campaign.createdAt).toLocaleDateString()}\n`;
    text += `Tone: ${campaign.brief.tone}\n\n`;
    text += "═══════════════════════════════════════\n\n";

    for (const adOutput of campaign.ads) {
      text += `▸ ${formatPlatformName(adOutput.platform).toUpperCase()}\n`;
      text += "───────────────────────────────────────\n";
      text += formatAdAsText(adOutput);
      text += "\n\n";
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alterai-campaign-${campaign.brief.productName.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Text export downloaded!");
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={() => copyText(text, label)}
    >
      {copiedField === label ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      Copy
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-2 text-muted-foreground"
              onClick={() => navigate("/campaigns")}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              All Campaigns
            </Button>
            <h1 className="text-2xl font-bold text-foreground md:text-4xl">
              {campaign.brief.productName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{campaign.brief.tone} tone</Badge>
              <Badge variant="outline">
                {campaign.ads.length} platform{campaign.ads.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="outline">
                {campaign.creditsUsed} credits used
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportPlainText}>
              <Download className="mr-1 h-4 w-4" />
              Export .txt
            </Button>
            <Button variant="outline" size="sm" onClick={exportCampaign}>
              <Download className="mr-1 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        {/* Strategic Insights (collapsible) */}
        <Card className="mb-6 border-primary/10">
          <CardHeader
            className="cursor-pointer"
            onClick={() => setInsightsOpen(!insightsOpen)}
          >
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Strategic Insights
              </span>
              {insightsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </CardTitle>
          </CardHeader>
          {insightsOpen && (
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Sparkles className="h-3 w-3 text-primary" />
                    Unique Selling Points
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {campaign.productInsight.uniqueSellingPoints.map((usp, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Zap className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                        {usp}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Users className="h-3 w-3 text-primary" />
                    Audience Profile
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {campaign.audienceProfile.demographics}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {campaign.audienceProfile.psychographics}
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Pain Points
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {campaign.productInsight.painPoints.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-foreground">
                    Buying Triggers
                  </h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {campaign.audienceProfile.buyingTriggers.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Hooks */}
              <div className="mt-6">
                <h4 className="mb-3 text-sm font-semibold text-foreground">
                  Generated Hooks
                </h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {campaign.hooks.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3"
                    >
                      <div>
                        <Badge variant="outline" className="mb-1.5 text-xs">
                          {h.hookType}
                        </Badge>
                        <p className="text-sm text-foreground">"{h.hook}"</p>
                      </div>
                      <CopyButton text={h.hook} label={`hook-${i}`} />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Platform Tabs */}
        <Tabs defaultValue={activeTab}>
          <TabsList className="mb-4 flex-wrap">
            {campaign.ads.map((ad) => (
              <TabsTrigger key={ad.platform} value={ad.platform} className="gap-1.5">
                <span>{PLATFORM_ICONS[ad.platform]}</span>
                {formatPlatformName(ad.platform)}
              </TabsTrigger>
            ))}
          </TabsList>

          {campaign.ads.map((adOutput) => (
            <TabsContent key={adOutput.platform} value={adOutput.platform}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-xl">
                      {PLATFORM_ICONS[adOutput.platform]}
                    </span>
                    {formatPlatformName(adOutput.platform)} Ad
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(adOutput.platform)}
                    disabled={regenerating !== null}
                  >
                    {regenerating === adOutput.platform ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-4 w-4" />
                    )}
                    Regenerate
                  </Button>
                </CardHeader>
                <CardContent>
                  <PlatformAdDisplay
                    adOutput={adOutput}
                    copyText={copyText}
                    copiedField={copiedField}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
      <SiteFooter />
    </div>
  );
}

function PlatformAdDisplay({
  adOutput,
  copyText,
  copiedField,
}: {
  adOutput: PlatformAdOutput;
  copyText: (text: string, label: string) => void;
  copiedField: string | null;
}) {
  const ad = adOutput.ad as Record<string, unknown>;
  const platform = adOutput.platform;

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 gap-1 text-xs"
      onClick={() => copyText(text, label)}
    >
      {copiedField === label ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
      Copy
    </Button>
  );

  const renderField = (label: string, value: unknown, key: string) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      return (
        <div key={key} className="rounded-lg bg-muted/50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{label}</h4>
            <CopyBtn text={value} label={`${platform}-${key}`} />
          </div>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{value}</p>
        </div>
      );
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return null;
      if (typeof value[0] === "string") {
        return (
          <div key={key} className="rounded-lg bg-muted/50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">{label}</h4>
              <CopyBtn
                text={value.join(", ")}
                label={`${platform}-${key}`}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {value.map((v: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {v}
                </Badge>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div key={key} className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-foreground">{label}</h4>
          <div className="space-y-3">
            {value.map((item: Record<string, unknown>, i: number) => (
              <div
                key={i}
                className="rounded-md border border-border bg-background p-3"
              >
                {Object.entries(item).map(([k, v]) => (
                  <div key={k} className="mb-1 last:mb-0">
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatFieldName(k)}:
                    </span>{" "}
                    <span className="text-sm text-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (typeof value === "object") {
      return (
        <div key={key} className="rounded-lg bg-muted/50 p-4">
          <h4 className="mb-2 text-sm font-semibold text-foreground">{label}</h4>
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k} className="mb-1">
              <span className="text-xs font-medium text-muted-foreground">
                {formatFieldName(k)}:
              </span>{" "}
              <span className="text-sm text-foreground">{String(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {Object.entries(ad).map(([key, value]) =>
        renderField(formatFieldName(key), value, key)
      )}
    </div>
  );
}

function formatFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

function formatAdAsText(adOutput: PlatformAdOutput): string {
  const ad = adOutput.ad as Record<string, unknown>;
  let text = "";

  for (const [key, value] of Object.entries(ad)) {
    const label = formatFieldName(key);
    if (typeof value === "string") {
      text += `${label}: ${value}\n`;
    } else if (Array.isArray(value)) {
      if (value.length > 0 && typeof value[0] === "string") {
        text += `${label}: ${value.join(", ")}\n`;
      } else {
        text += `${label}:\n`;
        value.forEach((item: Record<string, unknown>, i: number) => {
          text += `  ${i + 1}. ${Object.entries(item)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ")}\n`;
        });
      }
    } else if (typeof value === "object" && value !== null) {
      text += `${label}:\n`;
      Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
        text += `  ${formatFieldName(k)}: ${v}\n`;
      });
    }
  }

  return text;
}
