import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Bot, Mic, Video, BarChart3, Layers, Clock, DollarSign,
  Globe, Settings, Shield, Sparkles, ChevronRight, Zap, Check, Star,
  MessageSquare, Image, TrendingUp, Play, BookTemplate, ArrowDown,
  Brain, Wand2, Target, Repeat, Hash, Quote, Users
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
    icon: Bot, title: "AI Bots", subtitle: "Build once, deploy everywhere",
    desc: "Create custom AI personalities with unique voices, knowledge, and behaviors. Publish to the marketplace or keep them private for your audience.",
    accent: "from-[hsl(260,80%,60%)] to-[hsl(280,70%,50%)]", glow: "hsl(270 80% 55% / 0.15)",
    stats: ["Custom personas", "Smart context", "Marketplace ready"], link: "/marketplace",
  },
  {
    icon: Video, title: "Voice & Video Studio", subtitle: "Generate multi-platform content instantly",
    desc: "One prompt generates optimized content for TikTok, Instagram, LinkedIn, Twitter, Facebook, and Pinterest — with AI voiceovers and video compilation.",
    accent: "from-[hsl(200,90%,50%)] to-[hsl(220,80%,60%)]", glow: "hsl(210 90% 55% / 0.15)",
    stats: ["6 platforms", "AI voiceover", "Video compiler"], link: "/content-studio",
  },
  {
    icon: BarChart3, title: "Analytics & Profit", subtitle: "Track usage, control costs",
    desc: "See exactly how your bots perform. Set pricing, track revenue, and understand user engagement — all in a clean dashboard.",
    accent: "from-[hsl(170,80%,45%)] to-[hsl(190,70%,50%)]", glow: "hsl(180 80% 45% / 0.15)",
    stats: ["Usage analytics", "Revenue tracking", "Flexible pricing"], link: "/dashboard",
  },
  {
    icon: BookTemplate, title: "Template Library", subtitle: "Instant content creation",
    desc: "Save your best content as reusable templates. Browse the community marketplace, load templates, and generate new variations instantly.",
    accent: "from-[hsl(40,90%,55%)] to-[hsl(25,85%,50%)]", glow: "hsl(35 90% 55% / 0.15)",
    stats: ["Save & reuse", "Community marketplace", "Platform presets"], link: "/template-marketplace",
  },
];

const aiExamples = [
  {
    platform: "TikTok Script",
    color: "from-[hsl(330,85%,55%)] to-[hsl(350,80%,50%)]",
    icon: Video,
    before: '"I sell handmade candles"',
    after: `🎬 Hook: "POV: You just found the candle that smells like your happiest memory"\n\n📱 Scene 1: Close-up of hand-pouring wax (3s)\n📱 Scene 2: Match strike + first light (2s)\n📱 Scene 3: Cozy room ambiance shot (3s)\n\n🎵 Sound: Lo-fi + crackling fire\n📝 CTA: "Link in bio — 20% off today only"`,
  },
  {
    platform: "Instagram Caption",
    color: "from-[hsl(260,80%,60%)] to-[hsl(280,70%,55%)]",
    icon: Image,
    before: '"New protein bar launch"',
    after: `💪 Stop eating protein bars that taste like cardboard.\n\nWe spent 14 months perfecting a bar that actually tastes like a dessert — with 28g protein, zero sugar, and ingredients you can pronounce.\n\nDrop a 🔥 if you want to try it before anyone else.\n\n#ProteinBar #FitnessFood #CleanEating #GymLife #HealthySnacks`,
  },
  {
    platform: "YouTube Idea",
    color: "from-[hsl(0,85%,55%)] to-[hsl(15,80%,50%)]",
    icon: Play,
    before: '"I\'m a fitness coach"',
    after: `📺 Title: "I Trained Like a Navy SEAL for 30 Days — Here's What Happened"\n\n🎯 Hook: Open with Day 30 transformation reveal\n📋 Structure: Day 1 baseline → Week 1 struggles → Week 2 adaptation → Week 3 breakthroughs → Day 30 results\n\n💡 Thumbnail: Split face — exhausted vs. determined\n⏱️ Target: 12-15 min for max ad revenue`,
  },
  {
    platform: "LinkedIn Post",
    color: "from-[hsl(210,90%,50%)] to-[hsl(220,80%,55%)]",
    icon: MessageSquare,
    before: '"SaaS product update"',
    after: `We just shipped the feature our users asked for 847 times.\n\nAnd it took our team 6 weeks, not 6 months.\n\nHere's how we prioritized speed without sacrificing quality:\n\n→ User interviews (not assumptions)\n→ 3-day design sprint\n→ Ship MVP → iterate fast\n\nThe result? 40% increase in daily active users.\n\nStop building what you think users want. Build what they're begging for.`,
  },
];

