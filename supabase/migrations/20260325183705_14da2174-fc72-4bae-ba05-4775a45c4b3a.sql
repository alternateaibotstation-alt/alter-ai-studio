CREATE TABLE public.content_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Untitled Template',
  prompt text NOT NULL DEFAULT '',
  platforms text[] NOT NULL DEFAULT '{}',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  story_profile jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own templates" ON public.content_templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own templates" ON public.content_templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.content_templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.content_templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);