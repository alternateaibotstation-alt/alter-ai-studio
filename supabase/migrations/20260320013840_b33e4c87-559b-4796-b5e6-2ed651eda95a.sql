
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: admins can read all roles, users can read own
CREATE POLICY "Admins can read all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

-- Only admins can insert/update/delete roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin analytics function: platform-wide usage stats
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_bots', (SELECT COUNT(*) FROM public.bots),
    'total_messages', (SELECT COUNT(*) FROM public.messages),
    'active_bots', (SELECT COUNT(*) FROM public.bots WHERE status = 'active'),
    'messages_today', (SELECT COUNT(*) FROM public.messages WHERE created_at >= CURRENT_DATE),
    'messages_week', (SELECT COUNT(*) FROM public.messages WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'new_users_week', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'),
    'top_bots', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT b.id, b.name, b.messages_count, b.category
        FROM public.bots b
        WHERE b.is_public = true
        ORDER BY b.messages_count DESC NULLS LAST
        LIMIT 10
      ) t
    ),
    'usage_by_day', (
      SELECT json_agg(row_to_json(t))
      FROM (
        SELECT DATE(created_at) as day, COUNT(*) as count
        FROM public.messages
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY day
      ) t
    ),
    'images_today', (
      SELECT COALESCE(SUM(images_used_today), 0) FROM public.user_usage
      WHERE last_reset_date = CURRENT_DATE
    ),
    'total_referrals', (SELECT COUNT(*) FROM public.referrals WHERE rewarded = true)
  ) INTO result;

  RETURN result;
END;
$$;
