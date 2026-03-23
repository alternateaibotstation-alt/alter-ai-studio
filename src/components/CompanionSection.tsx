import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Sparkles, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, type Bot } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function CompanionSection() {
  const [companions, setCompanions] = useState<Bot[]>([]);

  useEffect(() => {
    api.getPublicBots().then((bots) => {
      if (Array.isArray(bots)) {
        setCompanions(bots.filter((b) => b.category?.startsWith("companion")).slice(0, 6));
      }
    }).catch(() => {});
  }, []);

  if (companions.length === 0) return null;

  const girlfriends = companions.filter((b) => b.category === "companion-girlfriend").slice(0, 3);
  const boyfriends = companions.filter((b) => b.category === "companion-boyfriend").slice(0, 3);

  return (
    <section className="py-20 px-4 border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      <div className="container mx-auto max-w-5xl relative">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 gap-1">
            <Heart className="w-3 h-3" /> AI Companions
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Meet Your AI <span className="gradient-text">Boyfriend & Girlfriend</span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Emotionally engaging AI companions that remember you, connect with you, and make every conversation feel special.
          </p>
        </div>

        {/* Girlfriends row */}
        {girlfriends.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              💕 AI Girlfriends
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {girlfriends.map((bot, i) => (
                <CompanionMiniCard key={bot.id} bot={bot} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Boyfriends row */}
        {boyfriends.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              🖤 AI Boyfriends
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boyfriends.map((bot, i) => (
                <CompanionMiniCard key={bot.id} bot={bot} index={i + 3} />
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <Button variant="outline" asChild>
            <Link to="/companions">
              Explore All Companions <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function CompanionMiniCard({ bot, index }: { bot: Bot; index: number }) {
  const isGf = bot.category === "companion-girlfriend";
  const emoji = bot.name.match(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu)?.[0] || (isGf ? "💕" : "🖤");

  return (
    <motion.div
      className="group relative rounded-xl border border-border bg-card p-5 flex flex-col gap-3 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      custom={index}
    >
      {bot.is_premium && (
        <div className="absolute -top-2.5 right-4">
          <Badge className="gap-1 text-xs bg-primary text-primary-foreground">
            <Crown className="w-3 h-3" /> Premium
          </Badge>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xl">
          {bot.avatar_url ? (
            <img src={bot.avatar_url} alt={bot.name} className="w-full h-full rounded-full object-cover" />
          ) : emoji}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">{bot.name}</h3>
          <p className="text-[10px] text-muted-foreground">{isGf ? "AI Girlfriend" : "AI Boyfriend"}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex-1 line-clamp-2">{bot.description}</p>

      {bot.is_premium && bot.premium_free_messages > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="w-3 h-3" />
          <span>{bot.premium_free_messages} free messages</span>
        </div>
      )}

      <Button size="sm" className="w-full text-xs" variant="secondary" asChild>
        <Link to={`/companion/${bot.id}`}>
          View Profile <Heart className="w-3 h-3 ml-1" />
        </Link>
      </Button>
    </motion.div>
  );
}
