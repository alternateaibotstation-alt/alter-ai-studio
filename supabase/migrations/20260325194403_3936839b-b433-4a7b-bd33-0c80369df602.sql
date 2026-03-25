-- Tighten user_roles: add explicit INSERT policy for admins only (prevents non-admin escalation)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can select all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin') OR auth.uid() = user_id);

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Restrict bot_reviews to authenticated reads only
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.bot_reviews;
CREATE POLICY "Authenticated users can read reviews"
ON public.bot_reviews
FOR SELECT
TO authenticated
USING (true);

-- Restrict graffiti_likes to authenticated reads only
DROP POLICY IF EXISTS "Anyone can read likes" ON public.graffiti_likes;
CREATE POLICY "Authenticated users can read likes"
ON public.graffiti_likes
FOR SELECT
TO authenticated
USING (true);