CREATE TABLE public.early_access_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.early_access_leads ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can submit a lead
CREATE POLICY "Anyone can submit early access lead"
ON public.early_access_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read leads
CREATE POLICY "Admins can read leads"
ON public.early_access_leads
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));