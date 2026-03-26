
-- 1. Fix graffiti_likes SELECT: restrict to own likes only
DROP POLICY IF EXISTS "Authenticated users can read likes" ON public.graffiti_likes;
CREATE POLICY "Users can read own likes"
ON public.graffiti_likes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Add trigger to prevent self-role-assignment in user_roles
CREATE OR REPLACE FUNCTION public.prevent_self_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent any user from assigning a role to themselves
  IF NEW.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_prevent_self_role_assignment
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_assignment();