const howItWorks = [
  {
    step: 1, icon: Bot, title: "Create Your AI Bot",
    desc: "Choose a niche, set a personality, and define your brand voice. Your bot becomes a content expert in your industry.",
    prompt: '"Create a fitness coach bot that speaks like a motivational drill sergeant"',
    output: "✅ Bot created: FitSarge — Personality: High-energy, no-excuses motivator with deep nutrition knowledge",
    color: "from-[hsl(260,80%,60%)] to-[hsl(280,70%,55%)]",
  },
  {
    step: 2, icon: Brain, title: "Add Memory & Context",
    desc: "Feed it your brand guidelines, audience data, product links, and past content. Smart context means it learns your style and adapts over time.",
    prompt: '"My audience is 18-25, loves memes, shops on TikTok Shop"',
    output: "🧠 Context saved — Bot now tailors tone, references, and CTAs for Gen Z TikTok shoppers",
    color: "from-[hsl(210,90%,55%)] to-[hsl(230,80%,60%)]",
    contextFeatures: ["Persistent memory", "Learns your style", "Adapts outputs over time"],
  },
  {
    step: 3, icon: Wand2, title: "Generate Content Across Platforms",
    desc: "One prompt creates optimized content for TikTok, Instagram, LinkedIn, YouTube, Twitter, and Pinterest — each tailored to the platform's format.",
    prompt: '"Write a product launch post for my new sneaker line"',
    output: "📱 6 platform-ready posts generated in 8 seconds — each with unique hooks, hashtags, and formatting",
    color: "from-[hsl(330,85%,55%)] to-[hsl(350,80%,50%)]",
  },
  {
    step: 4, icon: Target, title: "Auto-Optimize with Trends",
    desc: "Track what performs, let AI suggest improvements, and iterate on your best content. Your bot gets smarter with every post.",
    prompt: '"Which of my posts performed best this week?"',
    output: "📊 Your 'Before/After' TikTok template drove 3x more engagement — generating 5 new variations now",
    color: "from-[hsl(170,80%,45%)] to-[hsl(190,70%,50%)]",
  },
];

const testimonials = [
  {
    quote: "Alterai.im completely changed how I create content. What used to take me all day now takes 5 minutes. My engagement has never been higher.",
    name: "Jasmine Rivera", role: "TikTok Creator · 52K followers",
    avatar: "JR", metric: "5x faster content creation",
  },
  {
    quote: "The multi-platform generation is a game changer. I post to 6 platforms from one prompt and each post feels native to the platform.",
    name: "Marcus Chen", role: "Digital Marketing Agency",
    avatar: "MC", metric: "6 platforms from 1 prompt",
  },
  {
    quote: "I built a custom bot, published it, and started earning within the first week. The analytics dashboard makes it easy to see what's working.",
    name: "Aisha Thompson", role: "AI Bot Creator & Entrepreneur",
    avatar: "AT", metric: "Revenue in first week",
  },
  {
    quote: "The template engine is insane. I create TikTok content for my clients in seconds. They think I have a whole team behind me.",
    name: "David Park", role: "Freelance Content Strategist",
    avatar: "DP", metric: "10x client output",
  },
];

const pricingTiers = [
  {
    name: "Free", price: "$0", period: "/forever",
    desc: "Start creating with zero risk",
    features: ["15 messages per day", "2 image generations per day", "Access to marketplace", "Basic AI models", "Community templates"],
    cta: "Start Free", ctaVariant: "outline" as const, highlight: false,
  },
  {
    name: "Pro", price: "$9", period: "/month",
    desc: "For serious creators scaling content",
    features: ["Unlimited messages", "20 image generations per day", "Higher-quality AI models", "Faster response times", "Priority support"],
    cta: "Go Pro", ctaVariant: "default" as const, highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Power", price: "$29", period: "/month",
    desc: "Unlimited everything for power users",
    features: ["Unlimited messages", "Unlimited image generation", "Best AI models available", "Priority processing", "Advanced analytics"],
    cta: "Get Power", ctaVariant: "outline" as const, highlight: false,
  },
];

