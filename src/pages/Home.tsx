import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Bot, Mic, Video, BarChart3, Layers, Clock, DollarSign,
  Globe, Settings, Shield, Sparkles, ChevronRight, Zap, Check, Star,
  MessageSquare, Image, TrendingUp, Play, BookTemplate, ArrowDown
} from "lucide-react";
import Navbar from "@/components/Navbar";
import bgLogo from "@/assets/bg-logo.png";

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1, scale: 1,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

/* ─── Data ─── */
const features = [
  {
    icon: Bot,
    title: "AI Bots",
    subtitle: "Build once, deploy everywhere",
    desc: "Create custom AI personalities with unique voices, knowledge, and behaviors. Publish to the marketplace or keep them private for your audience.",
    accent: "from-[hsl(260,80%,60%)] to-[hsl(280,70%,50%)]",
    glow: "hsl(270 80% 55% / 0.15)",
    stats: ["Custom personas", "Smart context", "Marketplace ready"],
    link: "/marketplace",
  },
  {
    icon: Video,
    title: "Voice & Video Studio",
    subtitle: "Generate multi-platform content instantly",
    desc: "One prompt generates optimized content for TikTok, Instagram, LinkedIn, Twitter, Facebook, and Pinterest — with AI voiceovers and video compilation.",
    accent: "from-[hsl(200,90%,50%)] to-[hsl(220,80%,60%)]",
    glow: "hsl(210 90% 55% / 0.15)",
    stats: ["6 platforms", "AI voiceover", "Video compiler"],
    link: "/content-studio",
  },
  {
    icon: BarChart3,
    title: "Analytics & Profit",
    subtitle: "Track usage, control costs",
    desc: "See exactly how your bots perform. Set pricing, track revenue, and understand user engagement — all in a clean dashboard.",
    accent: "from-[hsl(170,80%,45%)] to-[hsl(190,70%,50%)]",
    glow: "hsl(180 80% 45% / 0.15)",
    stats: ["Usage analytics", "Revenue tracking", "Flexible pricing"],
    link: "/dashboard",
  },
  {
    icon: BookTemplate,
    title: "Template Library",
    subtitle: "Instant content creation",
    desc: "Save your best content as reusable templates. Browse the community marketplace, load templates, and generate new variations instantly.",
    accent: "from-[hsl(40,90%,55%)] to-[hsl(25,85%,50%)]",
    glow: "hsl(35 90% 55% / 0.15)",
    stats: ["Save & reuse", "Community marketplace", "Platform presets"],
    link: "/template-marketplace",
  },
];

const benefits = [
  { icon: Clock, title: "Save hours every day", desc: "Generate multi-platform content in seconds, not hours. One prompt powers six platforms simultaneously." },
  { icon: DollarSign, title: "New revenue streams", desc: "Monetize your AI bots with flexible pricing. Free, paid, or subscription — you decide how to earn." },
  { icon: Globe, title: "Multi-platform reach", desc: "TikTok, Instagram, LinkedIn, Twitter, Facebook, Pinterest. Every post optimized for its platform." },
  { icon: Settings, title: "Total flexibility", desc: "Use AlterAI credits to get started instantly, or bring your own API keys. Scale on your own terms." },
];

const testimonials = [
  { quote: "AlterAI completely changed how I create content. What used to take me all day now takes 5 minutes.", name: "Content Creator", role: "TikTok · 50K followers" },
  { quote: "The multi-platform generation is a game changer. I post to 6 platforms from one prompt.", name: "Digital Marketer", role: "Agency Owner" },
  { quote: "I built a bot, published it, and started earning within the first week. The analytics are incredibly clear.", name: "Bot Creator", role: "AI Entrepreneur" },
];

const heroCapabilities = [
  { icon: Bot, label: "AI Bots", color: "text-[hsl(270,80%,65%)]", bg: "bg-[hsl(270,80%,65%/0.1)]" },
  { icon: Video, label: "Content", color: "text-[hsl(210,90%,60%)]", bg: "bg-[hsl(210,90%,60%/0.1)]" },
  { icon: Mic, label: "Voice", color: "text-[hsl(250,70%,65%)]", bg: "bg-[hsl(250,70%,65%/0.1)]" },
  { icon: Image, label: "Images", color: "text-[hsl(40,90%,60%)]", bg: "bg-[hsl(40,90%,60%/0.1)]" },
  { icon: MessageSquare, label: "Chat", color: "text-[hsl(330,80%,60%)]", bg: "bg-[hsl(330,80%,60%/0.1)]" },
  { icon: TrendingUp, label: "Analytics", color: "text-[hsl(160,70%,50%)]", bg: "bg-[hsl(160,70%,50%/0.1)]" },
];

