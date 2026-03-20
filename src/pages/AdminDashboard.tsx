import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Bot, MessageSquare, DollarSign, TrendingUp,
  Image, Gift, Loader2, ShieldAlert, Crown, Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface PlatformStats {
  db: {
    total_users: number;
    total_bots: number;
    total_messages: number;
    active_bots: number;
    messages_today: number;
    messages_week: number;
    new_users_week: number;
    images_today: number;
    total_referrals: number;
    top_bots: { id: string; name: string; messages_count: number; category: string }[] | null;
    usage_by_day: { day: string; count: number }[] | null;
  };
  stripe: {
    active_subscribers: number;
    mrr: number;
    total_revenue: number;
    subscribers_by_tier: { pro: number; power: number };
    recent_charges: { amount: number; created: string; status: string; email: string }[];
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("admin-analytics");
      if (error || data?.error) {
        if (data?.error === "Unauthorized" || error?.message?.includes("403")) {
          setUnauthorized(true);
        } else {
          toast.error(data?.error || error?.message || "Failed to load analytics");
        }
        setLoading(false);
        return;
      }

      setStats(data);
      setLoading(false);
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
            <p className="text-muted-foreground">You don't have admin permissions to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { db, stripe } = stats;

  const statCards = [
    { label: "Total Users", value: db.total_users, icon: Users, color: "text-blue-500" },
    { label: "Active Subscribers", value: stripe.active_subscribers, icon: Crown, color: "text-primary" },
    { label: "MRR", value: `$${stripe.mrr.toFixed(0)}`, icon: DollarSign, color: "text-green-500" },
    { label: "Revenue (30d)", value: `$${stripe.total_revenue.toFixed(0)}`, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Total Messages", value: db.total_messages.toLocaleString(), icon: MessageSquare, color: "text-accent" },
    { label: "Messages Today", value: db.messages_today, icon: MessageSquare, color: "text-accent" },
    { label: "Active Bots", value: db.active_bots, icon: Bot, color: "text-purple-500" },
    { label: "Images Today", value: db.images_today, icon: Image, color: "text-orange-500" },
    { label: "New Users (7d)", value: db.new_users_week, icon: Users, color: "text-blue-400" },
    { label: "Messages (7d)", value: db.messages_week.toLocaleString(), icon: MessageSquare, color: "text-accent" },
    { label: "Referrals Completed", value: db.total_referrals, icon: Gift, color: "text-primary" },
    { label: "Total Bots", value: db.total_bots, icon: Bot, color: "text-purple-400" },
  ];

  const chartData = (db.usage_by_day || []).map((d) => ({
    date: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    messages: d.count,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-primary" />
              </div>
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Platform analytics and revenue overview</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <Zap className="w-3 h-3" /> Pro: {stripe.subscribers_by_tier.pro}
            </Badge>
            <Badge className="gap-1">
              <Crown className="w-3 h-3" /> Power: {stripe.subscribers_by_tier.power}
            </Badge>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <Card key={s.label} className="bg-card border-border">
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <span className="text-2xl font-bold text-foreground">{s.value}</span>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Messages Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Messages (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="messages" stroke="hsl(var(--primary))" fill="url(#msgGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top Bots */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Bots by Messages</CardTitle>
            </CardHeader>
            <CardContent>
              {db.top_bots && db.top_bots.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={db.top_bots.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="messages_count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No bots yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Charges */}
        {stripe.recent_charges.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Recent Charges (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stripe.recent_charges.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <span className="text-sm text-foreground font-medium">${c.amount.toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.status === "succeeded" ? "secondary" : "destructive"} className="text-xs">
                        {c.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(c.created).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
