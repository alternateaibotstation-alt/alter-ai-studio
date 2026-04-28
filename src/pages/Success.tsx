import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Loader2, RefreshCw, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { TIER_CONFIG, type UserTier } from "@/lib/tiers";
import { toast } from "sonner";

const getPlanName = (tier: string | null | undefined) => {
  if (!tier || tier === "free") return "Free";
  const normalized = tier === "power" ? "studio" : tier;
  return TIER_CONFIG[normalized as keyof typeof TIER_CONFIG]?.name || "your plan";
};

export default function Success() {
  const [searchParams] = useSearchParams();
  const requestedTier = searchParams.get("tier") as UserTier | null;
  const isSubscriptionCheckout = searchParams.get("subscription") === "true";
  const { tier, subscribed, subscriptionEnd, loading, refresh } = useSubscription();
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(isSubscriptionCheckout);
  const retryTimers = useRef<number[]>([]);

  const currentPlanName = useMemo(() => getPlanName(tier), [tier]);
  const requestedPlanName = useMemo(() => getPlanName(requestedTier), [requestedTier]);
  const displayPlanName = confirmedDisplayPlan(isSubscriptionCheckout, requestedPlanName, currentPlanName, tier);
  const confirmed = isSubscriptionCheckout && subscribed && tier !== "free";
  const processing = isSubscriptionCheckout && !confirmed && (loading || refreshing || isVerifying);

  const refreshStatus = async () => {
    setRefreshing(true);
    try {
      await refresh();
      toast.success("Subscription status refreshed");
    } catch {
      toast.error("Could not refresh subscription yet. Please try again shortly.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!isSubscriptionCheckout) return;

    const retryDelays = [0, 2500, 6000, 12000];
    setIsVerifying(true);
    setRetryCount(0);

    retryDelays.forEach((delay, index) => {
      const timer = window.setTimeout(async () => {
        setRetryCount(index);
        await refresh();
        if (index === retryDelays.length - 1) setIsVerifying(false);
      }, delay);
      retryTimers.current.push(timer);
    });

    return () => {
      retryTimers.current.forEach(window.clearTimeout);
      retryTimers.current = [];
    };
  }, [isSubscriptionCheckout, refresh]);

  useEffect(() => {
    if (confirmed) setIsVerifying(false);
  }, [confirmed]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 pb-16 px-4 flex items-center justify-center">
        <div className="text-center max-w-xl space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            {processing ? <Loader2 className="w-8 h-8 text-accent animate-spin" /> : <Check className="w-8 h-8 text-accent" />}
          </div>
          <div className="space-y-3">
            <Badge variant="secondary" className="gap-1.5"><Sparkles className="h-3.5 w-3.5" /> {processing ? "Verifying plan" : "Checkout complete"}</Badge>
            <h1 className="text-3xl font-bold text-foreground">
              {confirmed ? `${currentPlanName} is active` : `${displayPlanName} checkout complete`}
            </h1>
          </div>
          <p className="text-muted-foreground">
            {confirmed
              ? `Your ${currentPlanName} subscription is reflected in your account. Your protected credits and plan limits are ready to use.`
              : `We received your ${requestedPlanName} purchase and are refreshing your account status${processing ? `, retry ${retryCount + 1} of 4` : ". Use refresh if it is still processing"}.`}
          </p>
          <div className="rounded-xl border border-border bg-card p-4 text-left text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Purchased plan:</span> {requestedPlanName}</p>
            <p><span className="font-medium text-foreground">Account status:</span> {confirmed ? `${currentPlanName} active` : "Processing"}</p>
            {subscriptionEnd && <p><span className="font-medium text-foreground">Renews/ends:</span> {new Date(subscriptionEnd).toLocaleDateString()}</p>}
            <p><span className="font-medium text-foreground">Next step:</span> Open your dashboard and start creating with credit-protected AI tools.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild>
              <Link to="/dashboard">
                Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link to="/content-creator">Create Content</Link>
            </Button>
            <Button variant="outline" onClick={refreshStatus} disabled={refreshing || loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} /> Refresh Status
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
