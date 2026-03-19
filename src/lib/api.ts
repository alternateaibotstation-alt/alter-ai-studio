const API_BASE = "/api/trpc";

async function trpcQuery<T>(path: string, input?: Record<string, unknown>): Promise<T> {
  const url = input
    ? `${API_BASE}/${path}?input=${encodeURIComponent(JSON.stringify(input))}`
    : `${API_BASE}/${path}?input={}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.result?.data as T;
}

async function trpcMutation<T>(path: string, input: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.result?.data as T;
}

export interface Bot {
  id: string;
  name: string;
  description: string | null;
  persona: string | null;
  category: string | null;
  model: string;
  isPublic: boolean;
  price: string;
  status: string;
  messagesCount: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export const api = {
  getPublicBots: () => trpcQuery<Bot[]>("bots.getPublic"),
  getBotById: (id: string) => trpcQuery<Bot>("bots.getById", { id }),
  getUserBots: () => trpcQuery<Bot[]>("bots.getUserBots"),
  createBot: (data: Partial<Bot>) => trpcMutation<Bot>("bots.create", data),
  updateBot: (data: Partial<Bot> & { id: string }) => trpcMutation<Bot>("bots.update", data),
  deleteBot: (id: string) => trpcMutation<void>("bots.delete", { id }),
  sendMessage: (botId: string, content: string) =>
    trpcMutation<{ response: string }>("bots.sendMessage", { botId, content }),
  getMe: () => trpcQuery<{ id: number; name: string; email: string } | null>("auth.me"),
  createCheckout: (botId: string) =>
    trpcMutation<{ url: string }>("payments.createCheckoutSession", { botId }),
};
