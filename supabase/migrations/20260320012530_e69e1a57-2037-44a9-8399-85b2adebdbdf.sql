
-- User usage tracking table
CREATE TABLE public.user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  messages_used_today integer NOT NULL DEFAULT 0,
  images_used_today integer NOT NULL DEFAULT 0,
  bonus_messages integer NOT NULL DEFAULT 0,
  last_reset_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own usage" ON public.user_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.user_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage" ON public.user_usage
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid,
  referral_code text NOT NULL UNIQUE,
  rewarded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Anyone can read referral by code" ON public.referrals
  FOR SELECT TO public USING (true);

-- Function to get or create usage record with daily reset
CREATE OR REPLACE FUNCTION public.get_or_reset_usage(p_user_id uuid)
RETURNS public.user_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_row public.user_usage;
BEGIN
  SELECT * INTO usage_row FROM public.user_usage WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, messages_used_today, images_used_today, last_reset_date)
    VALUES (p_user_id, 0, 0, CURRENT_DATE)
    RETURNING * INTO usage_row;
  ELSIF usage_row.last_reset_date < CURRENT_DATE THEN
    UPDATE public.user_usage 
    SET messages_used_today = 0, images_used_today = 0, last_reset_date = CURRENT_DATE
    WHERE user_id = p_user_id
    RETURNING * INTO usage_row;
  END IF;
  
  RETURN usage_row;
END;
$$;

-- Function to increment usage
CREATE OR REPLACE FUNCTION public.increment_usage(p_user_id uuid, p_type text)
RETURNS public.user_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  usage_row public.user_usage;
BEGIN
  -- First ensure record exists and is reset
  PERFORM public.get_or_reset_usage(p_user_id);
  
  IF p_type = 'message' THEN
    UPDATE public.user_usage SET messages_used_today = messages_used_today + 1
    WHERE user_id = p_user_id RETURNING * INTO usage_row;
  ELSIF p_type = 'image' THEN
    UPDATE public.user_usage SET images_used_today = images_used_today + 1
    WHERE user_id = p_user_id RETURNING * INTO usage_row;
  END IF;
  
  RETURN usage_row;
END;
$$;
