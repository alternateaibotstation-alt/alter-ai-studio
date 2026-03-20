import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserTier } from "@/lib/tiers";
import { TIER_LIMITS } from "@/lib/tiers";

interface Usage {
  messages_used_today: number;
  images_used_today: number;
  bonus_messages: number;
}

interface SubscriptionState {
  tier: UserTier;
  subscribed: boolean;
  subscriptionEnd: string | null;
  usage: Usage;
  loading: boolean;
  refresh: () => Promise<void>;
  canSendMessage: () => boolean;
  canGenerateImage: () => boolean;
  remainingMessages: () => number;
  remainingImages: () => number;
}

const defaultUsage: Usage = { messages_used_today: 0, images_used_today: 0, bonus_messages: 0 };

const SubscriptionContext = createContext<SubscriptionState>({
  tier: "free",
  subscribed: false,
  subscriptionEnd: null,
  usage: defaultUsage,
  loading: true,
  refresh: async () => {},
  canSendMessage: () => true,
  canGenerateImage: () => true,
  remainingMessages: () => 15,
  remainingImages: () => 2,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<UserTier>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>(defaultUsage);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTier("free");
        setSubscribed(false);
        setUsage(defaultUsage);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      setTier(data.tier || "free");
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
      setUsage(data.usage || defaultUsage);
    } catch (e) {
      console.error("Failed to check subscription:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    // Refresh every 60 seconds
    const interval = setInterval(refresh, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  const canSendMessage = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    if (limits.messages === Infinity) return true;
    const totalAllowed = limits.messages + usage.bonus_messages;
    return usage.messages_used_today < totalAllowed;
  }, [tier, usage]);

  const canGenerateImage = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    if (limits.images === Infinity) return true;
    return usage.images_used_today < limits.images;
  }, [tier, usage]);

  const remainingMessages = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    if (limits.messages === Infinity) return Infinity;
    const totalAllowed = limits.messages + usage.bonus_messages;
    return Math.max(0, totalAllowed - usage.messages_used_today);
  }, [tier, usage]);

  const remainingImages = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    if (limits.images === Infinity) return Infinity;
    return Math.max(0, limits.images - usage.images_used_today);
  }, [tier, usage]);

  return (
    <SubscriptionContext.Provider value={{
      tier, subscribed, subscriptionEnd, usage, loading,
      refresh, canSendMessage, canGenerateImage, remainingMessages, remainingImages,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
