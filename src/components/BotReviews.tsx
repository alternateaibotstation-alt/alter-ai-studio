import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles?: { username: string | null; avatar_url: string | null } | null;
}

function StarRating({
  value,
  onChange,
  readonly = false,
  size = "w-5 h-5",
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`${size} ${
              star <= (hover || value)
                ? "fill-accent text-accent"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function AverageRating({ botId }: { botId: string }) {
  const [avg, setAvg] = useState<number | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    supabase
      .from("bot_reviews")
      .select("rating")
      .eq("bot_id", botId)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const sum = data.reduce((a, r) => a + (r as any).rating, 0);
          setAvg(sum / data.length);
          setCount(data.length);
        }
      });
  }, [botId]);

  if (avg === null) return null;

  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-accent text-accent" />
      <span className="text-xs font-medium text-foreground">{avg.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
}

export default function BotReviews({ botId }: { botId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const myReview = reviews.find((r) => r.user_id === userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    loadReviews();
  }, [botId]);

  async function loadReviews() {
    const { data } = await supabase
      .from("bot_reviews")
      .select("id, rating, comment, created_at, user_id")
      .eq("bot_id", botId)
      .order("created_at", { ascending: false });
    if (data) {
      // Fetch usernames
      const userIds = [...new Set(data.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);
      setReviews(
        data.map((r: any) => ({
          ...r,
          profiles: profileMap.get(r.user_id) ?? null,
        }))
      );
    }
  }

  async function handleSubmit() {
    if (!userId || rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    setSubmitting(true);
    try {
      if (myReview) {
        await supabase
          .from("bot_reviews")
          .update({ rating, comment: comment || null })
          .eq("id", myReview.id);
      } else {
        await supabase.from("bot_reviews").insert({
          bot_id: botId,
          user_id: userId,
          rating,
          comment: comment || null,
        });
      }
      toast.success(myReview ? "Review updated" : "Review submitted");
      setShowForm(false);
      setRating(0);
      setComment("");
      await loadReviews();
    } catch {
      toast.error("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="border-t border-border/50 bg-card/50">
      <div className="max-w-[800px] mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">
            Reviews ({reviews.length})
          </h3>
          {userId && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (myReview) {
                  setRating(myReview.rating);
                  setComment(myReview.comment || "");
                }
                setShowForm(!showForm);
              }}
            >
              {myReview ? "Edit Review" : "Write Review"}
            </Button>
          )}
        </div>

        {showForm && (
          <div className="rounded-lg border border-border bg-card p-4 space-y-3">
            <StarRating value={rating} onChange={setRating} />
            <Textarea
              placeholder="Write a comment (optional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-background border-border text-sm resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={submitting || rating === 0}>
                {submitting ? "Submitting..." : myReview ? "Update" : "Submit"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-card p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground">
                      {r.profiles?.username || "Anonymous"}
                    </span>
                    <StarRating value={r.rating} readonly size="w-3 h-3" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-xs text-muted-foreground">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
