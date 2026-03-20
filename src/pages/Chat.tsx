import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Loader2, Sparkles, Lock, DollarSign, Mic, MicOff, Volume2, VolumeX, Trash2 } from "lucide-react";
import { api, type Bot, type ChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useVoiceChat } from "@/hooks/use-voice-chat";
import BotReviews from "@/components/BotReviews";
import ChatSearchBar from "@/components/ChatSearchBar";
import ChatFileUpload, { type UploadedFile } from "@/components/ChatFileUpload";
import { toast } from "sonner";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PaywallModal from "@/components/PaywallModal";
import UsageBadge from "@/components/UsageBadge";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type Msg = { role: "user" | "assistant"; content: any };

async function sendChat({
  botId,
  messages,
  onDelta,
  onDone,
  onImageResponse,
}: {
  botId: string;
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onImageResponse: (text: string, imageUrl: string) => void;
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
    // Throw with special marker for limit errors
    const errMsg = err.error || `Error ${resp.status}`;
    throw new Error(errMsg);
  }

  const contentType = resp.headers.get("content-type") || "";

  // Image generation returns JSON (not streamed)
  if (contentType.includes("application/json")) {
    const json = await resp.json();
    if (json.type === "image") {
      const imageUrl = json.data?.choices?.[0]?.message?.images?.[0]?.image_url?.url || "";
      const text = json.data?.choices?.[0]?.message?.content || "Here's the generated image:";
      onImageResponse(text, imageUrl);
      return;
    }
    // Fallback - treat as error
    throw new Error(json.error || "Unexpected response");
  }

  // SSE streaming
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
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const lastSpokenRef = useRef<string>("");
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState<"messages" | "images" | "premium_bot">("messages");
  const { canSendMessage, refresh: refreshSub, tier } = useSubscription();

  const handleSearchHighlight = useCallback((msgId: string | null) => {
    setHighlightedMsgId(msgId);
    if (msgId) {
      setTimeout(() => {
        document.getElementById(`msg-${msgId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
    }
  }, []);

  const voice = useVoiceChat({
    onTranscript: (text) => setInput(text),
    autoSpeak: true,
  });

  useEffect(() => {
    if (!botId) return;
    api.getBotById(botId)
      .then(async (b) => {
        setBot(b);
        const isFree = !b?.price || b.price === 0;
        if (isFree) {
          setHasAccess(true);
        } else {
          const user = await api.getUser();
          if (!user) setHasAccess(false);
          else if (b && b.user_id === user.id) setHasAccess(true);
          else if (searchParams.get("purchased") === "true") setHasAccess(true);
          else {
            const purchased = await api.checkPurchase(botId);
            setHasAccess(purchased);
          }
        }
        try {
          const history = await api.getMessages(botId);
          if (history.length > 0) setMessages(history);
          else if (b?.suggested_prompts?.length) setInput(b.suggested_prompts[0]);
        } catch {
          if (b?.suggested_prompts?.length) setInput(b.suggested_prompts[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [botId, searchParams]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (!voice.ttsEnabled || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last?.role === "assistant" && last.id !== "streaming" && last.content && last.content !== lastSpokenRef.current) {
      lastSpokenRef.current = last.content;
      voice.speak(last.content);
    }
  }, [messages, voice]);

  const handleBuy = async () => {
    if (!botId) return;
    const user = await api.getUser();
    if (!user) { toast.error("Please sign in to purchase this bot"); return; }
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
    if ((!input.trim() && attachedFiles.length === 0) || !botId || sending) return;

    // Check premium bot limits (free users only)
    if (bot?.is_premium && tier === "free") {
      const userMsgCount = messages.filter((m) => m.role === "user").length;
      if (userMsgCount >= (bot.premium_free_messages || 2)) {
        setPaywallReason("premium_bot");
        setPaywallOpen(true);
        return;
      }
    }

    // Check general usage limits before sending
    if (!canSendMessage()) {
      setPaywallReason("messages");
      setPaywallOpen(true);
      return;
    }

    const userContent = input.trim();
    const files = [...attachedFiles];

    // Build display content for the message
    const displayParts: string[] = [];
    if (files.length > 0) {
      files.forEach((f) => {
        if (f.type.startsWith("image/")) {
          displayParts.push(`![${f.name}](${f.url})`);
        } else {
          displayParts.push(`📎 [${f.name}](${f.url})`);
        }
      });
    }
    if (userContent) displayParts.push(userContent);
    const displayContent = displayParts.join("\n");

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachedFiles([]);
    setSending(true);

    api.saveMessage(botId, "user", displayContent);

    // Build API message content (multimodal if files attached)
    let apiContent: any = userContent;
    if (files.length > 0) {
      const parts: any[] = [];
      if (userContent) parts.push({ type: "text", text: userContent });
      files.forEach((f) => {
        if (f.type.startsWith("image/")) {
          parts.push({ type: "image_url", image_url: { url: f.url } });
        } else {
          parts.push({ type: "text", text: `[Attached file: ${f.name}] URL: ${f.url}` });
        }
      });
      apiContent = parts;
    }

    const history: Msg[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: apiContent },
    ];

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === "streaming") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { id: "streaming", role: "assistant" as const, content: assistantSoFar, created_at: new Date().toISOString() }];
      });
    };

    try {
      await sendChat({
        botId,
        messages: history,
        onDelta: upsertAssistant,
        onImageResponse: (text, imageUrl) => {
          const content = imageUrl ? `${text}\n\n![Generated Image](${imageUrl})` : text;
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== "streaming"),
            { id: Date.now().toString(), role: "assistant", content, created_at: new Date().toISOString() },
          ]);
          setSending(false);
          api.saveMessage(botId, "assistant", content);
        },
        onDone: () => {
          setMessages((prev) => prev.map((m) => m.id === "streaming" ? { ...m, id: Date.now().toString() } : m));
          setSending(false);
          if (assistantSoFar) api.saveMessage(botId, "assistant", assistantSoFar);
        },
      });
    } catch (err: any) {
      const errMsg = err.message || "Failed to get AI response";
      // Handle limit errors by showing paywall
      if (errMsg === "LIMIT_MESSAGES") {
        setPaywallReason("messages");
        setPaywallOpen(true);
        // Remove the user message we just added
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== "streaming"));
      } else if (errMsg === "LIMIT_IMAGES") {
        setPaywallReason("images");
        setPaywallOpen(true);
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id && m.id !== "streaming"));
      } else {
        toast.error(errMsg);
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== "streaming"),
          { id: (Date.now() + 1).toString(), role: "assistant", content: "Sorry, an error occurred. Please try again.", created_at: new Date().toISOString() },
        ]);
      }
      setSending(false);
      refreshSub(); // Refresh usage counts
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
        {bot?.avatar_url ? (
          <img src={bot.avatar_url} alt={bot.name} className="w-8 h-8 rounded-lg object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-sm font-semibold text-foreground">{bot?.name || "Bot"}</h1>
          {bot?.category && <p className="text-xs text-muted-foreground capitalize">{bot.category}</p>}
        </div>
        {messages.length > 0 && <ChatSearchBar messages={messages} onHighlight={handleSearchHighlight} />}
        <UsageBadge />
        {isPaid && (
          <span className="text-xs font-medium text-accent flex items-center gap-1">
            <DollarSign className="w-3 h-3" />{bot.price}
          </span>
        )}
        {messages.length > 0 && (
          <Button variant="ghost" size="icon" onClick={async () => {
            if (!botId) return;
            await api.clearMessages(botId);
            setMessages([]);
            toast.success("Chat history cleared");
          }} title="Clear chat history">
            <Trash2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        )}
        {voice.supportsTTS && (
          <Button variant="ghost" size="icon" onClick={() => { voice.setTtsEnabled(!voice.ttsEnabled); if (voice.isSpeaking) voice.stopSpeaking(); }}
            className="relative" title={voice.ttsEnabled ? "Mute bot voice" : "Enable bot voice"}>
            {voice.ttsEnabled ? <Volume2 className="w-4 h-4 text-accent" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
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
            <p className="text-muted-foreground text-sm">{bot?.description || "This bot requires a one-time purchase to access."}</p>
            <div className="text-2xl font-bold text-foreground">${bot?.price?.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">One-time payment · Instant access</p>
            <Button onClick={handleBuy} disabled={checkingOut} className="w-full">
              {checkingOut ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : <>Buy Now · ${bot?.price?.toFixed(2)}</>}
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
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{bot?.description || "Start a conversation"}</p>
                  <p className="text-xs text-muted-foreground/60 mt-2">📎 You can attach files · 🎨 Ask to generate images</p>
                  {bot?.suggested_prompts && bot.suggested_prompts.length > 0 && (
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {bot.suggested_prompts.map((prompt) => (
                        <button key={prompt} onClick={() => {
                          setInput(prompt);
                          setTimeout(() => { document.querySelector<HTMLFormElement>('form')?.requestSubmit(); }, 0);
                        }}
                          className="text-xs px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} id={`msg-${msg.id}`} className={`flex animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm transition-colors ${highlightedMsgId === msg.id ? "ring-2 ring-primary" : ""} ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose dark:prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:bg-background prose-pre:border prose-pre:border-border prose-code:text-accent prose-headings:text-foreground prose-a:text-primary prose-img:rounded-lg prose-img:max-h-80">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert prose-sm max-w-none prose-img:rounded-lg prose-img:max-h-40 prose-p:my-0.5 whitespace-pre-wrap">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
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

          {botId && <BotReviews botId={botId} />}
          <div className="shrink-0 border-t border-border/50 p-4">
            <form onSubmit={handleSend} className="max-w-[800px] mx-auto">
              {attachedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2 px-2">
                  {attachedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-secondary border border-border">
                      {f.type.startsWith("image/") ? (
                        <img src={f.url} alt={f.name} className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <span className="text-muted-foreground">📎</span>
                      )}
                      <span className="max-w-[120px] truncate text-foreground">{f.name}</span>
                      <button type="button" onClick={() => setAttachedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive ml-1">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="glass-panel rounded-lg flex items-center gap-2 p-2">
                <ChatFileUpload
                  onFilesReady={setAttachedFiles}
                  files={attachedFiles}
                  onClear={() => setAttachedFiles([])}
                  disabled={sending}
                />
                {voice.supportsSTT && (
                  <Button type="button" variant="ghost" size="icon" onClick={voice.toggleListening}
                    className={voice.isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}
                    title={voice.isListening ? "Stop listening" : "Speak"}>
                    {voice.isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                )}
                <Input value={input} onChange={(e) => setInput(e.target.value)}
                  placeholder={voice.isListening ? "Listening..." : "Type a message..."}
                  className="border-0 bg-transparent focus-visible:ring-0 text-sm" disabled={sending} />
                <Button type="submit" size="icon" disabled={sending || (!input.trim() && attachedFiles.length === 0)}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </>
      )}
      <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} reason={paywallReason} />
    </div>
  );
}
