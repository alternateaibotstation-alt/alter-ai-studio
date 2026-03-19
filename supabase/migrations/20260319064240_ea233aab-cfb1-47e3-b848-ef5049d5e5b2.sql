
CREATE OR REPLACE FUNCTION public.increment_bot_messages(bot_id_input UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.bots SET messages_count = messages_count + 1 WHERE id = bot_id_input;
$$;