const heroCapabilities = [
  { icon: Bot, label: "AI Bots", color: "text-[hsl(270,80%,65%)]", bg: "bg-[hsl(270,80%,65%/0.1)]" },
  { icon: Video, label: "Content", color: "text-[hsl(210,90%,60%)]", bg: "bg-[hsl(210,90%,60%/0.1)]" },
  { icon: Mic, label: "Voice", color: "text-[hsl(250,70%,65%)]", bg: "bg-[hsl(250,70%,65%/0.1)]" },
  { icon: Image, label: "Images", color: "text-[hsl(40,90%,60%)]", bg: "bg-[hsl(40,90%,60%/0.1)]" },
  { icon: MessageSquare, label: "Chat", color: "text-[hsl(330,80%,60%)]", bg: "bg-[hsl(330,80%,60%/0.1)]" },
  { icon: TrendingUp, label: "Analytics", color: "text-[hsl(160,70%,50%)]", bg: "bg-[hsl(160,70%,50%/0.1)]" },
];

/* ─── Animated Counter ─── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Floating Particle (decorative) ─── */
function FloatingOrb({ className }: { className: string }) {
  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      animate={{ y: [0, -20, 0], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Typing animation for AI examples ─── */
function TypingText({ text, inView }: { text: string; inView: boolean }) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!inView) return;
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(timer);
    }, 12);
    return () => clearInterval(timer);
  }, [inView, text]);

  return (
    <span className="whitespace-pre-wrap">
      {displayed}
      {displayed.length < text.length && <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom" />}
    </span>
  );
}

