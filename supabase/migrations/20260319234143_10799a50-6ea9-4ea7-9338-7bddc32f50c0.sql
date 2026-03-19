
-- Function to get bot analytics for the bot owner
CREATE OR REPLACE FUNCTION public.get_bot_analytics(owner_id uuid)
RETURNS TABLE (
  bot_id uuid,
  total_messages bigint,
  unique_users bigint,
  last_active timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.bot_id,
    COUNT(*)::bigint AS total_messages,
    COUNT(DISTINCT m.user_id)::bigint AS unique_users,
    MAX(m.created_at) AS last_active
  FROM public.messages m
  INNER JOIN public.bots b ON b.id = m.bot_id
  WHERE b.user_id = owner_id
  GROUP BY m.bot_id;
$$;
