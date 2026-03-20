import { supabase } from "@/integrations/supabase/client";

export interface Bot {
  id: string;
  name: string;
  description: string | null;
  persona: string | null;
  category: string | null;
  model: string;
  is_public: boolean;
  is_premium: boolean;
  premium_free_messages: number;
  price: number;
  status: string;
  messages_count: number;
  user_id: string;
  suggested_prompts: string[];
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export const api = {
  // ── Bots ──
  getPublicBots: async (): Promise<Bot[]> => {
    const { data, error } = await supabase
      .from("bots")
      .select("*")
      .eq("is_public", true)
      .eq("status", "active")
      .order("messages_count", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Bot[];
  },

  getBotById: async (id: string): Promise<Bot | null> => {
    const { data, error } = await supabase
      .from("bots")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as Bot | null;
  },

  getUserBots: async (): Promise<Bot[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("bots")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Bot[];
  },

  createBot: async (bot: Partial<Bot>): Promise<Bot> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("bots")
      .insert({
        user_id: user.id,
        name: bot.name!,
        description: bot.description ?? null,
        persona: bot.persona ?? null,
        category: bot.category ?? "general",
        model: bot.model ?? "google/gemini-3-flash-preview",
        is_public: bot.is_public ?? true,
        price: bot.price ?? 0,
        avatar_url: bot.avatar_url ?? null,
        suggested_prompts: bot.suggested_prompts ?? [],
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Bot;
  },

  updateBot: async (bot: Partial<Bot> & { id: string }): Promise<Bot> => {
    const { id, ...updates } = bot;
    const { data, error } = await supabase
      .from("bots")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Bot;
  },

  deleteBot: async (id: string): Promise<void> => {
    const { error } = await supabase.from("bots").delete().eq("id", id);
    if (error) throw error;
  },

  // ── Messages ──
  getMessages: async (botId: string): Promise<ChatMessage[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("bot_id", botId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []) as unknown as ChatMessage[];
  },

  saveMessage: async (botId: string, role: "user" | "assistant", content: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // silently skip for unauthenticated
    await supabase.from("messages").insert({
      bot_id: botId,
      user_id: user.id,
      role,
      content,
    });
  },

  clearMessages: async (botId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("messages").delete().eq("bot_id", botId).eq("user_id", user.id);
  },

  // ── Purchases ──
  checkPurchase: async (botId: string): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke("check-bot-purchase", {
      body: { botId },
    });
    if (error) return false;
    return data?.purchased === true;
  },

  createBotCheckout: async (botId: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke("create-bot-checkout", {
      body: { botId },
    });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data.url;
  },

  // ── Favorites ──
  getFavorites: async (): Promise<string[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("favorites")
      .select("bot_id")
      .eq("user_id", user.id);
    if (error) return [];
    return (data ?? []).map((f) => f.bot_id);
  },

  getFavoriteBots: async (): Promise<Bot[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: favs } = await supabase
      .from("favorites")
      .select("bot_id")
      .eq("user_id", user.id);
    if (!favs?.length) return [];
    const ids = favs.map((f) => f.bot_id);
    const { data, error } = await supabase
      .from("bots")
      .select("*")
      .in("id", ids);
    if (error) return [];
    return (data ?? []) as unknown as Bot[];
  },

  toggleFavorite: async (botId: string): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("bot_id", botId)
      .maybeSingle();
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, bot_id: botId });
      return true;
    }
  },

  // ── Auth ──
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