export default function Home() {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.08], [1, 0.97]);
  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-80px" });
  const [activeExample, setActiveExample] = useState(0);
  const exampleRef = useRef(null);
  const exampleInView = useInView(exampleRef, { once: true, margin: "-60px" });

  // Auto-rotate examples
  useEffect(() => {
    const timer = setInterval(() => setActiveExample(p => (p + 1) % aiExamples.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Fixed background logo */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center" aria-hidden="true">
        <img src={bgLogo} alt="" className="w-[600px] h-[600px] object-contain opacity-[0.04]" />
      </div>

      <Navbar />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative pt-28 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-[hsl(260,80%,55%/0.06)] blur-[140px]" />
          <div className="absolute top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-[hsl(210,90%,55%/0.05)] blur-[120px]" />
          <div className="absolute top-60 right-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(330,85%,50%/0.04)] blur-[100px]" />
        </div>

        <FloatingOrb className="top-32 left-[15%] w-2 h-2 bg-[hsl(260,80%,60%/0.4)]" />
        <FloatingOrb className="top-48 right-[20%] w-1.5 h-1.5 bg-[hsl(210,90%,60%/0.4)]" />
        <FloatingOrb className="bottom-32 left-[30%] w-1 h-1 bg-[hsl(330,85%,55%/0.5)]" />

        <motion.div className="container mx-auto text-center max-w-4xl relative z-10" style={{ opacity: heroOpacity, scale: heroScale }}>
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
            Create AI bots, generate viral content for six platforms, and produce voice-powered videos — all from a single workspace.
          </motion.p>

          <motion.div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] hover:from-[hsl(260,80%,60%)] hover:to-[hsl(210,85%,60%)] text-white shadow-lg shadow-[hsl(260,80%,55%/0.25)] border-0"
              asChild
            >
              <Link to="/auth">Start building your AI now <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/60 hover:border-[hsl(260,60%,55%/0.4)] hover:bg-[hsl(260,60%,55%/0.05)]" asChild>
              <Link to="/marketplace"><Play className="w-4 h-4 mr-2" /> Explore marketplace</Link>
            </Button>
          </motion.div>

          <motion.p className="mt-4 text-sm text-muted-foreground/70" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            No coding required · Start for free · Cancel anytime
          </motion.p>

          {/* Animated counters */}
          <motion.div
            className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={5}
          >
            {[
              { label: "Posts Generated", value: 48000, suffix: "+" },
              { label: "Active Creators", value: 1200, suffix: "+" },
              { label: "Platforms", value: 6, suffix: "" },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {/* Hero capability grid */}
          <motion.div className="mt-12 relative" initial="hidden" animate="visible" variants={scaleIn} custom={6}>
            <div className="relative rounded-2xl border border-border/50 bg-card/30 backdrop-blur-md p-1 shadow-2xl shadow-[hsl(260,80%,55%/0.08)]">
              <div className="rounded-xl bg-gradient-to-br from-card via-card to-[hsl(260,60%,55%/0.05)] p-6 sm:p-10">
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
                  {heroCapabilities.map(item => (
                    <motion.div
                      key={item.label}
                      className={`flex flex-col items-center gap-2 p-4 sm:p-5 rounded-xl ${item.bg} border border-border/30 hover:border-[hsl(260,60%,55%/0.3)] hover:scale-105 transition-all duration-300 cursor-default`}
                      whileHover={{ y: -4 }}
                    >
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground/80">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════ VISUAL PROOF — AI OUTPUT EXAMPLES ═══════════════════════ */}
      <section ref={exampleRef} className="py-24 px-4 bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[hsl(260,80%,55%/0.04)] blur-[120px]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" /> REAL AI OUTPUTS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">See what Alterai.im creates in seconds</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">From a simple idea to platform-ready content. Every output is tailored to its platform.</p>
          </motion.div>

          {/* Platform tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {aiExamples.map((ex, i) => (
              <button
                key={ex.platform}
                onClick={() => setActiveExample(i)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                  activeExample === i
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                    : "bg-card border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {ex.platform}
              </button>
            ))}
          </div>

          {/* Before → After card */}
          <motion.div
            key={activeExample}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Before */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <ArrowRight className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Input</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-5 border border-border/30 min-h-[120px] flex items-center">
                <p className="text-lg text-foreground font-medium italic">{aiExamples[activeExample].before}</p>
              </div>
            </div>

            {/* After */}
            <div className="rounded-2xl border border-border/50 bg-card p-6 relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${aiExamples[activeExample].color}`} />
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${aiExamples[activeExample].color} flex items-center justify-center`}>
                  <Wand2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Output</span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Generated in ~3s</span>
              </div>
              <div className="bg-secondary/50 rounded-xl p-5 border border-border/30">
                <p className="text-sm text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap">
                  {aiExamples[activeExample].after}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(210,90%,55%/0.1)] text-[hsl(210,90%,60%)] text-xs font-bold mb-4">
              <Repeat className="w-3 h-3" /> HOW IT WORKS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">From idea to viral content in 4 steps</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Your AI learns your brand, remembers your audience, and gets smarter with every post.</p>
          </motion.div>

          <div className="space-y-8">
            {howItWorks.map((step, i) => (
              <motion.div
                key={step.step}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 sm:p-8 hover:border-[hsl(260,60%,55%/0.3)] transition-all duration-500 overflow-hidden"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-primary/5 blur-[80px] -mr-24 -mt-24 group-hover:bg-primary/10 transition-all" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-6">
                  <div className="flex items-start gap-4 lg:w-2/5">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg shrink-0`}>
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-muted-foreground mb-1">STEP {step.step}</div>
                      <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      {step.contextFeatures && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {step.contextFeatures.map(f => (
                            <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(210,90%,55%/0.1)] text-[hsl(210,90%,60%)] text-[11px] font-bold">
                              <Brain className="w-3 h-3" /> {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:w-3/5 space-y-3">
                    <div className="rounded-xl bg-secondary/50 border border-border/30 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sample Prompt</div>
                      <p className="text-sm text-foreground/90 font-mono italic">{step.prompt}</p>
                    </div>
                    <div className={`rounded-xl bg-gradient-to-br ${step.color} bg-opacity-5 border border-border/30 p-4`} style={{ background: `linear-gradient(135deg, hsl(0 0% 0% / 0), hsl(0 0% 0% / 0))` }}>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">AI Response</div>
                      <p className="text-sm text-foreground/90 font-mono">{step.output}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FEATURES ═══════════════════════ */}
      <section ref={featuresRef} className="py-24 px-4 bg-secondary/30 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Everything you need to scale</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">The ultimate toolkit for creators and AI entrepreneurs.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="group relative rounded-3xl border border-border/50 bg-card p-8 hover:border-[hsl(260,60%,55%/0.3)] transition-all duration-500 overflow-hidden hover:shadow-xl hover:shadow-primary/5"
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/5 blur-[80px] -mr-32 -mt-32 transition-all duration-500 group-hover:bg-primary/10" />
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} flex items-center justify-center text-white shadow-lg mb-6`}>
                    <f.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">{f.title}</h3>
                  <p className="text-sm font-semibold text-primary/80 mb-4">{f.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{f.desc}</p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {f.stats.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full bg-secondary text-[11px] font-bold text-muted-foreground border border-border/50">{s}</span>
                    ))}
                  </div>
                  <Button variant="link" className="p-0 h-auto text-primary group-hover:gap-2 transition-all" asChild>
                    <Link to={f.link}>Learn more <ChevronRight className="w-4 h-4" /></Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(40,90%,55%/0.1)] text-[hsl(40,90%,55%)] text-xs font-bold mb-4">
              <Users className="w-3 h-3" /> TRUSTED BY CREATORS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Loved by creators who ship content daily</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Real feedback from real users building with Alterai.im.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                className="rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-500 flex flex-col"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-[hsl(40,90%,55%)] fill-[hsl(40,90%,55%)]" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-primary/20 mb-2" />
                <p className="text-sm text-foreground/90 leading-relaxed flex-1 mb-6">{t.quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-[hsl(260,80%,60%)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <div className="mt-4 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[11px] font-bold text-primary text-center">{t.metric}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ PRICING PREVIEW ═══════════════════════ */}
      <section className="py-24 px-4 bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(170,80%,45%/0.1)] text-[hsl(170,80%,45%)] text-xs font-bold mb-4">
              <DollarSign className="w-3 h-3" /> SIMPLE PRICING
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Start free, scale when ready</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">No hidden fees. No surprises. Upgrade or cancel anytime.</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-6">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                className={`relative rounded-2xl border p-6 flex flex-col transition-all duration-500 hover:shadow-xl ${
                  tier.highlight
                    ? "border-primary/50 bg-card shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border/50 bg-card hover:border-primary/20"
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -4 }}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-[hsl(260,80%,60%)] text-white text-xs font-bold shadow-lg">
                    {tier.badge}
                  </div>
                )}
                <div className="text-center mb-6 pt-2">
                  <h3 className="text-lg font-bold text-foreground">{tier.name}</h3>
                  <div className="mt-2">
                    <span className="text-4xl font-extrabold text-foreground">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{tier.desc}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-6">
                  {tier.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full font-semibold ${
                    tier.highlight
                      ? "bg-gradient-to-r from-primary to-[hsl(260,80%,60%)] text-white border-0 shadow-lg shadow-primary/25"
                      : ""
                  }`}
                  variant={tier.highlight ? "default" : "outline"}
                  asChild
                >
                  <Link to={tier.name === "Free" ? "/auth" : "/pricing"}>{tier.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TIKTOK CTA ═══════════════════════ */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="relative rounded-3xl border border-border/50 bg-card overflow-hidden group hover:border-primary/30 transition-all duration-500"
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(330,85%,50%/0.06)] to-[hsl(260,80%,55%/0.06)] group-hover:from-[hsl(330,85%,50%/0.1)] group-hover:to-[hsl(260,80%,55%/0.1)] transition-all duration-500" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-8 sm:p-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(330,85%,55%)] to-[hsl(260,80%,60%)] flex items-center justify-center text-white shadow-lg shrink-0">
                <Zap className="w-8 h-8" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-2xl font-extrabold text-foreground mb-1">Start selling in 60 seconds</h3>
                <p className="text-muted-foreground">Pick a proven TikTok template, drop in your product, and generate scroll-stopping content — no editing skills needed.</p>
              </div>
              <Button
                size="lg"
                className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-[hsl(330,85%,55%)] to-[hsl(260,80%,60%)] hover:from-[hsl(330,85%,60%)] hover:to-[hsl(260,80%,65%)] text-white border-0 shadow-lg shadow-[hsl(330,85%,55%/0.25)] shrink-0"
                asChild
              >
                <Link to="/tiktok-templates">Try Templates <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ FINAL CTA ═══════════════════════ */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-[40px] bg-gradient-to-br from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">Ready to automate your <br className="hidden sm:block" /> content empire?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">Join creators who are scaling their reach with Alterai.im.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button size="lg" variant="secondary" className="h-14 px-10 text-base font-bold text-primary shadow-xl" asChild>
                  <Link to="/auth">Get Started for Free</Link>
                </Button>
                <Button size="lg" variant="ghost" className="h-14 px-8 text-base font-bold text-white hover:bg-white/10" asChild>
                  <Link to="/pricing">View Pricing Plans</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-4 border-t border-border/50 bg-secondary/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold tracking-tight text-foreground">Alterai.im</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Alterai.im AI Platform. All rights reserved.</p>
            <div className="flex gap-8">
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
