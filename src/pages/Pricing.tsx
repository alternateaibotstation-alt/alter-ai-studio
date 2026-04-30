import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Crown, Star, Rocket, Video, MessageSquare, Image as ImageIcon } from "lucide-react";
import chromeTexture from "@/assets/chrome-texture.jpg";
import { TIER_CONFIG, TIER_LIMITS, type UserTier } from "@/lib/tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

/* ─── Per-tier usage cap progress bars ─── */
function UsageCapBars({
  tierKey,
  isCurrent,
  messagesUsed,
  imagesUsed,
}: {
  tierKey: Exclude<UserTier, "power">;
  isCurrent: boolean;
  messagesUsed: number;
  imagesUsed: number;
}) {
  const limits = TIER_LIMITS[tierKey];
  const msgCap = limits.messages;
  const imgCap = limits.images;

  // For non-current tiers we show the full cap as a preview (0% used).
  const msgUsed = isCurrent ? Math.min(messagesUsed, msgCap) : 0;
  const imgUsed = isCurrent ? Math.min(imagesUsed, imgCap) : 0;

  const msgRemaining = Math.max(0, msgCap - msgUsed);
  const imgRemaining = Math.max(0, imgCap - imgUsed);
  const msgPct = msgCap > 0 ? (msgUsed / msgCap) * 100 : 0;
  const imgPct = imgCap > 0 ? (imgUsed / imgCap) * 100 : 0;

  const Row = ({
    icon: Icon,
    label,
    used,
    cap,
    remaining,
    pct,
  }: {
    icon: typeof MessageSquare;
    label: string;
    used: number;
    cap: number;
    remaining: number;
    pct: number;
  }) => {
    const danger = pct >= 90;
    const warn = pct >= 70 && pct < 90;
    return (
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Icon className="w-3 h-3" />
            {label}
          </span>
          <span className={`font-medium tabular-nums ${
            isCurrent ? (danger ? "text-destructive" : warn ? "text-amber-500" : "text-foreground") : "text-muted-foreground"
          }`}>
            {isCurrent
              ? cap === 0
                ? "Not included"
                : `${remaining.toLocaleString()} left of ${cap.toLocaleString()}`
              : cap === 0
                ? "Not included"
                : `${cap.toLocaleString()} / month`}
          </span>
        </div>
        <Progress
          value={cap === 0 ? 0 : isCurrent ? pct : 0}
          className={`h-1.5 ${cap === 0 ? "opacity-40" : ""} ${
            isCurrent && danger ? "[&>div]:bg-destructive" : isCurrent && warn ? "[&>div]:bg-amber-500" : ""
          }`}
        />
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 mb-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
          {isCurrent ? "Your usage this month" : "Monthly caps"}
        </p>
        {isCurrent && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary font-semibold">
            Current
          </span>
        )}
      </div>
      <Row
        icon={MessageSquare}
        label="Messages"
        used={msgUsed}
        cap={msgCap}
        remaining={msgRemaining}
        pct={msgPct}
      />
      <Row
        icon={ImageIcon}
        label="Image generations"
        used={imgUsed}
        cap={imgCap}
        remaining={imgRemaining}
        pct={imgPct}
      />
    </div>
  );
}


const tiers: Array<{
  key: "free" | "starter" | "creator" | "pro" | "studio";
  name: string;
  price: number;
  icon: typeof Star;
  features: readonly string[];
  priceId?: string;
  popular?: boolean;
}> = [
  {
    key: "free" as const,
    name: "Free",
    price: 0,
    icon: Star,
    features: [
      `${TIER_LIMITS.free.messages} messages/day`,
      "Text only",
      "No video generation",
      "Basic AI models",
      "Concise responses",
    ],
  },
  {
    key: "starter" as const,
    name: TIER_CONFIG.starter.name,
    price: TIER_CONFIG.starter.price,
    icon: Zap,
    features: TIER_CONFIG.starter.features,
    priceId: TIER_CONFIG.starter.price_id,
  },
  {
    key: "creator" as const,
    name: TIER_CONFIG.creator.name,
    price: TIER_CONFIG.creator.price,
    icon: Rocket,
    features: TIER_CONFIG.creator.features,
    priceId: TIER_CONFIG.creator.price_id,
    popular: true,
  },
  {
    key: "pro" as const,
    name: TIER_CONFIG.pro.name,
    price: TIER_CONFIG.pro.price,
    icon: Video,
    features: TIER_CONFIG.pro.features,
    priceId: TIER_CONFIG.pro.price_id,
  },
  {
    key: "studio" as const,
    name: TIER_CONFIG.studio.name,
    price: TIER_CONFIG.studio.price,
    icon: Crown,
    features: TIER_CONFIG.studio.features,
    priceId: TIER_CONFIG.studio.price_id,
  },
];

const getCheckoutErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error || "");

  if (/not authenticated|authorization|jwt|session/i.test(message)) {
    return "Please sign in again before starting checkout.";
  }

  if (/invalid tier|price|product/i.test(message)) {
    return "This plan is not available for checkout yet. Please try another plan or contact support.";
  }

  if (/network|fetch|failed to send|timeout/i.test(message)) {
    return "We could not reach checkout. Check your connection and try again.";
  }

  return "Checkout could not be started right now. Please try again in a moment.";
};

export default function Pricing() {
  const { tier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const resumedCheckout = useRef(false);
  const coupon = searchParams.get("coupon");
  const currentTier = tier === "power" ? "studio" : tier;

  const handleUpgrade = async (selectedTier: "free" | "starter" | "creator" | "pro" | "studio", selectedPriceId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in first");
      navigate("/auth", { state: { from: "/pricing", checkout: { tier: selectedTier, priceId: selectedPriceId } } });
      return;
    }

    if (selectedTier === "free") {
      navigate("/dashboard");
      return;
    }

    setLoadingTier(selectedTier);
    const loadingToast = toast.loading("Preparing secure checkout…");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: selectedTier, priceId: selectedPriceId, coupon: coupon || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error("Missing checkout URL");
      toast.success("Checkout is ready. Opening Stripe…", { id: loadingToast });
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(getCheckoutErrorMessage(err), { id: loadingToast });
    } finally {
      setLoadingTier(null);
    }
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to open portal");
    }
  };

  useEffect(() => {
    const checkout = (location.state as { checkout?: { tier?: string; priceId?: string } } | null)?.checkout;
    const selectedTier = tiers.find((item) => item.key === checkout?.tier);

    if (resumedCheckout.current || !selectedTier || selectedTier.key === "free") return;

    resumedCheckout.current = true;
    void handleUpgrade(selectedTier.key, checkout?.priceId || selectedTier.priceId);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Pricing — AI Creator Plans"
        description="Credit-based Alterai.im plans for text, images, captions, video generation, bulk workflows, API access, and team features."
        path="/pricing"
      />
      <Navbar />
      <section className="relative pt-28 pb-10 px-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-soft-light"
          style={{
            backgroundImage: `url(${chromeTexture})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[hsl(var(--primary)/0.10)] blur-[140px]" />
          <div className="absolute top-20 right-[15%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--accent)/0.25)] blur-[120px]" />
        </div>
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-copper">Choose Your Plan</span>
          </h1>
          <p className="text-muted-foreground mt-5 max-w-lg mx-auto text-lg">
            Unlock the full power of Alter AI with a plan that suits your needs
          </p>
        </div>
      </section>
      <div className="container mx-auto pb-16 px-4 max-w-5xl">
        <div className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {tiers.map((t) => {
            const isCurrent = currentTier === t.key;
            const Icon = t.icon;

            return (
              <div key={t.key} className={`rounded-2xl border p-6 flex flex-col relative ${
                t.popular ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"
              }`}>
                {t.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <Icon className={`w-5 h-5 ${t.popular ? "text-primary" : "text-muted-foreground"}`} />
                  <h2 className="text-xl font-bold text-foreground">{t.name}</h2>
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-foreground">${t.price}</span>
                  {t.price > 0 && <span className="text-muted-foreground">/mo</span>}
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" disabled={t.key === "free"} onClick={t.key === "free" ? undefined : handleManage}>
                    {t.key === "free" ? "Current Plan" : "Manage Subscription"}
                  </Button>
                ) : (
                  <Button
                    variant={t.popular ? "default" : "outline"}
                    disabled={loadingTier !== null}
                    onClick={() => handleUpgrade(t.key, t.priceId)}
                  >
                    {loadingTier === t.key ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout…</>
                    ) : t.key === "free" ? (
                      "Start Free"
                    ) : (
                      `Upgrade to ${t.name}`
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
