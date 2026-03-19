import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft, Sparkles, Brain, Heart, Briefcase, TrendingUp, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import BotCard from "@/components/BotCard";
import { api, type Bot } from "@/lib/api";

const categories = [
  { key: "spiritual", label: "Spiritual", icon: Sparkles, description: "Explore mindfulness, meditation & spiritual growth" },
  { key: "mental health", label: "Mental Health", icon: Brain, description: "Support for anxiety, stress & emotional wellness" },
  { key: "relationships", label: "Relationships", icon: Heart, description: "Navigate love, dating & interpersonal connections" },
  { key: "business", label: "Business", icon: Briefcase, description: "Strategy, productivity & entrepreneurship tools" },
  { key: "self improvement", label: "Self Improvement", icon: TrendingUp, description: "Level up your habits, goals & personal growth" },
];

export default function Marketplace() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    api.getPublicBots()
      .then((data) => setBots(Array.isArray(data) ? data : []))
      .catch(() => setBots([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bots.filter((bot) => {
    const matchSearch =
      !search ||
      bot.name.toLowerCase().includes(search.toLowerCase()) ||
      bot.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !selectedCategory || bot.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const botsInCategory = (cat: string) => bots.filter((b) => b.category === cat).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4">
        <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground mt-1">Discover AI bots built by the community</p>

        {/* Search */}
        <div className="mt-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bots..."
            className="pl-9 bg-card border-border"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* If searching, show results directly */}
        {search ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"
            </p>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((bot) => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-12 text-center text-muted-foreground">
                No bots found. Try a different search.
              </div>
            )}
          </>
        ) : selectedCategory ? (
          /* Category detail view */
          <>
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 text-muted-foreground hover:text-foreground gap-1.5"
              onClick={() => setSelectedCategory(null)}
            >
              <ArrowLeft className="w-4 h-4" />
              All Categories
            </Button>
            <h2 className="text-2xl font-bold text-foreground mt-2 capitalize">{selectedCategory}</h2>
            {loading ? (
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-48 rounded-lg bg-card border border-border animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="mt-12 text-center text-muted-foreground">
                No bots in this category yet.
              </div>
            ) : (
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((bot) => (
                  <BotCard key={bot.id} bot={bot} />
                ))}
              </div>
            )}
          </>
        ) : (
          /* Category grid */
          <>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const count = botsInCategory(cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className="group rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.25)]"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{cat.label}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>
                    <p className="text-xs text-muted-foreground mt-3">
                      {loading ? "…" : `${count} bot${count !== 1 ? "s" : ""}`}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* All bots preview */}
            {!loading && bots.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-foreground mt-12 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  All Bots
                </h2>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bots.map((bot) => (
                    <BotCard key={bot.id} bot={bot} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
