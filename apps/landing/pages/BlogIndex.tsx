import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";
import { ArrowRight, Clock } from "lucide-react";
import SiteFooter from "@/components/SiteFooter";

const blogPosts = [
  {
    slug: "ai-advertising-strategies-2025",
    title: "AI Advertising Strategies That Actually Work in 2025",
    excerpt:
      "Discover how AI-powered ad generation is transforming paid social. From hook-first video ads to automated campaign variations.",
    date: "2025-01-15",
    readTime: "6 min",
    category: "Strategy",
  },
  {
    slug: "tiktok-ad-creation-guide",
    title: "The Complete Guide to TikTok Ad Creation with AI",
    excerpt:
      "Learn how to create scroll-stopping TikTok ads using AI-generated scripts, scene-based video structure, and viral hooks.",
    date: "2025-01-10",
    readTime: "8 min",
    category: "TikTok",
  },
  {
    slug: "facebook-ad-automation",
    title: "Facebook Ad Automation: Generate Campaigns in 60 Seconds",
    excerpt:
      "How AI ad generators are replacing creative teams by producing full Facebook campaigns from a single product description.",
    date: "2025-01-05",
    readTime: "5 min",
    category: "Facebook",
  },
  {
    slug: "ai-marketing-tools-comparison",
    title: "Best AI Marketing Tools for Paid Social in 2025",
    excerpt:
      "A comparison of the top AI tools for ad campaign generation, image creation, voiceovers, and video production.",
    date: "2024-12-28",
    readTime: "7 min",
    category: "Tools",
  },
  {
    slug: "scene-based-video-ads",
    title: "Why Scene-Based Video Ads Convert 3x Better",
    excerpt:
      "The Hook-Problem-Solution-CTA structure is the most effective format for short-form video ads. Here's the data.",
    date: "2024-12-20",
    readTime: "4 min",
    category: "Video",
  },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog - Alterai.im | AI Advertising Insights"
        description="Learn about AI advertising strategies, TikTok ad creation, Facebook ad automation, and the latest AI marketing tools."
      />
      <Navbar />

      <div className="pt-28 pb-20 container mx-auto px-4 max-w-4xl">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Blog</h1>
        <p className="text-lg text-muted-foreground mb-12">
          AI advertising strategies, guides, and insights to grow your campaigns.
        </p>

        <div className="space-y-8">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="block group p-6 rounded-xl border border-border/50 bg-card/30 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(post.date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {post.excerpt}
              </p>
              <span className="text-sm font-medium text-primary flex items-center gap-1">
                Read more <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
