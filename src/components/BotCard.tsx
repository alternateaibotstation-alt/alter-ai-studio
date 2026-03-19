import { Link } from "react-router-dom";
import { Bot as BotIcon, MessageSquare, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Bot } from "@/lib/api";

export default function BotCard({ bot }: { bot: Bot }) {
  const isFree = !bot.price || bot.price === 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5 card-hover flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-primary" />
        </div>
        {!isFree && (
          <span className="flex items-center gap-1 text-xs font-medium text-accent">
            <DollarSign className="w-3 h-3" />
            {bot.price}
          </span>
        )}
        {isFree && (
          <span className="text-xs font-medium text-accent">Free</span>
        )}
      </div>

      <div className="flex-1">
        <h3 className="font-semibold text-foreground text-sm">{bot.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
          {bot.description || "No description"}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageSquare className="w-3 h-3" />
          <span>{bot.messages_count ?? 0}</span>
          {bot.category && (
            <>
              <span className="mx-1">·</span>
              <span className="capitalize">{bot.category}</span>
            </>
          )}
        </div>
        <Button size="sm" variant="secondary" asChild>
          <Link to={`/chat/${bot.id}`}>Try Bot</Link>
        </Button>
      </div>
    </div>
  );
}
