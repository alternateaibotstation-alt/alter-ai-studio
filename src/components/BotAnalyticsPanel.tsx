import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Users, MessageSquare, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BotAnalytics {
  bot_id: string;
  total_messages: number;
  unique_users: number;
  last_active: string | null;
}

interface Props {
  bots: { id: string; name: string; messages_count: number }[];
}

export default function BotAnalyticsPanel({ bots }: Props) {
  const [analytics, setAnalytics] = useState<BotAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase.rpc("get_bot_analytics", { owner_id: user.id });
      if (!error && data) setAnalytics(data as BotAnalytics[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (bots.length === 0) return null;

  const totalMessages = analytics.reduce((s, a) => s + a.total_messages, 0);
  const totalUsers = new Set(analytics.flatMap(() => [])).size; // unique across bots needs different approach
  const totalUniqueUsers = analytics.reduce((s, a) => s + a.unique_users, 0);

  const getAnalytics = (botId: string) => analytics.find((a) => a.bot_id === botId);

  return (
    <div className="mt-10">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-lg font-semibold text-foreground hover:text-primary transition-colors"
      >
        <BarChart3 className="w-5 h-5" />
        Analytics
        <span className="text-xs text-muted-foreground font-normal ml-1">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Total Messages
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : totalMessages.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Users className="w-3.5 h-3.5" />
                Unique Users
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : totalUniqueUsers.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Active Bots
              </div>
              <p className="text-2xl font-bold text-foreground">
                {loading ? "—" : analytics.length}
              </p>
            </div>
          </div>

          {/* Per-bot breakdown */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground border-b border-border bg-secondary/50">
              <span>Bot</span>
              <span className="text-center">Messages</span>
              <span className="text-center">Users</span>
              <span className="text-right">Last Active</span>
            </div>
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : bots.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">No bots yet</div>
            ) : (
              bots.map((bot) => {
                const stats = getAnalytics(bot.id);
                return (
                  <div key={bot.id} className="grid grid-cols-4 gap-2 px-4 py-3 text-sm border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <span className="font-medium text-foreground truncate">{bot.name}</span>
                    <span className="text-center text-muted-foreground">
                      {stats?.total_messages?.toLocaleString() ?? "0"}
                    </span>
                    <span className="text-center text-muted-foreground">
                      {stats?.unique_users?.toLocaleString() ?? "0"}
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {stats?.last_active
                        ? formatDistanceToNow(new Date(stats.last_active), { addSuffix: true })
                        : "Never"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
