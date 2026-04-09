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
  { icon: Settings, title: "Total flexibility", desc: "Use Alterai.im credits to get started instantly, or bring your own API keys. Scale on your own terms." },
];

const testimonials = [
  { quote: "Alterai.im completely changed how I create content. What used to take me all day now takes 5 minutes.", name: "Content Creator", role: "TikTok · 50K followers" },
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
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      {/* Fixed background logo */}
      <div
        className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center"
        aria-hidden="true"
      >
        <img
          src={bgLogo}
          alt=""
          className="w-[600px] h-[600px] object-contain opacity-[0.04]"
        />
      </div>

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
                className="group relative rounded-3xl border border-border/50 bg-card p-8 hover:border-[hsl(260,60%,55%/0.3)] transition-all duration-500 overflow-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.1 }}
              >
                {/* Decorative background glow */}
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

      {/* ═══════════════════════ BENEFITS ═══════════════════════ */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Designed for the <br />
                <span className="text-primary">next generation</span> of creators
              </h2>
              <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                Stop juggling dozens of tools. Alterai.im brings your entire AI workflow 
                into a single, high-performance dashboard.
              </p>
              
              <div className="mt-10 space-y-8">
                {benefits.map((b, i) => (
                  <motion.div key={b.title} className="flex gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={slideIn} custom={i}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <b.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{b.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 blur-[120px] rounded-full" />
              <div className="relative rounded-2xl border border-border/50 bg-card p-4 shadow-2xl">
                <div className="aspect-[4/3] rounded-xl bg-secondary/50 flex items-center justify-center border border-border/30">
                  <div className="text-center p-8">
                    <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">Live Analytics Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ TIKTOK CTA ═══════════════════════ */}
      <section className="py-16 px-4 relative">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="relative rounded-3xl border border-border/50 bg-card overflow-hidden group hover:border-primary/30 transition-all duration-500"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
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
                <Link to="/tiktok-templates">
                  Try Templates <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="py-24 px-4 relative">
        <div className="container mx-auto max-w-5xl">
          <div className="rounded-[40px] bg-gradient-to-br from-[hsl(260,80%,55%)] to-[hsl(210,85%,55%)] p-12 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-5xl font-extrabold mb-6">Ready to automate your <br className="hidden sm:block" /> content empire?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">Join thousands of creators who are scaling their reach with Alterai.im.</p>
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
