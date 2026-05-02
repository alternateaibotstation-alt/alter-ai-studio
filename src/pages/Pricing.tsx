import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Zap,
  Crown,
  Star,
  Rocket,
  Video,
  Image as ImageIcon,
  Type,
  Mic,
} from "lucide-react";
import { TIER_CONFIG } from "@/lib/tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const plans = [
  {
    key: "free" as const,
    name: "Free",
    price: 0,
    desc: "Try the platform",
    icon: Zap,
    features: [
      "Text ad generation only",
      "5 daily credits",
      "Basic hooks & captions",
      "No image or video generation",
    ],
    cta: "Get Started Free",
  },
  {
    key: "starter" as const,
    name: "Starter",
    price: 12,
    desc: "Solo creators getting started",
    icon: Star,
    config: TIER_CONFIG.starter,
    features: TIER_CONFIG.starter.features,
    cta: "Start Creating",
  },
  {
    key: "creator" as const,
    name: "Creator",
    price: 29,
    desc: "The main plan for ad creators",
    icon: Crown,
    highlighted: true,
    config: TIER_CONFIG.creator,
    features: TIER_CONFIG.creator.features,
    cta: "Most Popular",
  },
  {
    key: "pro" as const,
    name: "Pro",
    price: 59,
    desc: "Full video ad generation",
    icon: Video,
    config: TIER_CONFIG.pro,
    features: TIER_CONFIG.pro.features,
    cta: "Go Pro",
  },
  {
    key: "studio" as const,
    name: "Studio",
    price: 99,
    desc: "Agencies & bulk usage",
    icon: Rocket,
    config: TIER_CONFIG.studio,
    features: TIER_CONFIG.studio.features,
    cta: "Contact Sales",
  },
];

export default function Pricing() {
  const { tier } = useSubscription();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planKey: string) => {
    if (planKey === "free") {
      navigate("/auth");
      return;
    }

    const config =
      TIER_CONFIG[planKey as keyof typeof TIER_CONFIG];
    if (!config) return;

    setLoadingPlan(planKey);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        { body: { tier: planKey, priceId: config.price_id } },
      );
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing - Alterai.im | AI Ad Campaign Generator"
        description="Generate complete ad campaigns with AI. Plans from $0 to $99/month. Video ads, image ads, captions, and more."
      />
      <Navbar />

      <div className="pt-28 pb-20 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 font-display">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free. Upgrade when you need more power. Cancel anytime.
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.key === tier;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 flex flex-col glass-card card-hover ${
                  plan.highlighted
                    ? "ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/10"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white border-0">
                    Most Popular
                  </Badge>
                )}

                <div className="mb-4">
                  <plan.icon
                    className={`w-6 h-6 mb-3 ${plan.highlighted ? "text-cyan-500" : "text-muted-foreground"}`}
                  />
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  <span className="text-3xl font-extrabold gradient-text">
                    ${plan.price}
                  </span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm"
                    >
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  variant={plan.highlighted ? "default" : "outline"}
                  className="w-full"
                  disabled={isCurrent || loadingPlan === plan.key}
                  onClick={() => handleSubscribe(plan.key)}
                >
                  {loadingPlan === plan.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-8">What's Included</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Type,
                title: "Text Generation",
                desc: "Hooks, captions, CTAs",
                plans: "All plans",
              },
              {
                icon: ImageIcon,
                title: "Image Ads",
                desc: "DALL-E powered visuals",
                plans: "Starter+",
              },
              {
                icon: Mic,
                title: "AI Voiceovers",
                desc: "ElevenLabs narration",
                plans: "Creator+",
              },
              {
                icon: Video,
                title: "Video Ads",
                desc: "Runway ML generation",
                plans: "Pro+",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-5 rounded-xl border border-border/50 bg-card/30"
              >
                <item.icon className="w-6 h-6 text-primary mb-3 mx-auto" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {item.desc}
                </p>
                <Badge variant="secondary" className="text-xs">
                  {item.plans}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
