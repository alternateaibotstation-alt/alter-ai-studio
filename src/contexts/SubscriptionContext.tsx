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
  hasApiKey: boolean;
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
  hasApiKey: false,
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
  const [hasApiKey, setHasApiKey] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setTier("free");
        setSubscribed(false);
        setUsage(defaultUsage);
        setHasApiKey(false);
        setLoading(false);
        return;
      }

      const { data: subData, error: subError } = await supabase.functions.invoke("check-subscription");

      if (subError) throw subError;

      setTier(subData.tier || "free");
      setSubscribed(subData.subscribed || false);
      setSubscriptionEnd(subData.subscription_end || null);
      setUsage(subData.usage || defaultUsage);
      setHasApiKey(false);
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

    const interval = setInterval(refresh, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  const canSendMessage = useCallback(() => {
    if (hasApiKey) return true;
    const limits = TIER_LIMITS[tier];
    if (limits.messages === Infinity) return true;
    const totalAllowed = limits.messages + usage.bonus_messages;
    return usage.messages_used_today < totalAllowed;
  }, [tier, usage, hasApiKey]);

  const canGenerateImage = useCallback(() => {
    if (hasApiKey) return true;
    const limits = TIER_LIMITS[tier];
    if (limits.images === Infinity) return true;
    return usage.images_used_today < limits.images;
  }, [tier, usage, hasApiKey]);

  const remainingMessages = useCallback(() => {
    if (hasApiKey) return Infinity;
    const limits = TIER_LIMITS[tier];
    if (limits.messages === Infinity) return Infinity;
    const totalAllowed = limits.messages + usage.bonus_messages;
    return Math.max(0, totalAllowed - usage.messages_used_today);
  }, [tier, usage, hasApiKey]);

  const remainingImages = useCallback(() => {
    if (hasApiKey) return Infinity;
    const limits = TIER_LIMITS[tier];
    if (limits.images === Infinity) return Infinity;
    return Math.max(0, limits.images - usage.images_used_today);
  }, [tier, usage, hasApiKey]);

  return (
    <SubscriptionContext.Provider value={{
      tier, subscribed, subscriptionEnd, usage, loading, hasApiKey,
      refresh, canSendMessage, canGenerateImage, remainingMessages, remainingImages,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
