import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Crown, Check, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIER_CONFIG } from "@/lib/tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "messages" | "images" | "premium_bot";
}

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

export default function PaywallModal({ open, onOpenChange, reason = "messages" }: Props) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { tier } = useSubscription();

  const reasonText = {
    messages: "You've reached your daily message limit.",
    images: "You've reached your daily image generation limit.",
    premium_bot: "This bot requires a subscription to continue.",
  };

  const handleUpgrade = async (selectedTier: "creator" | "pro" | "studio") => {
    const priceId = TIER_CONFIG[selectedTier].price_id;
    setLoadingTier(selectedTier);
    const loadingToast = toast.loading("Preparing secure checkout…");
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: selectedTier, priceId },
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Upgrade Your Experience
          </DialogTitle>
          <DialogDescription>{reasonText[reason]}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {(["creator", "pro", "studio"] as const).map((t) => {
            const config = TIER_CONFIG[t];
            const isCurrent = (tier === "power" ? "studio" : tier) === t;
            const Icon = t === "studio" ? Crown : t === "creator" ? Rocket : Zap;

            return (
              <div key={t} className={`rounded-xl border p-4 space-y-3 ${
                t === "creator" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${t === "creator" ? "text-primary" : "text-accent"}`} />
                    <span className="font-semibold text-foreground">{config.name}</span>
                    {t === "creator" && <Badge variant="secondary" className="text-xs">Most Popular</Badge>}
                  </div>
                  <span className="text-lg font-bold text-foreground">${config.price}/mo</span>
                </div>
                <ul className="space-y-1.5">
                  {config.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={t === "creator" ? "default" : "outline"}
                  disabled={isCurrent || loadingTier !== null}
                  onClick={() => handleUpgrade(t)}
                >
                  {loadingTier === t ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Opening checkout…</>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    `Upgrade to ${config.name}`
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
