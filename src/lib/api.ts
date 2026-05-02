import { supabase } from "@/integrations/supabase/client";

export interface Campaign {
  id: string;
  user_id: string;
  input: string;
  strategy: Record<string, unknown>;
  video_ads: Record<string, unknown>[];
  image_ads: Record<string, unknown>[];
  text_assets: Record<string, unknown>[];
  credits_used: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const api = {
  getUserCampaigns: async (): Promise<Campaign[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Campaign[];
  },

  getCampaignById: async (id: string): Promise<Campaign | null> => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as Campaign | null;
  },

  saveCampaign: async (campaign: Partial<Campaign>): Promise<Campaign> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        input: campaign.input ?? "",
        strategy: campaign.strategy ?? {},
        video_ads: campaign.video_ads ?? [],
        image_ads: campaign.image_ads ?? [],
        text_assets: campaign.text_assets ?? [],
        credits_used: campaign.credits_used ?? 0,
        status: campaign.status ?? "completed",
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Campaign;
  },

  deleteCampaign: async (id: string): Promise<void> => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) throw error;
  },
};
