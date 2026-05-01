import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Calendar,
  Zap,
  BarChart3,
  Megaphone,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useCampaigns } from "@/hooks/use-campaigns";
import { formatPlatformName } from "@modules/ad-engine/pipeline";
import type { AdPlatform } from "@modules/ad-engine/types";

const PLATFORM_ICONS: Record<AdPlatform, string> = {
  tiktok: "🎵",
  instagram_reels: "📸",
  facebook: "📘",
  google_ads: "🔍",
  youtube_shorts: "🎬",
  landing_page: "🌐",
};

export default function CampaignDashboard() {
  const { campaigns, deleteCampaign } = useCampaigns();

  const totalCredits = campaigns.reduce((sum, c) => sum + c.creditsUsed, 0);
  const totalAds = campaigns.reduce((sum, c) => sum + c.ads.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-24">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Badge
              variant="secondary"
              className="mb-3 border-primary/30 bg-primary/10 text-primary"
            >
              <BarChart3 className="mr-1 h-3 w-3" />
              Campaign Hub
            </Badge>
            <h1 className="text-3xl font-bold text-foreground md:text-5xl">
              Your Campaigns
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              View, manage, and export all your AI-generated ad campaigns.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/create-campaign">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{campaigns.length}</p>
                <p className="text-xs text-muted-foreground">Campaigns</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalAds}</p>
                <p className="text-xs text-muted-foreground">Ads Generated</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
                <p className="text-xs text-muted-foreground">Credits Used</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(campaigns.flatMap((c) => c.ads.map((a) => a.platform))).size}
                </p>
                <p className="text-xs text-muted-foreground">Platforms</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        {campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Megaphone className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No campaigns yet
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                Create your first AI-powered ad campaign. Enter your product, pick
                platforms, and let AlterAI generate conversion-optimized ads.
              </p>
              <Button asChild>
                <Link to="/create-campaign">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Campaign
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="transition-colors hover:border-primary/20"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="truncate text-lg font-semibold text-foreground">
                          {campaign.brief.productName}
                        </h3>
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {campaign.brief.tone}
                        </Badge>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {campaign.brief.productDescription}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {campaign.creditsUsed} credits
                        </span>
                        <div className="flex gap-1">
                          {campaign.ads.map((a) => (
                            <span
                              key={a.platform}
                              title={formatPlatformName(a.platform)}
                            >
                              {PLATFORM_ICONS[a.platform]}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          if (window.confirm("Delete this campaign?")) {
                            deleteCampaign(campaign.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/campaign/${campaign.id}`}>
                          View
                          <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
