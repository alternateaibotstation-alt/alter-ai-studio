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
  Sparkles,
  Zap,
  Check,
  Star,
  Play,
  Target,
  Type,
  Film,
  Mic,
  Loader2,
  CheckCircle2,
  Mail,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    icon: Target,
    title: "Campaign Strategy Engine",
    desc: "One input generates a complete multi-platform ad strategy with audience targeting, emotional hooks, and CTA variations.",
    accent: "from-[hsl(330,85%,55%)] to-[hsl(350,80%,50%)]",
  },
  {
    icon: ImageIcon,
    title: "AI Image Ads",
    desc: "Generate scroll-stopping ad visuals for Facebook, Instagram, and YouTube with DALL-E powered image generation.",
    accent: "from-[hsl(40,90%,55%)] to-[hsl(25,85%,50%)]",
  },
  {
    icon: Film,
    title: "Scene-Based Video Ads",
    desc: "Create hook-first video ads with structured scenes: Hook, Problem, Solution, CTA. Powered by Runway ML.",
    accent: "from-[hsl(200,90%,50%)] to-[hsl(220,80%,60%)]",
  },
  {
    icon: Mic,
    title: "AI Voiceovers",
    desc: "Professional narration for your video ads with ElevenLabs voice generation. Multiple voices and tones.",
    accent: "from-[hsl(170,80%,45%)] to-[hsl(190,70%,50%)]",
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
      <Navbar />

      {/* Hero */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-sm font-medium text-primary mb-6">
              <Zap className="w-3.5 h-3.5" />
              AI Ad Campaign Generator
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            Generate complete paid social
            <br />
            <span className="bg-gradient-to-r from-primary to-pink-500 bg-clip-text text-transparent">
              ad campaigns in under 60 seconds
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
          >
            One input. Full campaigns for TikTok, Instagram, Facebook, and
            YouTube. Video ads, image ads, captions, hooks, and targeting
            suggestions - all AI-generated.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 justify-center mb-12"
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
          >
            <Button size="lg" className="text-base px-8 h-12" asChild>
              <Link to="/dashboard">
                <Play className="w-4 h-4 mr-2" />
                Start Generating Ads
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
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
            custom={4}
          >
            {platforms.map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-card/30 text-sm"
              >
                <Video className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium">{p.name}</span>
                <span className="text-muted-foreground text-xs">
                  {p.format}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            From idea to full campaign in three steps
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Describe Your Product",
                desc: 'Enter what you sell. Example: "Skincare product for acne-prone skin"',
              },
              {
                step: "2",
                title: "AI Generates Everything",
                desc: "Strategy, hooks, captions, image ads, video ads, voiceovers, and targeting suggestions.",
              },
              {
                step: "3",
                title: "Download & Launch",
                desc: "Export campaign-ready assets for TikTok, Instagram, Facebook, and YouTube.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center p-6 rounded-xl border border-border/50 bg-card/30"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            An AI advertising agency in software form
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="p-6 rounded-xl border border-border/50 bg-card/30 hover:border-primary/20 transition-colors"
                initial="hidden"
                animate={featuresInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={i}
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${f.accent} flex items-center justify-center mb-4`}
                >
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            From 1 Input, You Get:
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "3-5 Video Ads",
              "5 Image Ads",
              "Multiple Hooks",
              "Captions + Hashtags",
              "CTA Variations",
              "Audience Targeting",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 p-4 rounded-lg border border-border/50 bg-card/30"
              >
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground mb-12">
            Start free. Upgrade when you need more.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {pricingPreview.map((p) => (
              <div
                key={p.name}
                className={`px-6 py-4 rounded-xl border text-center min-w-[140px] ${
                  p.highlighted
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "border-border/50 bg-card/30"
                }`}
              >
                <div className="text-sm text-muted-foreground mb-1">
                  {p.name}
                </div>
                <div className="text-2xl font-bold">{p.price}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.desc}
                </div>
                {p.highlighted && (
                  <div className="mt-2">
                    <Star className="w-3.5 h-3.5 text-primary inline" />
                    <span className="text-xs text-primary ml-1">
                      Most Popular
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Button asChild>
            <Link to="/pricing">
              See Full Pricing <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Early Access CTA */}
      <section className="py-20 px-4 border-t border-border/30">
        <div className="container mx-auto max-w-xl text-center">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Get Early Access</h2>
          <p className="text-muted-foreground mb-6">
            Join the waitlist to be first in line when we launch.
          </p>
          {submitted ? (
            <div className="flex items-center justify-center gap-2 text-primary">
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
                className="flex-1"
                required
              />
              <Button type="submit" disabled={submitting}>
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
      </section>

      <SiteFooter />
    </div>
  );
}
