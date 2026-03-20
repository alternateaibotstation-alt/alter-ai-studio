
-- Graffiti creations table
CREATE TABLE public.graffiti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  image_url TEXT NOT NULL,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Anyone can view public gallery
ALTER TABLE public.graffiti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read graffiti" ON public.graffiti
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own graffiti" ON public.graffiti
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own graffiti" ON public.graffiti
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE public.graffiti_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  graffiti_id UUID REFERENCES public.graffiti(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(graffiti_id, user_id)
);

ALTER TABLE public.graffiti_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read likes" ON public.graffiti_likes
  FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert own likes" ON public.graffiti_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.graffiti_likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.update_graffiti_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.graffiti SET likes_count = likes_count + 1 WHERE id = NEW.graffiti_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.graffiti SET likes_count = likes_count - 1 WHERE id = OLD.graffiti_id;
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER graffiti_likes_trigger
  AFTER INSERT OR DELETE ON public.graffiti_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_graffiti_likes_count();

-- Storage bucket for graffiti images
INSERT INTO storage.buckets (id, name, public) VALUES ('graffiti', 'graffiti', true);

CREATE POLICY "Anyone can read graffiti images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'graffiti');

CREATE POLICY "Authenticated users can upload graffiti" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'graffiti');

CREATE POLICY "Users can delete own graffiti images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'graffiti' AND (storage.foldername(name))[1] = auth.uid()::text);
