import { useRef, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  ArrowRight,
  Video,
  Image as ImageIcon,
  Zap,
  Check,
  Star,
  Play,
  Target,
  Film,
  Mic,
  Loader2,
  CheckCircle2,
  Mail,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import SiteFooter from "@/components/SiteFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Target,
    title: "Campaign Strategy Engine",
    desc: "One input generates a complete multi-platform ad strategy with audience targeting, emotional hooks, and CTA variations.",
    gradient: "from-cyan-400 to-blue-500",
  },
  {
    icon: ImageIcon,
    title: "AI Image Ads",
    desc: "Generate scroll-stopping ad visuals for Facebook, Instagram, and YouTube with DALL-E powered image generation.",
    gradient: "from-blue-500 to-purple-500",
  },
  {
    icon: Film,
    title: "Scene-Based Video Ads",
    desc: "Create hook-first video ads with structured scenes: Hook, Problem, Solution, CTA. Powered by Runway ML.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Mic,
    title: "AI Voiceovers",
    desc: "Professional narration for your video ads with ElevenLabs voice generation. Multiple voices and tones.",
    gradient: "from-pink-500 to-rose-400",
  },
];

const platforms = [
  { name: "TikTok", format: "9:16 vertical" },
  { name: "Instagram", format: "9:16 + 1:1" },
  { name: "Facebook", format: "1:1 + 16:9" },
  { name: "YouTube", format: "16:9 widescreen" },
];

const pricingPreview = [
  { name: "Free", price: "$0", desc: "Text ads only" },
  { name: "Starter", price: "$12", desc: "Limited images" },
  { name: "Creator", price: "$29", desc: "Most Popular", highlighted: true },
  { name: "Pro", price: "$59", desc: "Full video" },
  { name: "Studio", price: "$99", desc: "Agency/bulk" },
];

function FloatingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-400/15 dark:bg-cyan-400/10 blur-[100px] animate-float-blob" />
      <div className="absolute top-20 right-[-100px] w-[400px] h-[400px] rounded-full bg-purple-500/15 dark:bg-purple-500/10 blur-[100px] animate-float-blob-reverse" />
      <div className="absolute bottom-[-80px] left-1/3 w-[450px] h-[450px] rounded-full bg-pink-400/12 dark:bg-pink-400/8 blur-[100px] animate-float-blob" style={{ animationDelay: "5s" }} />
    </div>
  );
}

function OrnateDecoration({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-cyan-400/50 to-purple-500/50" />
      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 animate-pulse-glow" />
      <div className="h-px w-16 bg-gradient-to-l from-transparent via-pink-500/50 to-purple-500/50" />
    </div>
  );
}

