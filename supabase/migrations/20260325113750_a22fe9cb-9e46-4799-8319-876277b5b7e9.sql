
-- Create user_creations table
CREATE TABLE public.user_creations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  type text NOT NULL DEFAULT 'video',
  file_url text NOT NULL,
  thumbnail_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_creations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own creations" ON public.user_creations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own creations" ON public.user_creations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own creations" ON public.user_creations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('user-creations', 'user-creations', true);

-- Storage policies
CREATE POLICY "Users can upload own creations" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-creations' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can read creations" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-creations');

CREATE POLICY "Users can delete own creation files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'user-creations' AND (storage.foldername(name))[1] = auth.uid()::text);
