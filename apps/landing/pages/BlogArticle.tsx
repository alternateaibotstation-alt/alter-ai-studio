import { Link, useParams } from "react-router-dom";
import Navbar from "../../../src/components/Navbar";
import SiteFooter from "../../../src/components/SiteFooter";
import SEO from "../../../src/components/SEO";
import { Button } from "../../../src/components/ui/button";
import { ArrowRight } from "lucide-react";

const titles: Record<string, string> = {
  "tiktok-growth-ai-automation": "TikTok Growth with AI Automation",
  "creator-automation-stack": "The Creator Automation Stack",
  "ai-marketing-content-engine": "AI Marketing Content Engine Guide",
};

export default function BlogArticle() {
  const { slug = "ai-marketing-content-engine" } = useParams();
  const title = titles[slug] || "AI Marketing Content Engine Guide";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${title} — Alterai.im`} description="A practical AI marketing guide with internal links to signup, pricing, content tools, and creator automation workflows." path={`/blog/${slug}`} />
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28">
        <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-primary">
          <h1>{title}</h1>
          <p>AI content systems work best when they connect strategy, prompt structure, platform formatting, credit controls, and measurable conversion goals.</p>
          <h2>Build from a repeatable content workflow</h2>
          <p>Start with one offer, define the audience, generate platform-native hooks, then turn winning ideas into reusable templates and bots.</p>
          <h2>Use credits to protect margins</h2>
          <p>Every generation should check authentication, validate credit balance, deduct credits, and log usage before returning AI output.</p>
          <h2>Connect growth to signup intent</h2>
          <p>Internal links should guide readers from education into action: pricing, signup, content studio, bot builder, and templates.</p>
        </article>
        <div className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-bold text-foreground">Turn this strategy into content</h2>
          <p className="mt-2 text-muted-foreground">Use Alterai.im to generate scripts, captions, blogs, bots, and campaign assets from one prompt.</p>
          <Button asChild className="mt-5"><Link to="/auth">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
