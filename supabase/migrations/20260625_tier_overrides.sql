-- Admin tier overrides: lets admins test any tier without Stripe
CREATE TABLE IF NOT EXISTS public.tier_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN ('free', 'starter', 'creator', 'pro', 'studio', 'power')),
  reason text,
  set_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.tier_overrides ENABLE ROW LEVEL SECURITY;

-- Users can read their own override
CREATE POLICY "Users can read own override"
ON public.tier_overrides FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all overrides
CREATE POLICY "Admins can read all overrides"
ON public.tier_overrides FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can insert/update/delete overrides
CREATE POLICY "Admins can manage overrides"
ON public.tier_overrides FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
