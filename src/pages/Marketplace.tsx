import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, ArrowLeft, Sparkles, Brain, Heart, Briefcase, TrendingUp, Star,
  Sun, Leaf, MessageCircleHeart, Rocket, Dumbbell, ChevronRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import BotCard from "@/components/BotCard";
import { api, type Bot } from "@/lib/api";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import chromeTexture from "@/assets/chrome-texture.jpg";

const categories = [
  {
    key: "spiritual",
    label: "Spiritual",
    icon: Sparkles,
    secondaryIcon: Sun,
    description: "Explore mindfulness, meditation & spiritual growth",
    gradient: "from-violet-500/20 to-indigo-500/20",
    accentColor: "text-violet-400",
    iconBg: "bg-violet-500/15 group-hover:bg-violet-500/25",
    borderHover: "hover:border-violet-400/40",
    glowColor: "hover:shadow-[0_0_40px_-10px_hsl(270_70%_60%/0.3)]",
  },
  {
    key: "mental health",
    label: "Mental Health",
    icon: Brain,
    secondaryIcon: Leaf,
    description: "Support for anxiety, stress & emotional wellness",
    gradient: "from-emerald-500/20 to-teal-500/20",
    accentColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 group-hover:bg-emerald-500/25",
    borderHover: "hover:border-emerald-400/40",
    glowColor: "hover:shadow-[0_0_40px_-10px_hsl(160_70%_50%/0.3)]",
  },
  {
    key: "relationships",
    label: "Relationships",
    icon: Heart,
    secondaryIcon: MessageCircleHeart,
    description: "Navigate love, dating & interpersonal connections",
    gradient: "from-rose-500/20 to-pink-500/20",
    accentColor: "text-rose-400",
    iconBg: "bg-rose-500/15 group-hover:bg-rose-500/25",
    borderHover: "hover:border-rose-400/40",
    glowColor: "hover:shadow-[0_0_40px_-10px_hsl(350_70%_55%/0.3)]",
  },
  {
    key: "business",
    label: "Business",
    icon: Briefcase,
    secondaryIcon: Rocket,
    description: "Strategy, productivity & entrepreneurship tools",
    gradient: "from-amber-500/20 to-orange-500/20",
    accentColor: "text-amber-400",
    iconBg: "bg-amber-500/15 group-hover:bg-amber-500/25",
    borderHover: "hover:border-amber-400/40",
    glowColor: "hover:shadow-[0_0_40px_-10px_hsl(40_80%_55%/0.3)]",
  },
  {
    key: "self improvement",
    label: "Self Improvement",
    icon: TrendingUp,
    secondaryIcon: Dumbbell,
    description: "Level up your habits, goals & personal growth",
    gradient: "from-cyan-500/20 to-blue-500/20",
    accentColor: "text-cyan-400",
    iconBg: "bg-cyan-500/15 group-hover:bg-cyan-500/25",
    borderHover: "hover:border-cyan-400/40",
    glowColor: "hover:shadow-[0_0_40px_-10px_hsl(190_80%_50%/0.3)]",
  },
];

export default function Marketplace() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const { isFavorite, toggleFavorite, favoriteIds } = useFavorites();

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
    const matchFav = !showFavorites || favoriteIds.includes(bot.id);
    return matchSearch && matchCat && matchFav;
  });

  const botsInCategory = (cat: string) => bots.filter((b) => b.category === cat).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-28 pb-8 px-4 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18] dark:opacity-[0.15] mix-blend-multiply dark:mix-blend-soft-light"
          style={{
            backgroundImage: `url(${chromeTexture})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 85%)",
          }}
        />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-[hsl(var(--primary)/0.10)] blur-[140px]" />
          <div className="absolute top-20 left-[10%] w-[400px] h-[400px] rounded-full bg-[hsl(var(--accent)/0.25)] blur-[120px]" />
        </div>
        <div className="container mx-auto relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.05]">
            <span className="text-copper">Marketplace</span>
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">Discover AI bots built by the community</p>
        </div>
      </section>
      <div className="container mx-auto pb-16 px-4">
        {/* Search & Favorites filter */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bots..."
              className="pl-9 bg-card border-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFavorites ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className="gap-1.5"
          >
            <Heart className={cn("w-4 h-4", showFavorites && "fill-current")} />
            Favorites
          </Button>
        </div>

        {search ? (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{search}&rdquo;
            </p>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((bot) => (
                <BotCard key={bot.id} bot={bot} isFavorite={isFavorite(bot.id)} onToggleFavorite={toggleFavorite} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="mt-12 text-center text-muted-foreground">
                No bots found. Try a different search.
              </div>
            )}
          </>
        ) : selectedCategory ? (
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
                  <BotCard key={bot.id} bot={bot} isFavorite={isFavorite(bot.id)} onToggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const SecondaryIcon = cat.secondaryIcon;
                const count = botsInCategory(cat.key);
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`group relative overflow-hidden rounded-xl border border-border bg-card text-left transition-all duration-300 ${cat.borderHover} ${cat.glowColor}`}
                  >
                    {/* Gradient background accent */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    {/* Decorative floating icon */}
                    <div className="absolute top-4 right-4 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity duration-300">
                      <SecondaryIcon className="w-20 h-20" />
                    </div>

                    <div className="relative p-6">
                      {/* Icon row */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-xl ${cat.iconBg} flex items-center justify-center transition-colors duration-300`}>
                          <Icon className={`w-6 h-6 ${cat.accentColor}`} />
                        </div>
                        <div className={`w-8 h-8 rounded-lg ${cat.iconBg} flex items-center justify-center transition-colors duration-300 opacity-60`}>
                          <SecondaryIcon className={`w-4 h-4 ${cat.accentColor}`} />
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-foreground">{cat.label}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{cat.description}</p>

                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {loading ? "…" : `${count} bot${count !== 1 ? "s" : ""}`}
                        </span>
                        <span className={`flex items-center gap-1 text-xs font-medium ${cat.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
                          Explore <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {!loading && bots.length > 0 && (
              <>
                <h2 className="text-xl font-bold text-foreground mt-12 flex items-center gap-2">
                  <Star className="w-5 h-5 text-primary" />
                  All Bots
                </h2>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bots.map((bot) => (
                    <BotCard key={bot.id} bot={bot} isFavorite={isFavorite(bot.id)} onToggleFavorite={toggleFavorite} />
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
