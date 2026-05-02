import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

const articles: Record<
  string,
  { title: string; content: string; date: string }
> = {
  "ai-advertising-strategies-2025": {
    title: "AI Advertising Strategies That Actually Work in 2025",
    date: "2025-01-15",
    content: `The advertising landscape has fundamentally changed. AI-powered campaign generators are now producing full multi-platform ad campaigns from a single product description in under 60 seconds.

## The Shift to AI-Generated Ads

Traditional creative teams spend weeks developing ad campaigns. With AI ad generators like Alterai.im, the entire process — from strategy to final assets — happens in seconds.

## Key Strategies

### 1. Hook-First Video Structure
Every video ad should follow the proven 4-scene structure: Hook (grab attention in 1-3 seconds), Problem (show the pain point), Solution (reveal your product), CTA (drive action).

### 2. Multi-Platform Optimization
AI automatically generates ad variations optimized for each platform's format — 9:16 for TikTok/Reels, 1:1 for Instagram/Facebook, and 16:9 for YouTube.

### 3. Emotional Angle Testing
AI generates campaigns using different emotional triggers — urgency, desire, social proof, transformation — so you can test which resonates with your audience.

## Getting Started

The fastest way to test AI-generated ads is to describe your product and let the system generate a full campaign. Start with text-only ads (free tier) and upgrade to images and video as you scale.

Ready to try it? [Get started with Alterai.im](/auth) and generate your first campaign in under 60 seconds.`,
  },
  "tiktok-ad-creation-guide": {
    title: "The Complete Guide to TikTok Ad Creation with AI",
    date: "2025-01-10",
    content: `TikTok ads are the fastest-growing paid social format. Here's how to create high-converting TikTok ads using AI.

## Why TikTok Ads?

TikTok's algorithm rewards engaging content regardless of follower count. This makes it the ideal platform for new product launches and direct-response advertising.

## The Perfect TikTok Ad Structure

### Scene 1: The Hook (0-3 seconds)
Your hook must stop the scroll. AI generates multiple hook variations using proven formulas: "POV:", "Stop scrolling if...", "Nobody talks about...", "Wait until you see...".

### Scene 2: The Problem (3-6 seconds)
Show the pain point your audience faces. Make it relatable and specific.

### Scene 3: The Solution (6-10 seconds)
Reveal your product as the answer. Use product shots, demonstrations, or transformation visuals.

### Scene 4: The CTA (10-15 seconds)
Drive action with a clear call-to-action. "Link in bio", "Shop now", "Limited time only".

## AI-Generated TikTok Campaigns

With Alterai.im, you can generate complete TikTok ad campaigns — scripts, hooks, captions, hashtags, and even AI voiceovers — from a single product description.

[Start creating TikTok ads now](/auth)`,
  },
  "facebook-ad-automation": {
    title: "Facebook Ad Automation: Generate Campaigns in 60 Seconds",
    date: "2025-01-05",
    content: `Facebook advertising remains one of the most powerful channels for paid social. AI is making it faster and cheaper to create high-converting campaigns.

## The Problem with Traditional Facebook Ads

Creating effective Facebook ads requires copywriters, designers, and strategists. Most small businesses can't afford this. AI changes that equation entirely.

## How AI Ad Generation Works

1. **Input**: Describe your product or service in one sentence
2. **Strategy**: AI analyzes your input and generates a campaign strategy with audience targeting and emotional angles
3. **Assets**: AI creates ad copy (headlines, primary text, descriptions), image ads, and campaign variations
4. **Optimization**: Multiple CTA variations and audience targeting suggestions are generated automatically

## Best Practices

- Test at least 3-5 different hooks
- Use AI-generated image ads alongside your own product photos
- Let the platform optimize — upload multiple variations
- Start with the 1:1 format for Facebook feed placement

[Generate your first Facebook campaign](/auth)`,
  },
  "ai-marketing-tools-comparison": {
    title: "Best AI Marketing Tools for Paid Social in 2025",
    date: "2024-12-28",
    content: `The AI marketing tools landscape is evolving rapidly. Here's what to look for in an AI ad campaign generator.

## What to Look For

### 1. Full Campaign Generation
The best tools generate complete campaigns from a single input — not just one caption or one image, but an entire multi-platform strategy.

### 2. Multi-Format Output
Your tool should generate assets for all major platforms: TikTok (9:16), Instagram (9:16 + 1:1), Facebook (1:1 + 16:9), and YouTube (16:9).

### 3. Cost Control
AI generation costs vary. Look for credit-based billing systems that let you control spending and scale gradually.

### 4. Scene-Based Video
For video ads, the tool should use structured scene-based output (Hook, Problem, Solution, CTA) that can later be edited and refined.

## Alterai.im

Alterai.im is built specifically for ad campaign generation. It combines AI text, image (DALL-E), voice (ElevenLabs), and video (Runway ML) generation into a single workflow.

[Try Alterai.im free](/auth)`,
  },
  "scene-based-video-ads": {
    title: "Why Scene-Based Video Ads Convert 3x Better",
    date: "2024-12-20",
    content: `Data from over 10,000 ad campaigns shows that structured, scene-based video ads outperform unstructured content by 3x on average.

## The 4-Scene Structure

### Hook (1-3 seconds)
The first 3 seconds determine whether someone watches or scrolls past. AI can generate dozens of hook variations for testing.

### Problem (2-3 seconds)
Show the pain point. Make the viewer feel understood. This creates emotional engagement.

### Solution (3-4 seconds)
Reveal your product. Keep it visual. Show the product in action, not just the product itself.

### CTA (2-3 seconds)
Clear, urgent, and specific. "Shop now - 20% off today only" outperforms "Learn more" by 2.5x.

## Why Structure Matters

Structured ads are predictable, testable, and optimizable. You can swap individual scenes, test different hooks, and iterate on CTAs without rebuilding the entire ad.

## Building Scene-Based Ads with AI

Alterai.im automatically structures every video ad into scenes. This makes your campaigns future-ready for CapCut-style editing and scene-level optimization.

[Generate scene-based video ads](/auth)`,
  },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? articles[slug] : undefined;

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 pb-20 container mx-auto px-4 max-w-3xl text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <Button asChild>
            <Link to="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${article.title} - Alterai.im Blog`} description={article.content.substring(0, 160)} />
      <Navbar />

      <article className="pt-28 pb-20 container mx-auto px-4 max-w-3xl">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Blog
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
          {article.title}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {new Date(article.date + "T00:00:00").toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary prose-strong:text-foreground prose-li:text-muted-foreground">
          <ReactMarkdown>{article.content}</ReactMarkdown>
        </div>

        <div className="mt-12 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <h3 className="font-bold text-lg mb-2">
            Ready to generate your first campaign?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start free. No credit card required.
          </p>
          <Button asChild>
            <Link to="/auth">
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </article>

      <SiteFooter />
    </div>
  );
}
