import { useEffect, useState, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, Sparkles, Lock, DollarSign, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { api, type Bot, type ChatMessage } from "@/lib/api";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Msg = { role: "user" | "assistant"; content: string };

async function streamChat({
  botId,
  messages,
  onDelta,
  onDone,
}: {
  botId: string;
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ botId, messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export default function Chat() {
  const { id: botId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");

  const voice = useVoiceChat({
    onTranscript: (text) => {
      setInput(text);
    },
    autoSpeak: true,
  });
  useEffect(() => {
    if (!botId) return;
    api.getBotById(botId)
      .then(async (b) => {
        setBot(b);
        // Check access for paid bots
        const isFree = !b?.price || b.price === 0;
        if (isFree) {
          setHasAccess(true);
        } else {
          const user = await api.getUser();
          if (!user) {
            setHasAccess(false);
          } else if (b && b.user_id === user.id) {
            setHasAccess(true);
          } else if (searchParams.get("purchased") === "true") {
            setHasAccess(true);
          } else {
            const purchased = await api.checkPurchase(botId);
            setHasAccess(purchased);
          }
        }
        // Load user's own chat history (RLS ensures isolation per user)
        try {
          const history = await api.getMessages(botId);
          if (history.length > 0) {
            setMessages(history);
          } else if (b?.suggested_prompts && b.suggested_prompts.length > 0) {
            setInput(b.suggested_prompts[0]);
          }
        } catch {
          if (b?.suggested_prompts && b.suggested_prompts.length > 0) {
            setInput(b.suggested_prompts[0]);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId, searchParams]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-speak new bot responses
  useEffect(() => {
    if (!voice.ttsEnabled || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (
      last?.role === "assistant" &&
      last.id !== "streaming" &&
      last.content &&
      last.content !== lastSpokenRef.current
    ) {
      lastSpokenRef.current = last.content;
      voice.speak(last.content);
    }
  }, [messages, voice]);

  const handleBuy = async () => {
    if (!botId) return;
    const user = await api.getUser();
    if (!user) {
      toast.error("Please sign in to purchase this bot");
      return;
    }
    setCheckingOut(true);
    try {
      const url = await api.createBotCheckout(botId);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error(err.message || "Checkout failed");
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !botId || sending) return;

    const userContent = input.trim();
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    api.saveMessage(botId, "user", userContent);

    const history: Msg[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent },
    ];

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [
          ...prev,
          { id: "streaming", role: "assistant" as const, content: assistantSoFar, created_at: new Date().toISOString() },
        ];
      });
    };

    try {
      await streamChat({
        botId,
        messages: history,
        onDelta: upsertAssistant,
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === "streaming" ? { ...m, id: Date.now().toString() } : m
            )
          );
          setSending(false);
          if (assistantSoFar) {
            api.saveMessage(botId, "assistant", assistantSoFar);
          }
        },
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to get AI response");
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== "streaming"),
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, an error occurred. Please try again.",
          created_at: new Date().toISOString(),
        },
      ]);
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isPaid = bot && bot.price && bot.price > 0;
  const showPaywall = isPaid && hasAccess === false;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="glass-panel border-b border-border/50 px-4 h-14 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/marketplace"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-foreground">{bot?.name || "Bot"}</h1>
          {bot?.category && (
            <p className="text-xs text-muted-foreground capitalize">{bot.category}</p>
          )}
        </div>
        {isPaid && (
          <span className="text-xs font-medium text-accent flex items-center gap-1">
            <DollarSign className="w-3 h-3" />{bot.price}
          </span>
        )}
        {voice.supportsTTS && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              voice.setTtsEnabled(!voice.ttsEnabled);
              if (voice.isSpeaking) voice.stopSpeaking();
            }}
            className="relative"
            title={voice.ttsEnabled ? "Mute bot voice" : "Enable bot voice"}
          >
            {voice.ttsEnabled ? (
              <Volume2 className="w-4 h-4 text-accent" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        )}
      </header>

      {showPaywall ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Premium Bot</h2>
            <p className="text-muted-foreground text-sm">
              {bot?.description || "This bot requires a one-time purchase to access."}
            </p>
            <div className="text-2xl font-bold text-foreground">${bot?.price?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">One-time payment · Instant access</p>
            <Button onClick={handleBuy} disabled={checkingOut} className="w-full">
              {checkingOut ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
              ) : (
                <>Buy Now · ${bot?.price?.toFixed(2)}</>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[800px] mx-auto px-4 py-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-20">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{bot?.name}</h2>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    {bot?.description || "Start a conversation"}
                  </p>
                  {bot?.suggested_prompts && bot.suggested_prompts.length > 0 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {bot.suggested_prompts.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => setInput(prompt)}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {sending && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start animate-fade-in">
                  <div className="bg-card border border-border rounded-lg px-4 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          <div className="shrink-0 border-t border-border/50 p-4">
            <form onSubmit={handleSend} className="max-w-[800px] mx-auto">
              <div className="glass-panel rounded-lg flex items-center gap-2 p-2">
                {voice.supportsSTT && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={voice.toggleListening}
                    className={voice.isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}
                    title={voice.isListening ? "Stop listening" : "Speak"}
                  >
                    {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={voice.isListening ? "Listening..." : "Type a message..."}
                  className="border-0 bg-transparent focus-visible:ring-0 text-sm"
                  disabled={sending}
                />
                <Button type="submit" size="icon" disabled={sending || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