export default function Home() {
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const featuresInView = useInView(featuresRef, { once: true });

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleEarlyAccess = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("early_access_leads")
        .insert({ email: email.trim() });
      if (error && error.code !== "23505") throw error;
      setSubmitted(true);
      toast({ title: "You're on the list!", description: "We'll notify you when we launch." });
    } catch {
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <SEO
        title="Alterai.im — AI Ad Campaign Generator | Full Campaigns in 60 Seconds"
        description="Generate complete paid social ad campaigns in under 60 seconds. Video ads, image ads, captions, hooks, and targeting for TikTok, Instagram, Facebook & YouTube."
        path="/"
      />
      <Navbar />

      {/* ─── Hero ─── */}
      <section ref={heroRef} className="relative pt-28 pb-24 px-4">
        <FloatingBlobs />

        {/* Orbital ring decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[800px] md:h-[800px] pointer-events-none opacity-[0.07] dark:opacity-[0.05]" aria-hidden>
          <div className="absolute inset-0 rounded-full border border-cyan-400" style={{ transform: "rotateX(60deg)" }} />
          <div className="absolute inset-8 rounded-full border border-purple-500" style={{ transform: "rotateX(60deg) rotateZ(30deg)" }} />
          <div className="absolute inset-16 rounded-full border border-pink-400" style={{ transform: "rotateX(60deg) rotateZ(60deg)" }} />
        </div>

        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <img
              src="/logo.png"
              alt="Alterai.im"
              className="w-20 h-20 mx-auto mb-6 drop-shadow-lg"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI Ad Campaign Generator
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
          >
            <span className="font-display italic">Generate</span> complete ad
            <br />
            campaigns{" "}
            <span className="gradient-text-hero">
              in under 60 seconds
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
          >
            One input. Full campaigns for TikTok, Instagram, Facebook, and
            YouTube. Video ads, image ads, captions, hooks, and targeting
            — all AI-generated.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-14"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={4}
          >
            <Button
              size="lg"
              className="text-base px-8 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border-0 shadow-lg shadow-cyan-500/25"
              asChild
            >
              <Link to="/dashboard">
                <Play className="w-4 h-4 mr-2" />
                Start Generating Ads
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12 border-border/60 hover:border-primary/40"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={5}
          >
            {platforms.map((p) => (
              <div
                key={p.name}
                className="glass-card flex items-center gap-2 px-4 py-2.5 rounded-full text-sm"
              >
                <Video className="w-3.5 h-3.5 text-cyan-500" />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">
                  {p.format}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="relative py-24 px-4">
        <OrnateDecoration className="mb-16" />
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 font-display">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            From idea to full campaign in three steps
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe Your Product",
                desc: '"Skincare product for acne-prone skin" — that\'s all it takes.',
                color: "from-cyan-400 to-blue-500",
              },
              {
                step: "2",
                title: "AI Generates Everything",
                desc: "Strategy, hooks, captions, image ads, video ads, voiceovers, and targeting.",
                color: "from-blue-500 to-purple-500",
              },
              {
                step: "3",
                title: "Download & Launch",
                desc: "Export campaign-ready assets for TikTok, Instagram, Facebook, and YouTube.",
                color: "from-purple-500 to-pink-500",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="glass-card text-center p-8 rounded-2xl card-hover"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section ref={featuresRef} className="relative py-24 px-4">
        <FloatingBlobs />
        <OrnateDecoration className="mb-16" />
        <div className="container mx-auto max-w-5xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 font-display">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            An AI advertising agency in software form
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass-card p-7 rounded-2xl card-hover group"
                initial="hidden"
                animate={featuresInView ? "visible" : "hidden"}
                variants={scaleIn}
                custom={i}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── What You Get ─── */}
      <section className="py-24 px-4">
        <OrnateDecoration className="mb-16" />
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 font-display">
            From 1 Input, You Get:
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            A complete multi-platform advertising campaign
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "3-5 Video Ads", icon: Film },
              { label: "5 Image Ads", icon: ImageIcon },
              { label: "Multiple Hooks", icon: Sparkles },
              { label: "Captions + Hashtags", icon: Zap },
              { label: "CTA Variations", icon: Target },
              { label: "Audience Targeting", icon: Star },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="glass-card flex items-center gap-3 p-5 rounded-xl card-hover"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={i}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Preview ─── */}
      <section className="relative py-24 px-4">
        <FloatingBlobs />
        <OrnateDecoration className="mb-16" />
        <div className="container mx-auto max-w-5xl text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-2 font-display">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground mb-14">
            Start free. Upgrade when you need more.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-10">
            {pricingPreview.map((p) => (
              <div
                key={p.name}
                className={`glass-card px-6 py-5 rounded-2xl text-center min-w-[150px] transition-all duration-300 ${
                  p.highlighted
                    ? "ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/10 scale-105"
                    : "hover:scale-[1.02]"
                }`}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {p.name}
                </div>
                <div className="text-3xl font-bold gradient-text">{p.price}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.desc}
                </div>
                {p.highlighted && (
                  <div className="mt-2">
                    <Star className="w-3.5 h-3.5 text-cyan-500 inline" />
                    <span className="text-xs text-cyan-600 dark:text-cyan-400 ml-1 font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button
            className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0 shadow-lg shadow-purple-500/20"
            asChild
          >
            <Link to="/pricing">
              See Full Pricing <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── Early Access CTA ─── */}
      <section className="relative py-24 px-4">
        <OrnateDecoration className="mb-16" />
        <div className="container mx-auto max-w-xl text-center relative z-10">
          <div className="glass-card p-10 rounded-3xl">
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-3 font-display">Get Early Access</h2>
            <p className="text-muted-foreground mb-6">
              Join the waitlist to be first in line when we launch.
            </p>
            {submitted ? (
              <div className="flex items-center justify-center gap-2 text-cyan-600 dark:text-cyan-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">You're on the list!</span>
              </div>
            ) : (
              <form onSubmit={handleEarlyAccess} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 border-border/60 focus:border-cyan-400/50"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 border-0"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Join
                    </>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
