import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Calendar, DollarSign, Loader2 } from "lucide-react";

interface PurchaseWithBot {
  id: string;
  amount: number;
  created_at: string;
  bot_id: string;
  bots: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
  } | null;
}

export default function Purchases() {
  const [purchases, setPurchases] = useState<PurchaseWithBot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("purchases")
        .select("id, amount, created_at, bot_id, bots(id, name, description, category)")
        .order("created_at", { ascending: false });
      setPurchases((data as unknown as PurchaseWithBot[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Purchase History</h1>
        <p className="text-muted-foreground mb-8">Bots you've unlocked</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : purchases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground mb-4">You haven't purchased any bots yet.</p>
              <Button asChild>
                <Link to="/marketplace">Browse Marketplace</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => (
              <Card key={p.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {p.bots?.name ?? "Deleted Bot"}
                      </span>
                      {p.bots?.category && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {p.bots.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {p.amount.toFixed(2)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  {p.bots && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={`/chat/${p.bots.id}`}>
                        <MessageSquare className="w-4 h-4 mr-1" /> Chat
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
