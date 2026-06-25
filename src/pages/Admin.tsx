import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, Zap, Star, Crown, Video, Rocket } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { toast } from "sonner";
import type { UserTier } from "@/lib/tiers";

const TIERS: { key: UserTier; label: string; icon: typeof Zap; color: string }[] = [
  { key: "free", label: "Free", icon: Zap, color: "text-zinc-400" },
  { key: "starter", label: "Starter", icon: Star, color: "text-blue-400" },
  { key: "creator", label: "Creator", icon: Crown, color: "text-purple-400" },
  { key: "pro", label: "Pro", icon: Video, color: "text-cyan-400" },
  { key: "studio", label: "Studio", icon: Rocket, color: "text-amber-400" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const { tier: currentTier, refresh } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [activeTier, setActiveTier] = useState<string>(currentTier);
  const [isOverride, setIsOverride] = useState(false);

  useEffect(() => {
    setActiveTier(currentTier);
  }, [currentTier]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      // Check admin status via the edge function (will fail with 400 if not admin)
      const { data, error } = await supabase.functions.invoke("admin-set-tier", {
        body: { action: "list" },
      });
      if (error || data?.error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(true);
        // Check if current user has an override
        const myOverride = data?.overrides?.find(
          (o: { user_id: string }) => o.user_id === user.id
        );
        if (myOverride) setIsOverride(true);
      }
      setLoading(false);
    })();
  }, [navigate]);

  const switchTier = useCallback(async (tier: UserTier) => {
    setSwitching(tier);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("admin-set-tier", {
        body: {
          action: "set",
          target_user_id: user.id,
          tier,
          reason: "Admin self-testing",
          expires_in_hours: 24,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setActiveTier(tier);
      setIsOverride(tier !== "free");
      await refresh();
      toast.success(`Switched to ${tier} tier (24h)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to switch tier");
    } finally {
      setSwitching(null);
    }
  }, [refresh]);

  const clearOverride = useCallback(async () => {
    setSwitching("clear");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("admin-set-tier", {
        body: { action: "remove", target_user_id: user.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIsOverride(false);
      await refresh();
      toast.success("Override removed — back to real subscription");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear override");
    } finally {
      setSwitching(null);
    }
  }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto pt-24 pb-16 px-4 max-w-md text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">Admin Only</h1>
          <p className="text-muted-foreground mt-2">You don't have admin access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-lg">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Switch your tier to explore all features. Overrides expire in 24 hours.
        </p>

        {isOverride && (
          <div className="mb-6 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
            <p className="text-sm text-amber-300">
              Tier override active. Your real subscription is preserved underneath.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {TIERS.map(({ key, label, icon: Icon, color }) => {
            const isActive = activeTier === key;
            return (
              <button
                key={key}
                type="button"
                disabled={switching !== null}
                onClick={() => switchTier(key)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  isActive
                    ? "border-cyan-400/50 bg-cyan-400/10 ring-1 ring-cyan-400/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                }`}
              >
                <Icon className={`w-5 h-5 ${color}`} />
                <span className="font-medium flex-1 text-left">{label}</span>
                {isActive && <Badge variant="secondary">Active</Badge>}
                {switching === key && <Loader2 className="w-4 h-4 animate-spin" />}
              </button>
            );
          })}
        </div>

        {isOverride && (
          <Button
            variant="outline"
            className="w-full mt-6"
            onClick={clearOverride}
            disabled={switching !== null}
          >
            {switching === "clear" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Remove Override (Use Real Subscription)
          </Button>
        )}
      </div>
    </div>
  );
}
