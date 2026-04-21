import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star } from "lucide-react";
import chromeTexture from "@/assets/chrome-texture.jpg";
import { TIER_CONFIG, TIER_LIMITS } from "@/lib/tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const tiers = [
  {
    key: "free" as const,
    name: "Free",
    price: 0,
    icon: Star,
    features: [
      `${TIER_LIMITS.free.messages} messages/day`,
      `${TIER_LIMITS.free.images} image generations/day`,
      "Basic AI models",
      "Concise responses",
    ],
  },
  {
    key: "pro" as const,
    name: TIER_CONFIG.pro.name,
    price: TIER_CONFIG.pro.price,
    icon: Zap,
    features: TIER_CONFIG.pro.features,
    popular: true,
  },
  {
    key: "power" as const,
    name: TIER_CONFIG.power.name,
    price: TIER_CONFIG.power.price,
    icon: Crown,
    features: TIER_CONFIG.power.features,
  },
];

export default function Pricing() {
  const { tier } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const coupon = searchParams.get("coupon");

  const handleUpgrade = async (selectedTier: "pro" | "power") => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    setLoadingTier(selectedTier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: selectedTier, coupon: coupon || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
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

  return (
    <div className="min-h-screen bg-background">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => {
            const isCurrent = tier === t.key;
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
                {t.key === "free" ? (
                  <Button variant="outline" disabled={isCurrent}>
                    {isCurrent ? "Current Plan" : "Free"}
                  </Button>
                ) : isCurrent ? (
                  <Button variant="outline" onClick={handleManage}>
                    Manage Subscription
                  </Button>
                ) : (
                  <Button
                    variant={t.popular ? "default" : "outline"}
                    disabled={loadingTier !== null}
                    onClick={() => handleUpgrade(t.key as "pro" | "power")}
                  >
                    {loadingTier === t.key ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
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
