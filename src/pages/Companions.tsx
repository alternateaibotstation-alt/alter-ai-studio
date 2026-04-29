import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Sparkles, Lock, Crown, Search, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import { api, type Bot } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

type Category = "all" | "girlfriend" | "boyfriend";

const categoryLabels: Record<Category, string> = {
  all: "All Companions",
  girlfriend: "AI Girlfriends",
  boyfriend: "AI Boyfriends",
};

function CompanionCard({ bot, index }: { bot: Bot; index: number }) {
  const isGf = bot.category === "companion-girlfriend";
  const emoji = bot.name.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu)?.[0] || (isGf ? "💕" : "🖤");

  return (
    <motion.div
      className="group relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index}
    >
      {bot.is_premium && (
        <div className="absolute -top-2.5 right-4">
          <Badge className="gap-1 text-xs bg-primary text-primary-foreground shadow-md">
            <Crown className="w-3 h-3" /> Premium
          </Badge>
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
          {bot.avatar_url ? (
            <img src={bot.avatar_url} alt={bot.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            emoji
          )}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-lg">{bot.name}</h3>
          <p className="text-xs text-muted-foreground">{isGf ? "AI Girlfriend" : "AI Boyfriend"}</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{bot.description}</p>

      {/* Tags */}
      {bot.suggested_prompts && bot.suggested_prompts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {bot.suggested_prompts.slice(0, 2).map((prompt) => (
            <span
              key={prompt}
              className="text-[10px] px-2.5 py-1 rounded-full bg-muted/80 text-muted-foreground border border-border/50"
            >
              {prompt.length > 28 ? prompt.slice(0, 28) + "…" : prompt}
            </span>
          ))}
        </div>
      )}

      {/* Free messages */}
      {bot.is_premium && bot.premium_free_messages > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>{bot.premium_free_messages} free messages to try</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" className="flex-1" asChild>
          <Link to={`/companion/${bot.id}`}>
            View Profile
          </Link>
        </Button>
        <Button size="sm" className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
          <Link to={`/chat/${bot.id}`}>
            Chat <Heart className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

export default function Companions() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanions = () => {
    setLoading(true);
    setError(null);
    api.getPublicBots().then((all) => {
      setBots(all.filter((b) => b.category?.startsWith("companion")));
    }).catch(() => {
      setError("We couldn't load companions right now. Please check your connection and try again.");
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCompanions(); }, []);

  const filtered = bots.filter((b) => {
    if (category === "girlfriend" && b.category !== "companion-girlfriend") return false;
    if (category === "boyfriend" && b.category !== "companion-boyfriend") return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl text-center relative">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 gap-1">
              <Heart className="w-3 h-3" /> AI Companions
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight">
              Find Your Perfect <span className="gradient-text">AI Companion</span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
              Emotionally engaging AI personalities that remember you, connect with you, and make every conversation unforgettable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex gap-2">
              {(Object.keys(categoryLabels) as Category[]).map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={category === cat ? "default" : "outline"}
                  onClick={() => setCategory(cat)}
                  className="text-xs"
                >
                  {cat === "girlfriend" && "💕 "}
                  {cat === "boyfriend" && "🖤 "}
                  {categoryLabels[cat]}
                </Button>
              ))}
            </div>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search companions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="px-4 pb-20">
        <div className="container mx-auto max-w-5xl">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16 rounded-2xl border border-border bg-card/60">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">Companions didn’t load</p>
              <p className="text-muted-foreground text-sm mt-1">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchCompanions} className="mt-4 gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((bot, i) => (
                <CompanionCard key={bot.id} bot={bot} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No companions found. Try a different filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 border-t border-border/50">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl font-bold text-foreground">Want to create your own companion?</h2>
          <p className="mt-2 text-muted-foreground">Build a custom AI personality and share it with the world.</p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/dashboard">Create a Companion <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
