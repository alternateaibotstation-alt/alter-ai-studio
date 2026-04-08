import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, Check, Zap, MessageSquare, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedHook {
  hooks: string[];
  caption: string;
  hashtags: string[];
}

export default function HookGenerator() {
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedHook | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generate = async () => {
    if (!product.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("content-studio", {
        body: {
          prompt: `Generate 5 scroll-stopping TikTok hooks, a viral caption, and 10 hashtags for selling: ${product.trim()}. Return JSON: { "hooks": ["hook1","hook2",...], "caption": "engaging caption text", "hashtags": ["tag1","tag2",...] }. Make hooks short, punchy, curiosity-driven. Caption should be conversational and include a soft CTA. Hashtags should mix broad and niche.`,
          platforms: ["tiktok"],
        },
      });
      if (error) throw error;
      const tiktok = data?.content?.tiktok;
      if (tiktok) {
        // The content-studio returns TikTok format, extract what we need
        setResult({
          hooks: tiktok.hooks || (tiktok.hook ? [tiktok.hook] : []),
          caption: tiktok.caption || "",
          hashtags: tiktok.hashtags || [],
        });
        toast.success("Hooks generated!");
      } else {
        throw new Error("No content generated");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to generate hooks");
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success("Copied!");
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="w-5 h-5 text-primary" /> Quick Hook Generator
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us what you're selling → get scroll-stopping hooks, a caption, and hashtags instantly.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="What are you selling? e.g. LED face mask, fitness app, handmade candles..."
            className="flex-1 bg-background text-base"
            onKeyDown={(e) => e.key === "Enter" && generate()}
          />
          <Button onClick={generate} disabled={loading || !product.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <><Sparkles className="w-4 h-4 mr-1.5" /> Generate</>
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-4 pt-2">
            {/* Hooks */}
            {result.hooks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-primary" /> Scroll-Stopping Hooks
                </h4>
                {result.hooks.map((hook, i) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <Badge variant="outline" className="shrink-0 text-xs">{i + 1}</Badge>
                    <p className="flex-1 text-foreground text-sm font-medium">{hook}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copy(hook, `hook-${i}`)}
                    >
                      {copiedField === `hook-${i}` ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Caption */}
            {result.caption && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-primary" /> Caption
                  </h4>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(result.caption, "caption")}>
                    {copiedField === "caption" ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">{result.caption}</p>
              </div>
            )}

            {/* Hashtags */}
            {result.hashtags.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-primary" /> Hashtags
                  </h4>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(result.hashtags.map(h => `#${h}`).join(" "), "hashtags")}>
                    {copiedField === "hashtags" ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map(h => (
                    <Badge key={h} variant="secondary" className="text-xs">#{h}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
