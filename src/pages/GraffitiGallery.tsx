import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, SprayCan, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GraffitiItem {
  id: string;
  user_id: string;
  title: string;
  image_url: string;
  likes_count: number;
  created_at: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
}

export default function GraffitiGallery() {
  const [items, setItems] = useState<GraffitiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    loadGallery();
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      // Load user's likes
      const { data } = await supabase
        .from("graffiti_likes")
        .select("graffiti_id")
        .eq("user_id", user.id);
      if (data) {
        setLikedIds(new Set(data.map((d: any) => d.graffiti_id)));
      }
    }
  };

  const loadGallery = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("graffiti")
      .select("*, profiles(username, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Failed to load gallery");
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  const toggleLike = async (graffitiId: string) => {
    if (!userId) {
      toast.error("Log in to like graffiti");
      return;
    }
    setToggling(graffitiId);
    const isLiked = likedIds.has(graffitiId);

    if (isLiked) {
      await supabase
        .from("graffiti_likes")
        .delete()
        .eq("graffiti_id", graffitiId)
        .eq("user_id", userId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        next.delete(graffitiId);
        return next;
      });
      setItems((prev) =>
        prev.map((i) => i.id === graffitiId ? { ...i, likes_count: Math.max(0, i.likes_count - 1) } : i)
      );
    } else {
      await supabase
        .from("graffiti_likes")
        .insert({ graffiti_id: graffitiId, user_id: userId });
      setLikedIds((prev) => new Set(prev).add(graffitiId));
      setItems((prev) =>
        prev.map((i) => i.id === graffitiId ? { ...i, likes_count: i.likes_count + 1 } : i)
      );
    }
    setToggling(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto pt-24 pb-16 px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <SprayCan className="w-5 h-5 text-primary" />
              </div>
              Graffiti Gallery
            </h1>
            <p className="text-muted-foreground mt-2">
              Community creations from the Graffiti Studio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={loadGallery}>
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button size="sm" asChild>
              <Link to="/graffiti">
                <SprayCan className="w-4 h-4 mr-1" /> Create
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <SprayCan className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No graffiti yet</h2>
            <p className="text-muted-foreground mb-6">Be the first to share your creation!</p>
            <Button asChild>
              <Link to="/graffiti">Open Graffiti Studio</Link>
            </Button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="break-inside-avoid rounded-xl border border-border bg-card overflow-hidden group"
              >
                <div className="relative">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by {(item.profiles as any)?.username || "Anonymous"} · {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleLike(item.id)}
                    disabled={toggling === item.id}
                    className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors ${
                      likedIds.has(item.id)
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedIds.has(item.id) ? "fill-primary" : ""}`} />
                    {item.likes_count}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
