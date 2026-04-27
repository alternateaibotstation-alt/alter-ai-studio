import { api, type Bot } from "@/lib/api";
import { runAIRequest } from "@modules/ai-engine";

export type BotDraft = Pick<Bot, "name" | "description" | "persona" | "category" | "model" | "suggested_prompts">;

export function createBotTemplate(draft: Partial<BotDraft>): Partial<Bot> {
  return {
    name: draft.name || "Untitled AI Bot",
    description: draft.description || "A focused assistant built for creator workflows.",
    persona: draft.persona || "Helpful, specific, brand-safe, and concise.",
    category: draft.category || "creator",
    model: draft.model || "google/gemini-3-flash-preview",
    suggested_prompts: draft.suggested_prompts || ["Create a TikTok hook for my offer"],
    is_public: true,
    price: 0,
  };
}

export function saveBotTemplate(draft: Partial<BotDraft>) {
  return api.createBot(createBotTemplate(draft));
}

export function executeBot(bot: Bot, prompt: string) {
  return runAIRequest({
    action: "bot_execution",
    model: bot.model,
    systemPrompt: bot.persona || undefined,
    prompt,
    metadata: { botId: bot.id, category: bot.category },
  });
}
