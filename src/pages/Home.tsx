import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, TrendingUp, ArrowRight, Users, BarChart3, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import BotCard from "@/components/BotCard";
import { api, type Bot } from "@/lib/api";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const stats = [
  { value: "1000+", label: "Bots Created" },
  { value: "50K+", label: "Active Users" },
  { value: "$2M+", label: "Paid Out" },
];

const steps = [
  { icon: Sparkles, title: "Create Your Bot", desc: "Give your AI bot a name, personality, and custom instructions." },
  { icon: Zap, title: "Publish to Marketplace", desc: "Make your bot public or keep it private. Set pricing and category." },
  { icon: TrendingUp, title: "Earn Passive Income", desc: "Get paid every time someone uses your bot." },
];

const earnCards = [
  {
    icon: Users,
    title: "Free Bots",
    desc: "Build an audience and collect usage data. Upgrade to paid later.",
    features: ["Unlimited usage", "Analytics included", "Upgrade anytime"],
  },
  {
    icon: BarChart3,
    title: "Paid Bots",
    desc: "Charge per use or set a subscription model. We handle payments.",
    features: ["Custom pricing", "Revenue tracking", "Instant payouts"],
  },
  {
    icon: Zap,
    title: "Revenue Share",
    desc: "Keep 80% of revenue. We take 20% to cover infrastructure.",
    features: ["Transparent pricing", "No hidden fees", "Weekly payouts"],
  },
];

const pricing = [
  {
    name: "Free",
    subtitle: "Perfect to start",
    price: "$0",
    features: ["15 messages/day", "2 image generations/day", "Basic AI models"],
  },
  {
    name: "Pro",
    subtitle: "For creators & businesses",
    price: "$9",
    features: ["Unlimited messages", "20 image generations/day", "Higher-quality AI models", "Faster responses"],
    highlight: true,
  },
  {
    name: "Power",
    subtitle: "For power users",
    price: "$29",
    features: ["Unlimited messages", "Unlimited image generation", "Priority processing", "Access to best AI models"],
  },
];

export default function Home() {
  const [featuredBots, setFeaturedBots] = useState<Bot[]>([]);

  useEffect(() => {
    api.getPublicBots().then((bots) => {
      if (Array.isArray(bots)) setFeaturedBots(bots.slice(0, 6));
    }).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="hero-gradient pt-32 pb-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            Create, Use, and{" "}
            <span className="gradient-text">Monetize AI Bots</span>
          </motion.h1>
          <motion.p
            className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Turn ideas into income with AI-powered personalities. Build once, earn forever.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <Button size="lg" asChild>
              <Link to="/auth">
                Start Creating <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/marketplace">Explore Bots</Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center rounded-lg border border-border bg-card/50 px-8 py-4 min-w-[140px]"
              >
                <span className="text-xl font-bold gradient-text">{s.value}</span>
                <span className="text-xs text-muted-foreground mt-1">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                className="relative rounded-lg border border-border bg-card p-6"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  {s.title}
                  {i < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground hidden md:inline" />
                  )}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bots */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Bots</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace">
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>
          {featuredBots.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No bots available yet. Be the first to create one!
            </p>
          )}
        </div>
      </section>

      {/* Earn from Your Bots */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
            Earn from Your Bots
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {earnCards.map((card, i) => (
              <motion.div
                key={card.title}
                className="rounded-lg border border-border bg-card p-6 flex flex-col"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{card.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{card.desc}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {card.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-lg border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 right-4 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                <p className="text-3xl font-bold text-foreground mt-4">
                  {plan.price}
                  {plan.price !== "Custom" && <span className="text-sm font-normal text-muted-foreground">/month</span>}
                </p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" variant={plan.highlight ? "default" : "secondary"} asChild>
                  <Link to="/pricing">
                    {plan.highlight ? "Start Free Trial" : "Get Started"}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto text-center max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Ready to build your AI bot?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join thousands of creators monetizing AI on Alter AI.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/auth">Start Creating <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Alter AI. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
