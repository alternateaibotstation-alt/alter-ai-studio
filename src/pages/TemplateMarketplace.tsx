import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search, Loader2, Download, BookTemplate, ArrowLeft,
  Copy, Check, Tag, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "facebook", label: "Facebook", icon: "📘" },
  { id: "pinterest", label: "Pinterest", icon: "📌" },
  { id: "linkedin", label: "LinkedIn", icon: "💼" },
  { id: "twitter", label: "Twitter/X", icon: "𝕏" },
];

const CATEGORIES = [
  { id: "all", label: "All", icon: "📋" },
  { id: "general", label: "General", icon: "✨" },
  { id: "marketing", label: "Marketing", icon: "📢" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "entertainment", label: "Entertainment", icon: "🎭" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "lifestyle", label: "Lifestyle", icon: "🌿" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "motivation", label: "Motivation", icon: "🔥" },
];

interface PublicTemplate {
  id: string;
  name: string;
  prompt: string;
  platforms: string[];
  content: Record<string, any>;
  story_profile: any;
  use_count: number;
  created_at: string;
  user_id: string;
  category: string;
}

export default function TemplateMarketplace() {
  const [templates, setTemplates] = useState<PublicTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchPublicTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("content_templates")
        .select("*")
        .eq("is_public", true)
        .order("use_count", { ascending: false });
      if (error) throw error;
      setTemplates((data as any[]) || []);
    } catch {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPublicTemplates();
  }, [fetchPublicTemplates]);

  const filtered = templates.filter(t => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.prompt.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.id] = cat.id === "all" ? templates.length : templates.filter(t => t.category === cat.id).length;
    return acc;
  }, {});

  const useTemplate = async (template: PublicTemplate) => {
    setImporting(template.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Sign in to use templates");
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("content_templates").insert({
        user_id: user.id,
        name: `${template.name} (copy)`,
        prompt: template.prompt,
        platforms: template.platforms,
        content: template.content,
        story_profile: template.story_profile,
        category: template.category,
        is_public: false,
      });
      if (error) throw error;

      await supabase.from("content_templates")
        .update({ use_count: (template.use_count || 0) + 1 })
        .eq("id", template.id);

      toast.success(`Saved "${template.name}" to your templates!`);
      setCopiedId(template.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to import template");
    } finally {
      setImporting(null);
    }
  };

  const getCategoryLabel = (id: string) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? `${cat.icon} ${cat.label}` : id;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-5xl">
        <Button variant="ghost" size="sm" className="mb-4 text-muted-foreground" onClick={() => navigate("/content-studio")}>
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Content Studio
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <BookTemplate className="w-7 h-7 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Template Marketplace</h1>
        </div>
        <p className="text-muted-foreground mb-6">Browse and use community-shared content templates</p>

        {/* Search + Category Filter */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary/15 text-primary border-primary/30 ring-1 ring-primary/20"
                    : "bg-muted/30 text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                {categoryCounts[cat.id] > 0 && (
                  <span className="text-[10px] opacity-60 ml-0.5">{categoryCounts[cat.id]}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookTemplate className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
            <p className="text-muted-foreground">
              {search || selectedCategory !== "all"
                ? "No templates match your filters."
                : "No public templates yet. Be the first to share one!"}
            </p>
            {(search || selectedCategory !== "all") && (
              <Button variant="ghost" size="sm" className="mt-3" onClick={() => { setSearch(""); setSelectedCategory("all"); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <Card key={t.id} className={`group border-border hover:border-primary/25 transition-all duration-200 ${t.user_id === "00000000-0000-0000-0000-000000000000" ? "ring-1 ring-primary/10" : ""}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {t.user_id === "00000000-0000-0000-0000-000000000000" && (
                        <Badge className="text-[9px] gap-0.5 bg-primary/15 text-primary border-primary/25 shrink-0 px-1.5 py-0">
                          <Sparkles className="w-2.5 h-2.5" /> Official
                        </Badge>
                      )}
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1">{t.name}</h3>
                    </div>
                    {t.use_count > 0 && (
                      <Badge variant="secondary" className="text-[10px] shrink-0 gap-1">
                        <Download className="w-2.5 h-2.5" /> {t.use_count}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{t.prompt}</p>

                  {/* Category + Platforms */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Tag className="w-2.5 h-2.5" /> {getCategoryLabel(t.category || "general")}
                    </Badge>
                    <div className="flex gap-1">
                      {(t.platforms || []).map((p: string) => {
                        const plat = PLATFORMS.find(x => x.id === p);
                        return plat ? (
                          <span key={p} className="text-xs bg-muted/50 px-1.5 py-0.5 rounded" title={plat.label}>
                            {plat.icon}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-[10px] text-muted-foreground mb-3">
                    shared {new Date(t.created_at).toLocaleDateString()}
                  </div>

                  {/* Use button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5"
                    onClick={() => useTemplate(t)}
                    disabled={importing === t.id}
                  >
                    {importing === t.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : copiedId === t.id ? (
                      <><Check className="w-3.5 h-3.5 text-accent" /> Saved!</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Use Template</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
