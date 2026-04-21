import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";

const descriptionMap: Record<string, string> = {
  "terms": "Read the Alterai.im Terms of Service governing use of our AI platform, accounts, content, and subscriptions.",
  "privacy": "Learn how Alterai.im collects, uses, and protects your personal data, creations, and chat history.",
  "cookies": "Details on cookies and similar technologies used by Alterai.im to operate, secure, and improve the platform.",
  "acceptable-use": "Rules for acceptable use of Alterai.im — what's allowed and prohibited on our AI creation platform.",
  "content-policy": "Alterai.im content policy: prohibited categories, TikTok-friendly outputs, and creator responsibilities.",
  "community": "Community Guidelines for creators, marketplace sellers, and chat users on Alterai.im.",
  "dmca": "DMCA takedown procedure for copyright complaints on Alterai.im content, bots, and templates.",
  "disclaimer": "Disclaimer about AI-generated content, accuracy, and limitations on Alterai.im.",
  "payment-policy": "Payment, subscription, refund, and payout policy for Alterai.im creators and customers.",
  "api-usage": "Acceptable API usage rules and limits for Alterai.im managed AI services.",
};

// Eagerly import all legal markdown files at build time
const legalFiles = import.meta.glob("/legal/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

const titleMap: Record<string, string> = {
  "terms": "Terms of Service",
  "privacy": "Privacy Policy",
  "cookies": "Cookie Policy",
  "acceptable-use": "Acceptable Use Policy",
  "content-policy": "Content Policy",
  "community": "Community Guidelines",
  "dmca": "DMCA Policy",
  "disclaimer": "Disclaimer",
  "payment-policy": "Payment & Refund Policy",
  "api-usage": "API Usage Policy",
};

const LegalPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    if (!slug) return;
    const key = `/legal/${slug}.md`;
    setContent(legalFiles[key] ?? "");
  }, [slug]);

  if (!slug || !titleMap[slug]) {
    return <Navigate to="/" replace />;
  }

  const title = titleMap[slug];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${title} — Alterai.im`}
        description={descriptionMap[slug] ?? `${title} for Alterai.im — official policy document.`}
        path={`/legal/${slug}`}
        type="article"
      />
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back home</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mt-4 mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Owner: Carley Lenon · Contact:{" "}
          <a className="hover:text-foreground underline" href="mailto:alternateaibotstation@gmail.com">
            alternateaibotstation@gmail.com
          </a>
        </p>
        <Card className="p-6 md:p-8">
          {content ? (
            <article className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary">
              <ReactMarkdown>{content}</ReactMarkdown>
            </article>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LegalPage;
