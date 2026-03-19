import { supabase } from "@/integrations/supabase/client";

export interface Bot {
  id: string;
  name: string;
  description: string | null;
  persona: string | null;
  category: string | null;
  model: string;
  is_public: boolean;
  price: number;
  status: string;
  messages_count: number;
  user_id: string;
  suggested_prompts: string[];
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
        is_public: bot.is_public ?? true,
        price: bot.price ?? 0,
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

  // ── Auth ──
  getUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
};
