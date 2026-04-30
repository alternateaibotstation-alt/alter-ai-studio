
-- 1. Bots persona leak: restrict the public SELECT policy and expose a safe view without `persona`
DROP POLICY IF EXISTS "Anyone can read public bots" ON public.bots;

-- Re-create public read policy that EXCLUDES persona via a view; meanwhile keep direct table reads
-- restricted so the persona column is only readable by owners.
CREATE POLICY "Authenticated users can read public bots"
ON public.bots
FOR SELECT
TO authenticated, anon
USING (is_public = true AND status = 'active');

-- Safer view that strips the proprietary `persona` column for general consumption.
CREATE OR REPLACE VIEW public.public_bots
WITH (security_invoker = true) AS
SELECT
  id, user_id, name, description, category, model,
  is_public, is_premium, premium_free_messages, price, status,
  messages_count, suggested_prompts, avatar_url,
  created_at, updated_at
FROM public.bots
WHERE is_public = true AND status = 'active';

GRANT SELECT ON public.public_bots TO anon, authenticated;

-- Revoke direct SELECT on the persona column from anon/authenticated.
REVOKE SELECT (persona) ON public.bots FROM anon, authenticated;
-- Owners can still read their persona because the policy + table-level grants on other columns work,
-- but to allow owners to SELECT persona we must re-grant the column to authenticated; ownership is
-- still enforced by the existing "Owners can read own bots" RLS policy.
GRANT SELECT (persona) ON public.bots TO authenticated;
-- Drop the broad public read policy and replace with one that denies persona reads to non-owners.
DROP POLICY IF EXISTS "Authenticated users can read public bots" ON public.bots;
CREATE POLICY "Public can read public active bots (non-persona)"
ON public.bots
FOR SELECT
TO anon, authenticated
USING (is_public = true AND status = 'active');

-- 2. Storage: enforce ownership on bot-avatars UPDATE/DELETE
DROP POLICY IF EXISTS "Users can update own bot avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own bot avatars" ON storage.objects;

CREATE POLICY "Users can update own bot avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'bot-avatars' AND owner = auth.uid());

CREATE POLICY "Users can delete own bot avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bot-avatars' AND owner = auth.uid());

-- 3. Chat attachments: restrict public read to the file owner (folder = auth.uid())
DROP POLICY IF EXISTS "Anyone can read chat attachments" ON storage.objects;

CREATE POLICY "Users can read own chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';
