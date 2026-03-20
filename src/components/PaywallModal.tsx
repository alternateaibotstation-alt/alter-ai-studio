import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Crown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TIER_CONFIG } from "@/lib/tiers";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: "messages" | "images" | "premium_bot";
}

export default function PaywallModal({ open, onOpenChange, reason = "messages" }: Props) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const { tier } = useSubscription();

  const reasonText = {
    messages: "You've reached your daily message limit.",
    images: "You've reached your daily image generation limit.",
    premium_bot: "This bot requires a subscription to continue.",
  };

  const handleUpgrade = async (selectedTier: "pro" | "power") => {
    setLoadingTier(selectedTier);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { tier: selectedTier },
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
          {(["pro", "power"] as const).map((t) => {
            const config = TIER_CONFIG[t];
            const isCurrent = tier === t;
            const Icon = t === "power" ? Crown : Zap;

            return (
              <div key={t} className={`rounded-xl border p-4 space-y-3 ${
                t === "power" ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${t === "power" ? "text-primary" : "text-accent"}`} />
                    <span className="font-semibold text-foreground">{config.name}</span>
                    {t === "power" && <Badge variant="secondary" className="text-xs">Best Value</Badge>}
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
                  variant={t === "power" ? "default" : "outline"}
                  disabled={isCurrent || loadingTier !== null}
                  onClick={() => handleUpgrade(t)}
                >
                  {loadingTier === t ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
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
