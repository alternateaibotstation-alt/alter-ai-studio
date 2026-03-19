import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Heart, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useFavorites } from "@/hooks/use-favorites";

export default function FavoritesSection() {
  const { data: favBots = [], isLoading } = useQuery({
    queryKey: ["favorite-bots"],
    queryFn: api.getFavoriteBots,
    staleTime: 30_000,
  });
  const { toggleFavorite } = useFavorites();

  if (isLoading) {
    return (
      <div className="mt-10">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Heart className="w-5 h-5 text-destructive" /> My Favorites
        </h2>
        <div className="mt-4 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (favBots.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <Heart className="w-5 h-5 text-destructive" /> My Favorites
      </h2>
      <div className="mt-4 space-y-3">
        {favBots.map((bot) => (
          <div
            key={bot.id}
            className="rounded-lg border border-border bg-card p-4 flex items-center justify-between card-hover"
          >
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm">{bot.name}</h3>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="capitalize">{bot.category}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {bot.messages_count ?? 0}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavorite(bot.id)}
                title="Remove from favorites"
              >
                <Heart className="w-4 h-4 fill-destructive text-destructive" />
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link to={`/chat/${bot.id}`}>Chat</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
