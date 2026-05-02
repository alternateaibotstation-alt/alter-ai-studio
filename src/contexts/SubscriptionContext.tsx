import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { UserTier } from "@/lib/tiers";
import { TIER_LIMITS } from "@/lib/tiers";

interface Usage {
  campaigns_used_today: number;
  images_used_today: number;
  videos_used_today: number;
}

interface SubscriptionState {
  tier: UserTier;
  subscribed: boolean;
  subscriptionEnd: string | null;
  usage: Usage;
  loading: boolean;
  refresh: () => Promise<void>;
  canGenerateCampaign: () => boolean;
  canGenerateImage: () => boolean;
  canGenerateVideo: () => boolean;
  remainingCampaigns: () => number;
  remainingImages: () => number;
  remainingVideos: () => number;
}

const defaultUsage: Usage = {
  campaigns_used_today: 0,
  images_used_today: 0,
  videos_used_today: 0,
};

const SubscriptionContext = createContext<SubscriptionState>({
  tier: "free",
  subscribed: false,
  subscriptionEnd: null,
  usage: defaultUsage,
  loading: true,
  refresh: async () => {},
  canGenerateCampaign: () => true,
  canGenerateImage: () => false,
  canGenerateVideo: () => false,
  remainingCampaigns: () => 3,
  remainingImages: () => 0,
  remainingVideos: () => 0,
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<UserTier>("free");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [usage, setUsage] = useState<Usage>(defaultUsage);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setTier("free");
        setSubscribed(false);
        setUsage(defaultUsage);
        setLoading(false);
        return;
      }

      const { data: subData, error: subError } =
        await supabase.functions.invoke("check-subscription");

      if (subError) throw subError;

      setTier(subData.tier || "free");
      setSubscribed(subData.subscribed || false);
      setSubscriptionEnd(subData.subscription_end || null);
      setUsage(subData.usage || defaultUsage);
    } catch (e) {
      console.error("Failed to check subscription:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });

    const interval = setInterval(refresh, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [refresh]);

  const canGenerateCampaign = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return usage.campaigns_used_today < limits.campaigns;
  }, [tier, usage]);

  const canGenerateImage = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return usage.images_used_today < limits.images;
  }, [tier, usage]);

  const canGenerateVideo = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return usage.videos_used_today < limits.videos;
  }, [tier, usage]);

  const remainingCampaigns = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return Math.max(0, limits.campaigns - usage.campaigns_used_today);
  }, [tier, usage]);

  const remainingImages = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return Math.max(0, limits.images - usage.images_used_today);
  }, [tier, usage]);

  const remainingVideos = useCallback(() => {
    const limits = TIER_LIMITS[tier];
    return Math.max(0, limits.videos - usage.videos_used_today);
  }, [tier, usage]);

  return (
    <SubscriptionContext.Provider
      value={{
        tier,
        subscribed,
        subscriptionEnd,
        usage,
        loading,
        refresh,
        canGenerateCampaign,
        canGenerateImage,
        canGenerateVideo,
        remainingCampaigns,
        remainingImages,
        remainingVideos,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
