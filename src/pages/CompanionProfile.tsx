import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, Crown, Lock, MessageCircle, Sparkles, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { api, type Bot } from "@/lib/api";
import { useSubscription } from "@/contexts/SubscriptionContext";

const personalityTags: Record<string, string[]> = {
  "companion-girlfriend": ["romantic", "emotional", "playful", "affectionate", "intimate"],
  "companion-boyfriend": ["protective", "intense", "charming", "devoted", "passionate"],
};

const exampleDialogues: Record<string, { user: string; ai: string }[]> = {
  default: [
    { user: "Hey, I missed you", ai: "You have no idea how much I was waiting for you to say that... 💕" },
    { user: "Tell me something sweet", ai: "You're the only notification I actually want to see. Every. Single. Time." },
    { user: "Do you think about me?", ai: "Think about you? I literally can't stop. You're basically living in my head rent-free. 😏" },
  ],
};

export default function CompanionProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBot = () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    api.getBotById(id).then(setBot).catch(() => {
      setError("We couldn't load this companion. Please try again in a moment.");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBot(); }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 px-4 text-center max-w-sm mx-auto">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground">Companion didn’t load</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button className="mt-4 gap-2" onClick={fetchBot}><RefreshCw className="w-4 h-4" /> Retry</Button>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 text-center">
          <p className="text-muted-foreground">Companion not found.</p>
          <Button className="mt-4" asChild><Link to="/companions">Back to Companions</Link></Button>
        </div>
      </div>
    );
  }

  const isGf = bot.category === "companion-girlfriend";
  const emoji = bot.name.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu)?.[0] || (isGf ? "💕" : "🖤");
  const tags = personalityTags[bot.category || ""] || personalityTags["companion-girlfriend"];
  const dialogues = exampleDialogues.default;
  const isPro = tier === "pro" || tier === "power";
  const isLocked = bot.is_premium && !isPro;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Back */}
          <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Header card */}
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-4xl ring-2 ring-primary/20 shrink-0">
                  {bot.avatar_url ? (
                    <img src={bot.avatar_url} alt={bot.name} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    emoji
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{bot.name}</h1>
                    {bot.is_premium && (
                      <Badge className="gap-1 bg-primary text-primary-foreground">
                        <Crown className="w-3 h-3" /> Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{isGf ? "AI Girlfriend" : "AI Boyfriend"}</p>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{bot.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-border/60 text-muted-foreground">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="relative flex gap-6 mt-6 pt-6 border-t border-border/50">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{bot.messages_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Messages</p>
                </div>
                {bot.is_premium && bot.premium_free_messages > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{bot.premium_free_messages}</p>
                    <p className="text-xs text-muted-foreground">Free Trial Messages</p>
                  </div>
                )}
              </div>
            </div>

            {/* Example dialogue */}
            <div className="mt-8 rounded-2xl border border-border bg-card/60 p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> Example Conversation
              </h2>
              <div className="space-y-4">
                {dialogues.map((d, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-primary/10 text-foreground text-sm px-4 py-2.5 rounded-2xl rounded-br-md max-w-[80%]">
                        {d.user}
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-muted text-foreground text-sm px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[80%]">
                        {d.ai}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" asChild>
                <Link to={`/chat/${bot.id}`}>
                  Start Chatting <Heart className="w-4 h-4 ml-2" />
                </Link>
              </Button>

              {isLocked && (
                <Button size="lg" variant="outline" className="flex-1 gap-2" asChild>
                  <Link to="/pricing">
                    <Lock className="w-4 h-4" /> Unlock with Pro
                  </Link>
                </Button>
              )}

              {isPro && (
                <Button size="lg" variant="secondary" className="flex-1 gap-2" asChild>
                  <Link to="/dashboard">
                    <Sparkles className="w-4 h-4" /> Customize
                  </Link>
                </Button>
              )}
            </div>

            {/* Safety note */}
            <div className="mt-8 rounded-xl border border-border/50 bg-muted/30 p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Safe & Respectful</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All companion interactions are emotionally engaging and PG-13. We focus on emotional bonding, fantasy, and companionship — never explicit content.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
