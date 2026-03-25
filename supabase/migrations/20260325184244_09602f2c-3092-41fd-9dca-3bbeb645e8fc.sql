-- Add is_public column to content_templates
ALTER TABLE public.content_templates ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Add creator name for display
ALTER TABLE public.content_templates ADD COLUMN use_count integer NOT NULL DEFAULT 0;

-- Allow anyone to read public templates
CREATE POLICY "Anyone can read public templates"
ON public.content_templates
FOR SELECT
TO public
USING (is_public = true);
