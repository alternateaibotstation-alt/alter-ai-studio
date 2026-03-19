
-- Create bot_reviews table
CREATE TABLE public.bot_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bot_id, user_id)
);

ALTER TABLE public.bot_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read reviews
CREATE POLICY "Anyone can read reviews" ON public.bot_reviews
  FOR SELECT TO public USING (true);

-- Authenticated users can insert their own review
CREATE POLICY "Users can insert own reviews" ON public.bot_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Users can update their own review
CREATE POLICY "Users can update own reviews" ON public.bot_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Users can delete their own review
CREATE POLICY "Users can delete own reviews" ON public.bot_reviews
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
