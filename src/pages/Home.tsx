import { useRef, useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";
import {
  ArrowRight, Mic, Video, BarChart3, Layers, Clock, DollarSign,
  Globe, Settings, Shield, Sparkles, ChevronRight, Zap, Check, Star,
  MessageSquare, Image, TrendingUp, Play, BookTemplate, ArrowDown,
  Brain, Wand2, Target, Repeat, Hash, Quote, Users, Film, Type,
  Download, Store, Briefcase, ShoppingBag, Megaphone, Building2, PenLine
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import bgLogo from "@/assets/bg-logo.png";
import chromeTexture from "@/assets/chrome-texture.jpg";
import creator1 from "@/assets/creators/creator-1.jpg";
import creator2 from "@/assets/creators/creator-2.jpg";
import creator3 from "@/assets/creators/creator-3.jpg";
import creator4 from "@/assets/creators/creator-4.jpg";
import creator5 from "@/assets/creators/creator-5.jpg";

const creatorAvatars = [
  { src: creator1, alt: "Creator Maya" },
  { src: creator2, alt: "Creator Jordan" },
  { src: creator3, alt: "Creator Aaliyah" },
  { src: creator4, alt: "Creator Kenji" },
  { src: creator5, alt: "Creator Sofia" },
];

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
    icon: PenLine, title: "Ad Script Engine", subtitle: "Hooks, scripts & captions that convert",
    desc: "Generate platform-tuned ad scripts with proven viral hook formulas. Edit inline, regenerate variations, and ship copy that sells in seconds.",
    accent: "from-[hsl(330,85%,55%)] to-[hsl(350,80%,50%)]", glow: "hsl(330 85% 55% / 0.15)",
    stats: ["Viral hook library", "Inline editor", "Unlimited variations"], link: "/content-studio",
  },
  {
    icon: Image, title: "Visuals & Image Studio", subtitle: "Product shots, scenes, thumbnails",
    desc: "Generate scroll-stopping ad visuals — product shots, lifestyle scenes, thumbnails, and image ads optimized for every feed.",
    accent: "from-[hsl(40,90%,55%)] to-[hsl(25,85%,50%)]", glow: "hsl(35 90% 55% / 0.15)",
    stats: ["Product shots", "Scene generation", "Multi-aspect export"], link: "/content-studio",
  },
  {
    icon: Film, title: "Video & Voiceover Studio", subtitle: "Scene editor + AI voice in one flow",
    desc: "Compile scene-by-scene video ads with AI voiceovers, music, and captions. Export TikTok, Reels, Shorts, and YouTube formats — no editor required.",
    accent: "from-[hsl(200,90%,50%)] to-[hsl(220,80%,60%)]", glow: "hsl(210 90% 55% / 0.15)",
    stats: ["Scene editor", "AI voiceover", "1-click export"], link: "/content-studio",
  },
  {
    icon: BookTemplate, title: "Ad Template Library", subtitle: "Proven formats, ready to remix",
    desc: "Start from battle-tested ad templates for UGC, product launches, before/after, hooks, and offers. Drop in your product and ship.",
    accent: "from-[hsl(170,80%,45%)] to-[hsl(190,70%,50%)]", glow: "hsl(180 80% 45% / 0.15)",
    stats: ["UGC templates", "TikTok-safe", "Remix & reuse"], link: "/tiktok-templates",
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
    step: 1, icon: PenLine, title: "Describe Your Product",
    desc: "Tell Alterai about your product, audience, and offer. One short brief is all it needs to start crafting your ad.",
    prompt: '"Eco-friendly water bottle, $29, audience: gym-goers 18-30, offer: 20% off launch week"',
    output: "✅ Brief locked in — Tone: energetic, Angle: hydration as performance edge, Hook style: POV transformation",
    color: "from-[hsl(330,85%,55%)] to-[hsl(350,80%,50%)]",
  },
  {
    step: 2, icon: Wand2, title: "Generate Scripts, Visuals & Voiceovers",
    desc: "Alterai writes the hook, script, and captions, generates product visuals and scenes, then drops in an AI voiceover — all in one pass.",
    prompt: '"Make me a 15-second TikTok ad for this"',
    output: "🎬 Script + 4 scene visuals + AI voiceover generated in ~12s — ready to preview in the scene editor",
    color: "from-[hsl(210,90%,55%)] to-[hsl(230,80%,60%)]",
    contextFeatures: ["Hook + script", "Scene visuals", "AI voiceover"],
  },
  {
    step: 3, icon: Download, title: "Export Ready-to-Post Ads",
    desc: "Export to TikTok, Reels, Shorts, YouTube, or Meta in the right format and aspect ratio. No watermarks. Post or upload to Ads Manager.",
    prompt: '"Export 9:16 for TikTok and 1:1 for Meta"',
    output: "📤 2 ad formats exported — TikTok-safe, no watermark, ready to upload to Ads Manager",
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
  { icon: PenLine, label: "Scripts", color: "text-[hsl(330,80%,60%)]", bg: "bg-[hsl(330,80%,60%/0.1)]" },
  { icon: Image, label: "Visuals", color: "text-[hsl(40,90%,60%)]", bg: "bg-[hsl(40,90%,60%/0.1)]" },
  { icon: Film, label: "Video", color: "text-[hsl(210,90%,60%)]", bg: "bg-[hsl(210,90%,60%/0.1)]" },
  { icon: Mic, label: "Voiceover", color: "text-[hsl(250,70%,65%)]", bg: "bg-[hsl(250,70%,65%/0.1)]" },
  { icon: BookTemplate, label: "Templates", color: "text-[hsl(170,80%,55%)]", bg: "bg-[hsl(170,80%,55%/0.1)]" },
  { icon: Download, label: "Export", color: "text-[hsl(160,70%,50%)]", bg: "bg-[hsl(160,70%,50%/0.1)]" },
];

/* ─── Audience: Who it's for ─── */
const audiences = [
  { icon: Video, label: "UGC Creators", desc: "Ship native-feeling ads that convert" },
  { icon: Megaphone, label: "TikTok Advertisers", desc: "Scroll-stopping hooks built to scale" },
  { icon: Briefcase, label: "Small Businesses", desc: "Pro-quality ads without an agency" },
  { icon: ShoppingBag, label: "Dropshippers", desc: "Test product creatives in minutes" },
  { icon: Building2, label: "Agencies", desc: "10x client output with one operator" },
  { icon: Users, label: "Influencers", desc: "Turn promos into branded campaigns" },
];

/* ─── Why Alterai ─── */
const whyAlterai = [
  { icon: Shield, title: "No watermarks", desc: "Every export is clean and post-ready — yours to publish anywhere." },
  { icon: Layers, title: "Multi-platform formatting", desc: "Auto-resize for TikTok, Reels, Shorts, YouTube, and Meta in one click." },
  { icon: Check, title: "TikTok-safe content", desc: "Ad outputs follow TikTok-friendly guidelines so your account stays healthy." },
  { icon: Zap, title: "Fast exports", desc: "Render scripts, visuals, and videos in seconds — not hours." },
  { icon: Repeat, title: "Unlimited scripts", desc: "Iterate angles and hooks endlessly until the creative converts." },
  { icon: Globe, title: "Built for ads, not posts", desc: "Every output is engineered to sell — hooks, CTAs, and offers built-in." },
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
      <section className="relative pt-40 pb-36 sm:pt-48 sm:pb-44 px-4 overflow-hidden">
        {/* Chrome marble texture overlay — stronger presence */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-soft-light"
          style={{
            backgroundImage: `url(${chromeTexture})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
          }}
        />
        {/* Soft copper / chrome glow wash */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] rounded-full bg-[hsl(var(--primary)/0.10)] blur-[160px]" />
          <div className="absolute top-40 left-[10%] w-[500px] h-[500px] rounded-full bg-[hsl(var(--accent)/0.35)] blur-[140px]" />
          <div className="absolute top-72 right-[10%] w-[450px] h-[450px] rounded-full bg-[hsl(var(--primary-glow)/0.18)] blur-[130px]" />
        </div>

        <FloatingOrb className="top-40 left-[15%] w-2 h-2 bg-[hsl(var(--primary)/0.4)]" />
        <FloatingOrb className="top-56 right-[20%] w-1.5 h-1.5 bg-[hsl(var(--accent)/0.6)]" />
        <FloatingOrb className="bottom-40 left-[30%] w-1 h-1 bg-[hsl(var(--primary-glow)/0.5)]" />

        <motion.div className="container mx-auto text-center max-w-4xl relative z-10" style={{ opacity: heroOpacity, scale: heroScale }}>
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm text-primary mb-10 backdrop-blur-sm"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="font-medium tracking-wide">AI Ad Creation Platform</span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.02]"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            <span className="text-foreground">Create ads</span>
            <br />
            <span className="text-copper">that actually sell.</span>
          </motion.h1>

          <motion.p
            className="mt-8 text-xl sm:text-2xl text-foreground/90 max-w-2xl mx-auto leading-snug font-medium"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Generate scripts, visuals, voiceovers, and ready-to-post video ads for TikTok, Reels, Shorts & Meta — in minutes, not weeks.
          </motion.p>

          <motion.p
            className="mt-4 text-base text-muted-foreground max-w-xl mx-auto"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            No writing. No editing. No guessing. Just paste, click, post.
          </motion.p>

          <motion.div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold text-primary-foreground border-0 copper-glow transition-all duration-300 hover:scale-[1.02]"
              style={{ backgroundImage: "var(--gradient-primary)" }}
              asChild
            >
              <Link to="/auth">Try it free — 1 prompt, 6 posts <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-base border-border/60 hover:border-primary/40 hover:bg-primary/5 backdrop-blur-sm" asChild>
              <Link to="/content-creator"><Play className="w-4 h-4 mr-2" /> See how it works</Link>
            </Button>
          </motion.div>

          <motion.p className="mt-6 text-sm text-muted-foreground/70" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
            Free forever plan · No credit card · Post in 60 seconds
          </motion.p>

          {/* Social proof strip */}
          <motion.div
            className="mt-10 flex flex-col items-center gap-5"
            initial="hidden" animate="visible" variants={fadeUp} custom={4}
          >
            <div className="flex items-center gap-4">
              {/* Stacked avatars */}
              <div className="flex -space-x-2">
                {creatorAvatars.map((c, i) => (
                  <img
                    key={i}
                    src={c.src}
                    alt={c.alt}
                    loading="lazy"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full ring-2 ring-background object-cover bg-muted"
                  />
                ))}
              </div>

              {/* Star rating */}
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-primary text-primary" />
                  ))}
                  <span className="ml-1.5 text-sm font-semibold text-foreground">4.9</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  Loved by <span className="font-semibold text-foreground">1,200+</span> creators
                </span>
              </div>
            </div>

            {/* "Built for" platform logos */}
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 font-semibold">
                Built for content on
              </span>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 opacity-70">
                {["TikTok", "Instagram", "YouTube", "X", "LinkedIn", "Threads"].map((p) => (
                  <span
                    key={p}
                    className="text-sm font-bold tracking-tight text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Animated counters */}
          <motion.div
            className="mt-20 grid grid-cols-3 gap-4 max-w-lg mx-auto"
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

      {/* ═══════════════════════ CTA — CONTENT CREATOR ENGINE ═══════════════════════ */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card/80 via-card/60 to-[hsl(var(--primary)/0.08)] backdrop-blur-md p-8 sm:p-12 shadow-2xl shadow-[hsl(var(--primary)/0.12)]"
          >
            {/* glow accents */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-[hsl(var(--primary)/0.18)] blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[hsl(var(--accent)/0.25)] blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8 justify-between">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary mb-4">
                  <Wand2 className="w-3.5 h-3.5" />
                  <span className="tracking-wide uppercase">Content Creator Engine</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
                  Turn one idea into <span className="text-copper">viral-ready content</span>
                </h2>
                <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl leading-relaxed">
                  The Content Creator Engine writes hooks, scripts, captions, and platform-tuned posts in seconds — with smart context, viral patterns, and tier-based output quality.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {["Viral hooks", "Multi-platform", "Smart context", "Tiered quality"].map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-medium px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50 text-foreground/80"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
                <Button
                  size="lg"
                  className="h-13 px-8 text-base font-semibold text-primary-foreground border-0 copper-glow transition-all duration-300 hover:scale-[1.02]"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                  asChild
                >
                  <Link to="/content-creator">
                    Launch Content Creator <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 px-8 text-sm border-border/60 hover:border-primary/40 hover:bg-primary/5"
                  asChild
                >
                  <Link to="/content-studio">See Content Studio</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
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
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">From product to ad in 3 steps</h2>
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

      {/* ═══════════════════════ AD CREATION CENTER ═══════════════════════ */}
      <section ref={featuresRef} className="py-24 px-4 bg-secondary/30 relative">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Wand2 className="w-3 h-3" /> AD CREATION CENTER
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Every tool you need to ship a winning ad</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Scripts, visuals, video, voiceover, templates, and exports — all under one roof.</p>
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

      {/* ═══════════════════════ WHO IT'S FOR ═══════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[hsl(330,85%,55%/0.1)] text-[hsl(330,85%,60%)] text-xs font-bold mb-4">
              <Target className="w-3 h-3" /> WHO IT'S FOR
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Built for the people who ship ads</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">Whether you're testing 50 creatives a week or launching your first product — Alterai fits.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {audiences.map((a, i) => (
              <motion.div
                key={a.label}
                className="rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex items-start gap-4"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -3 }}
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-[hsl(330,85%,55%/0.2)] flex items-center justify-center text-primary shrink-0">
                  <a.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{a.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ WHY ALTERAI ═══════════════════════ */}
      <section className="py-24 px-4 bg-secondary/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-[hsl(var(--primary)/0.06)] blur-[140px]" />
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div className="text-center mb-14" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Sparkles className="w-3 h-3" /> WHY ALTERAI.IM
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Built for ads. Tuned for performance.</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">The little things that make the difference between a creative that flops and one that scales.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {whyAlterai.map((w, i) => (
              <motion.div
                key={w.title}
                className="rounded-2xl border border-border/50 bg-card p-6 hover:border-primary/30 transition-all duration-300"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                whileHover={{ y: -3 }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <w.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{w.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{w.desc}</p>
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

      {/* ═══════════════════════ EARLY ACCESS ═══════════════════════ */}
      <EarlyAccessSection />

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

      <SiteFooter />
    </div>
  );
}
