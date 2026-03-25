
CREATE TABLE public.video_style_presets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  style jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_style_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own presets" ON public.video_style_presets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presets" ON public.video_style_presets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presets" ON public.video_style_presets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own presets" ON public.video_style_presets
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