/* ─── Floating Particle (decorative) ─── */
function FloatingOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.12], [1, 0.97]);
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative pt-28 pb-24 px-4 overflow-hidden">
        {/* Ambient neon glows */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[hsl(260,80%,55%/0.06)] blur-[140px]" />
          <div className="absolute top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(210,90%,55%/0.05)] blur-[120px]" />
          <div className="absolute top-60 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(330,85%,50%/0.04)] blur-[100px]" />
        </div>

        {/* Floating decorative orbs */}
        <FloatingOrb className="top-32 left-[15%] w-2 h-2 bg-[hsl(260,80%,60%/0.4)]" />
        <FloatingOrb className="top-48 right-[20%] w-1.5 h-1.5 bg-[hsl(210,90%,60%/0.4)]" />
        <FloatingOrb className="bottom-32 left-[30%] w-1 h-1 bg-[hsl(330,85%,55%/0.5)]" />

        <motion.div
          className="container mx-auto text-center max-w-4xl relative z-10"
          style={{ opacity: heroOpacity, scale: heroScale }}
        >
          {/* Pill badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[hsl(260,60%,55%/0.3)] bg-[hsl(260,60%,55%/0.08)] text-sm text-[hsl(260,80%,70%)] mb-7"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium">AI-Powered Creation Platform</span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.06]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Build AI that works
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(260,80%,65%)] via-[hsl(210,90%,60%)] to-[hsl(260,80%,65%)]">
              across every platform
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Create AI bots, generate viral content for six platforms, and produce
            voice-powered videos — all from a single workspace.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
          >
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] hover:from-[hsl(260,80%,60%)] hover:to-[hsl(210,85%,60%)] text-white shadow-lg shadow-[hsl(260,80%,55%/0.25)] border-0"
              asChild
            >
              <Link to="/auth">
                Start building your AI now <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/60 hover:border-[hsl(260,60%,55%/0.4)] hover:bg-[hsl(260,60%,55%/0.05)]" asChild>
              <Link to="/marketplace">
                <Play className="w-4 h-4 mr-2" /> Explore marketplace
              </Link>
            </Button>
          </motion.div>

          <motion.p
            className="mt-4 text-sm text-muted-foreground/70"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            No coding required · Start for free · Cancel anytime
          </motion.p>

          {/* Hero capability grid */}
          <motion.div
            className="mt-16 relative"
            initial="hidden" animate="visible" variants={scaleIn} custom={5}
          >
            <div className="relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md p-1 shadow-2xl shadow-[hsl(260,80%,55%/0.08)]">
              <div className="rounded-xl bg-gradient-to-br from-card via-card to-[hsl(260,60%,55%/0.05)] p-6 sm:p-10">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                  {heroCapabilities.map((item, i) => (
                    <motion.div
                      key={item.label}
                      className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl ${item.bg} border border-border/30 hover:border-[hsl(260,60%,55%/0.3)] transition-all duration-300 cursor-default`}
                      whileHover={{ y: -6, scale: 1.04, transition: { duration: 0.2 } }}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.08, duration: 0.4 }}
                    >
                      <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color}`} />
                      <span className="text-xs sm:text-sm font-medium text-muted-foreground">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            {/* Corner accents */}
            <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[hsl(260,80%,55%/0.3)] blur-[6px]" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-full bg-[hsl(210,90%,55%/0.3)] blur-[4px]" />
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            className="mt-10 flex justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowDown className="w-5 h-5 text-muted-foreground/30" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section className="py-28 px-4 relative" ref={featuresRef}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-[hsl(260,70%,55%/0.03)] blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            className="text-center mb-20"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[hsl(260,80%,65%)] mb-3">
              <Layers className="w-3 h-3" /> Platform
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
              Everything you need to create,
              <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(260,80%,65%)] to-[hsl(210,90%,60%)]">
                publish, and earn
              </span>
            </h2>
            <p className="mt-5 text-muted-foreground max-w-xl mx-auto text-base">
              From AI bots to multi-platform content — one workspace, infinite possibilities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <Link key={f.title} to={f.link} className="block">
                <motion.div
                  className="group relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-8 hover:border-[hsl(260,60%,55%/0.3)] transition-all duration-300 overflow-hidden h-full"
                  initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                  whileHover={{ y: -4 }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(400px circle at 50% 0%, ${f.glow}, transparent)` }}
                  />

                  {/* Top accent line */}
                  <div className={`absolute top-0 left-8 right-8 h-[2px] rounded-b-full bg-gradient-to-r ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative flex items-start gap-5">
                    <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center shadow-lg`}>
                      <f.icon className="w-5.5 h-5.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
                      <p className="text-sm font-medium text-[hsl(260,70%,65%)]">{f.subtitle}</p>
                      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {f.stats.map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border/30">
                            <Check className="w-3 h-3 text-[hsl(210,90%,60%)]" /> {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Arrow cue */}
                  <ChevronRight className="absolute bottom-7 right-7 w-4 h-4 text-muted-foreground/20 group-hover:text-[hsl(260,80%,65%)] group-hover:translate-x-1 transition-all duration-300" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ BENEFITS ═══════════════════════ */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 border-t border-b border-border/20 pointer-events-none" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-[hsl(210,90%,60%)] mb-3">
              <Zap className="w-3 h-3" /> Why AlterAI
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Built for creators who think bigger
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Stop juggling tools. One platform handles everything from creation to monetization.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                className="group text-center p-7 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm hover:bg-card/80 hover:border-[hsl(260,60%,55%/0.25)] transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -6 }}
              >
                <div className="w-13 h-13 rounded-xl bg-gradient-to-br from-[hsl(260,70%,55%/0.15)] to-[hsl(210,80%,55%/0.1)] flex items-center justify-center mx-auto mb-5 group-hover:shadow-lg group-hover:shadow-[hsl(260,70%,55%/0.1)] transition-shadow duration-300">
                  <b.icon className="w-5.5 h-5.5 text-[hsl(260,80%,65%)]" />
                </div>
                <h3 className="font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ SOCIAL PROOF ═══════════════════════ */}
      <section className="py-28 px-4 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/4 w-[500px] h-[300px] rounded-full bg-[hsl(210,90%,55%/0.03)] blur-[100px]" />
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(210,80%,55%/0.2)] bg-[hsl(210,80%,55%/0.06)] mb-7">
              <Shield className="w-4 h-4 text-[hsl(210,90%,60%)]" />
              <span className="text-sm font-medium text-[hsl(210,80%,70%)]">Trusted by creators worldwide</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
              Real creators, real results
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Hear from people already building with AlterAI.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-7 flex flex-col hover:border-[hsl(260,60%,55%/0.25)] transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                whileHover={{ y: -3 }}
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[hsl(40,90%,55%)] text-[hsl(40,90%,55%)]" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="mt-6 pt-4 border-t border-border/40">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-28 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div
            className="relative rounded-3xl border border-[hsl(260,60%,55%/0.2)] bg-gradient-to-br from-[hsl(260,60%,55%/0.06)] via-card to-[hsl(210,80%,55%/0.06)] p-12 sm:p-16 text-center overflow-hidden"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} custom={0}
          >
            {/* Neon glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[hsl(260,80%,55%/0.1)] rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[150px] bg-[hsl(210,90%,55%/0.06)] rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <motion.div
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] flex items-center justify-center mx-auto mb-7 shadow-lg shadow-[hsl(260,80%,55%/0.25)]"
                whileHover={{ rotate: 12, scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <Zap className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Create your first AI bot today
              </h2>
              <p className="mt-5 text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Join a growing community of creators building AI-powered bots and content.
                No coding required, no credit card needed.
              </p>
              <Button
                size="lg"
                className="mt-9 h-14 px-10 text-base font-semibold bg-gradient-to-r from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] hover:from-[hsl(260,80%,60%)] hover:to-[hsl(210,85%,60%)] text-white shadow-xl shadow-[hsl(260,80%,55%/0.3)] border-0"
                asChild
              >
                <Link to="/auth">
                  Start building your AI now <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground/70">
                No coding required · Start for free · Set up in minutes
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-border/30 py-14 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="grid sm:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-bold text-foreground text-lg">Alter AI</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground max-w-xs leading-relaxed">
                The all-in-one platform for AI bots, multi-platform content, and creative monetization.
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[hsl(210,90%,60%)]" />
                <span className="text-xs text-muted-foreground">Secure · Verified · Privacy-first</span>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Product</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Pricing", to: "/pricing" },
                  { label: "Marketplace", to: "/marketplace" },
                  { label: "Content Studio", to: "/content-studio" },
                  { label: "Templates", to: "/template-marketplace" },
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

            {/* Legal Links */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Legal</h4>
              <ul className="space-y-2.5">
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

          <div className="pt-7 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">© 2026 Alter AI. All rights reserved.</span>
            <span className="text-xs text-muted-foreground">Built for creators, by creators.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
