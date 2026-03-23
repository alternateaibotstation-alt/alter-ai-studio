import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowRight, Sparkles, Lock } from "lucide-react";
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
        setCompanions(bots.filter((b) => b.category === "companion").slice(0, 3));
      }
    }).catch(() => {});
  }, []);

  if (companions.length === 0) return null;

  return (
    <section className="py-20 px-4 border-t border-border/50 relative overflow-hidden">
      {/* Subtle gradient background */}
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
            Emotionally engaging AI companions that remember you, flirt with you, and make every conversation feel special.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companions.map((bot, i) => (
            <motion.div
              key={bot.id}
              className="group relative rounded-xl border border-border bg-card p-6 flex flex-col gap-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i}
            >
              {/* Premium badge */}
              {bot.is_premium && (
                <div className="absolute -top-2.5 right-4">
                  <Badge className="gap-1 text-xs bg-primary text-primary-foreground">
                    <Sparkles className="w-3 h-3" /> Premium
                  </Badge>
                </div>
              )}

              {/* Avatar & name */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                  {bot.name.includes("💕") ? "💕" : bot.name.includes("🖤") ? "🖤" : "✨"}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{bot.name}</h3>
                  <p className="text-xs text-muted-foreground">AI Companion</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground flex-1">
                {bot.description}
              </p>

              {/* Sample prompts */}
              {bot.suggested_prompts && bot.suggested_prompts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bot.suggested_prompts.slice(0, 2).map((prompt) => (
                    <span
                      key={prompt}
                      className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {prompt.length > 30 ? prompt.slice(0, 30) + "…" : prompt}
                    </span>
                  ))}
                </div>
              )}

              {/* Free messages hint */}
              {bot.is_premium && bot.premium_free_messages > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>{bot.premium_free_messages} free messages to try</span>
                </div>
              )}

              {/* CTA */}
              <Button size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" variant="secondary" asChild>
                <Link to={`/chat/${bot.id}`}>
                  Start Chatting <Heart className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline" size="sm" asChild>
            <Link to="/marketplace">
              Explore All Companions <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
