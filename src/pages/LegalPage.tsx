import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Navbar } from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";

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
