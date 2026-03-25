import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Bot, Mic, Video, BarChart3, Layers, Clock, DollarSign,
  Globe, Settings, Shield, Sparkles, ChevronRight, Zap, Check, Star,
  MessageSquare, Image, TrendingUp
} from "lucide-react";
import Navbar from "@/components/Navbar";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const features = [
  {
    icon: Bot,
    title: "AI Bots",
    subtitle: "Build once, deploy everywhere",
    desc: "Create custom AI personalities with unique voices, knowledge, and behaviors. Publish to the marketplace or keep private.",
    accent: "from-primary to-pink-400",
    stats: ["Custom personas", "Smart context", "Marketplace ready"],
  },
  {
    icon: Video,
    title: "Content Studio",
    subtitle: "Multi-platform content engine",
    desc: "Generate optimized content for TikTok, Instagram, LinkedIn, Twitter, Facebook, and Pinterest — all from a single prompt.",
    accent: "from-accent to-cyan-300",
    stats: ["6 platforms", "AI voiceover", "Video compiler"],
  },
  {
    icon: BarChart3,
    title: "Analytics & Monetization",
    subtitle: "Track everything, earn passively",
    desc: "See exactly how your bots perform. Set pricing, track revenue, and understand user engagement in real time.",
    accent: "from-violet-500 to-purple-400",
    stats: ["Usage analytics", "Revenue tracking", "Flexible pricing"],
  },
  {
    icon: Layers,
    title: "Template Library",
    subtitle: "Instant content creation",
    desc: "Save your best content as reusable templates. Load, customize, and generate new variations in seconds.",
    accent: "from-amber-500 to-orange-400",
    stats: ["Save & reuse", "Quick load", "Platform presets"],
  },
];

const benefits = [
  { icon: Clock, title: "Save hours every day", desc: "Generate multi-platform content in seconds, not hours. One prompt powers six platforms." },
  { icon: DollarSign, title: "New revenue streams", desc: "Monetize your AI bots with flexible pricing. Free, paid, or subscription — you choose." },
  { icon: Globe, title: "Multi-platform reach", desc: "TikTok, Instagram, LinkedIn, Twitter, Facebook, Pinterest. All optimized automatically." },
  { icon: Settings, title: "Total flexibility", desc: "Use AlterAI credits or bring your own API keys. Scale on your terms." },
];

const testimonials = [
  { quote: "AlterAI completely changed how I create content. What used to take me all day now takes 5 minutes.", name: "Content Creator", role: "TikTok · 50K followers" },
  { quote: "The multi-platform generation is a game changer. I post to 6 platforms from one prompt.", name: "Digital Marketer", role: "Agency Owner" },
  { quote: "I built a bot, published it, and started earning within the first week. The analytics are incredibly clear.", name: "Bot Creator", role: "AI Entrepreneur" },
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.97]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute top-40 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px]" />
        </div>

        <motion.div
          className="container mx-auto text-center max-w-4xl relative z-10"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Pill badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm text-primary mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">AI-Powered Content & Bot Platform</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Your ideas deserve
            <br />
            <span className="gradient-text">more than one platform</span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Build AI bots, generate viral content for every platform, and create
            voice-powered videos — all from a single workspace.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button size="lg" className="h-13 px-8 text-base shadow-lg shadow-primary/20" asChild>
              <Link to="/auth">
                Start building your AI now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base" asChild>
              <Link to="/marketplace">
                Explore marketplace
              </Link>
            </Button>
          </motion.div>

          <motion.p
            className="mt-4 text-sm text-muted-foreground"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            No coding required · Start for free · Cancel anytime
          </motion.p>

          {/* Hero visual — abstract grid */}
          <motion.div
            className="mt-16 relative"
            initial="hidden" animate="visible" variants={scaleIn} custom={5}
          >
            <div className="relative rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-1 shadow-2xl shadow-primary/5">
              <div className="rounded-xl bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { icon: Bot, label: "AI Bots", color: "text-primary" },
                    { icon: Video, label: "Content", color: "text-accent" },
                    { icon: Mic, label: "Voice", color: "text-violet-400" },
                    { icon: Image, label: "Images", color: "text-amber-400" },
                    { icon: MessageSquare, label: "Chat", color: "text-pink-400" },
                    { icon: TrendingUp, label: "Analytics", color: "text-emerald-400" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      className="flex flex-col items-center gap-2 p-4 sm:p-6 rounded-xl bg-background/50 border border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-default"
                      whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    >
                      <item.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${item.color}`} />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-primary/20 blur-sm" />
            <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-accent/20 blur-sm" />
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-primary">Platform</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">
              Everything you need to create, publish, and earn
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              From AI bots to multi-platform content — one workspace, infinite possibilities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative rounded-2xl border border-border bg-card p-7 hover:border-primary/25 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -3 }}
              >
                {/* Accent bar */}
                <div className={`absolute top-0 left-7 right-7 h-[2px] rounded-b-full bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-lg`}>
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-primary font-medium">{f.subtitle}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {f.stats.map(s => (
                        <span key={s} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                          <Check className="w-3 h-3 text-accent" /> {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Arrow cue */}
                <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BENEFITS ═══════════════════════ */}
      <section className="py-24 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <span className="text-xs font-semibold tracking-widest uppercase text-accent">Why AlterAI</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-foreground">
              Built for creators who think bigger
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                className="text-center p-6 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">{b.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SOCIAL PROOF ═══════════════════════ */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.02] to-transparent pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            className="text-center mb-12"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 mb-6">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Trusted by creators worldwide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Real creators, real results
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 flex flex-col"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-5 pt-4 border-t border-border/50">
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/5 p-12 sm:p-16 text-center overflow-hidden"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0}
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <Zap className="w-10 h-10 text-primary mx-auto mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Create your first AI bot today
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                Join a growing community of creators building AI-powered bots and content.
                No coding required, no credit card needed.
              </p>
              <Button size="lg" className="mt-8 h-14 px-10 text-base shadow-xl shadow-primary/20" asChild>
                <Link to="/auth">
                  Start building your AI now <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Free plan available · No coding required · Set up in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-border/30 py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="sm:col-span-2">
              <h3 className="font-bold text-foreground text-lg">Alter AI</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
                The all-in-one platform for AI bots, multi-platform content, and creative monetization.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-accent" />
                <span className="text-xs text-muted-foreground">Secure · Verified · Privacy-first</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product</h4>
              <ul className="space-y-2">
                {[
                  { label: "Pricing", to: "/pricing" },
                  { label: "Marketplace", to: "/marketplace" },
                  { label: "Content Studio", to: "/content-studio" },
                  { label: "Dashboard", to: "/dashboard" },
                ].map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Legal</h4>
              <ul className="space-y-2">
                {[
                  { label: "Privacy Policy", to: "/privacy" },
                  { label: "Terms of Service", to: "/terms" },
                ].map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">© 2026 Alter AI. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">Built for creators, by creators.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
