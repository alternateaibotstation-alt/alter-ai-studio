import { Link } from "react-router-dom";
import Navbar from "../../../src/components/Navbar";
import SiteFooter from "../../../src/components/SiteFooter";
import SEO from "../../../src/components/SEO";
import { Button } from "../../../src/components/ui/button";
import { Badge } from "../../../src/components/ui/badge";
import { ArrowRight, BookOpen, TrendingUp } from "lucide-react";

const posts = [
  {
    slug: "tiktok-growth-ai-automation",
    title: "TikTok Growth with AI Automation",
    description: "Build repeatable hooks, scripts, captions, and posting workflows without losing creative control.",
    category: "TikTok Growth",
  },
  {
    slug: "creator-automation-stack",
    title: "The Creator Automation Stack",
    description: "How creators combine AI bots, content templates, and usage analytics to publish faster.",
    category: "Creator Automation",
  },
  {
    slug: "ai-marketing-content-engine",
    title: "AI Marketing Content Engine Guide",
    description: "A practical system for turning offers into platform-ready content across TikTok, Instagram, YouTube, and blogs.",
    category: "AI Marketing",
  },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SEO title="AI Marketing Blog — TikTok Growth & Automation" description="Guides for AI marketing, TikTok growth, creator automation, and scalable content systems from Alterai.im." path="/blog" />
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28">
        <section className="mb-10 max-w-3xl">
          <Badge variant="secondary" className="mb-4"><BookOpen className="mr-2 h-3.5 w-3.5" /> Growth library</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">AI marketing guides for creators who want scalable growth</h1>
          <p className="mt-4 text-lg text-muted-foreground">Learn how to turn one idea into high-converting TikTok scripts, social content, blog posts, and reusable creator systems.</p>
          <Button asChild className="mt-6"><Link to="/auth">Start creating <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="rounded-lg border border-border bg-card p-5">
              <Badge variant="outline" className="mb-4"><TrendingUp className="mr-2 h-3.5 w-3.5" />{post.category}</Badge>
              <h2 className="text-xl font-semibold text-foreground">{post.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{post.description}</p>
              <Link className="mt-5 inline-flex items-center text-sm font-medium text-primary" to={`/blog/${post.slug}`}>Read guide <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
