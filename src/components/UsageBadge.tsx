import { useSubscription } from "@/contexts/SubscriptionContext";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Image, Zap } from "lucide-react";

export default function UsageBadge() {
  const { tier, remainingMessages, remainingImages } = useSubscription();
  const msgs = remainingMessages();
  const imgs = remainingImages();

  if (tier === "power") return null;

  return (
    <div className="flex items-center gap-2">
      {tier === "free" && (
        <Badge variant="outline" className="text-xs gap-1 font-normal">
          <Zap className="w-3 h-3" /> Free
        </Badge>
      )}
      {msgs !== Infinity && (
        <Badge variant={msgs <= 3 ? "destructive" : "secondary"} className="text-xs gap-1 font-normal">
          <MessageSquare className="w-3 h-3" /> {msgs} left
        </Badge>
      )}
      {imgs !== Infinity && (
        <Badge variant={imgs === 0 ? "destructive" : "secondary"} className="text-xs gap-1 font-normal">
          <Image className="w-3 h-3" /> {imgs} img
        </Badge>
      )}
    </div>
  );
}
