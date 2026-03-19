import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, TrendingUp, Users, ArrowRight } from "lucide-react";
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

const steps = [
  { icon: Sparkles, title: "Create", desc: "Build AI bots with custom personas and instructions" },
  { icon: Users, title: "Share", desc: "Publish bots to the marketplace for others to use" },
  { icon: TrendingUp, title: "Monetize", desc: "Set a price and earn from every interaction" },
];

const pricing = [
  { name: "Free", price: "$0", features: ["3 bots", "Basic models", "Community support"] },
  { name: "Pro", price: "$19/mo", features: ["Unlimited bots", "GPT-4o access", "Analytics dashboard", "Priority support"], highlight: true },
  { name: "Enterprise", price: "Custom", features: ["Custom models", "API access", "Dedicated support", "SLA"] },
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
      <section className="hero-gradient pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <Zap className="w-3 h-3" /> AI-Powered Bot Platform
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Create, Use, and{" "}
            <span className="gradient-text">Monetize AI Bots</span>
          </motion.h1>
          <motion.p
            className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Build custom AI bots, share them on the marketplace, and earn revenue from every conversation.
          </motion.p>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button size="lg" asChild>
              <a href="/api/oauth/login">
                Start Creating <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/marketplace">Explore Bots</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                className="text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bots */}
      {featuredBots.length > 0 && (
        <section className="py-20 px-4 border-t border-border/50">
          <div className="container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Bots</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/marketplace" className="text-muted-foreground">
                  View all <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredBots.map((bot) => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section className="py-20 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-foreground mb-12">Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-lg border p-6 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <h3 className="font-semibold text-foreground">{plan.name}</h3>
                <p className="text-3xl font-bold text-foreground mt-2">{plan.price}</p>
                <ul className="mt-6 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="mt-6" variant={plan.highlight ? "default" : "secondary"}>
                  Get Started
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
            <a href="/api/oauth/login">Start Creating <ArrowRight className="w-4 h-4 ml-2" /></a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-4">
        <div className="container mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2026 Alter AI. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
