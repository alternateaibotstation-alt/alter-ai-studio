import { Link } from "react-router-dom";
import { Bot as BotIcon, MessageSquare, DollarSign, Heart, Share2, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AverageRating } from "@/components/BotReviews";
import type { Bot } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BotCardProps {
  bot: Bot;
  isFavorite?: boolean;
  onToggleFavorite?: (botId: string) => void;
}

export default function BotCard({ bot, isFavorite = false, onToggleFavorite }: BotCardProps) {
  const isFree = !bot.price || bot.price === 0;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}/chat/${bot.id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5 card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {bot.avatar_url ? (
            <img src={bot.avatar_url} alt={bot.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BotIcon className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleShare}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Share bot"
          >
            <Share2 className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
          {onToggleFavorite && (
            <button
              onClick={(e) => { e.preventDefault(); onToggleFavorite(bot.id); }}
              className="p-1 rounded-md hover:bg-muted transition-colors"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-colors",
                  isFavorite ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-400"
                )}
              />
            </button>
          )}
          {bot.is_premium && (
            <Badge className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
              <Crown className="w-3 h-3" /> Premium
            </Badge>
          )}
          {!isFree ? (
            <span className="flex items-center gap-1 text-xs font-medium text-accent">
              <DollarSign className="w-3 h-3" />{bot.price}
            </span>
          ) : !bot.is_premium ? (
            <span className="text-xs font-medium text-accent">Free</span>
          ) : null}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-sm">{bot.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {bot.description || "No description"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AverageRating botId={bot.id} />
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {bot.messages_count ?? 0}
          </span>
        </div>
        <Button size="sm" variant="secondary" asChild>
          <Link to={`/chat/${bot.id}`}>Try Bot</Link>
        </Button>
      </div>
    </div>
  );
}
