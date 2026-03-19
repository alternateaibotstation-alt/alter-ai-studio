-- Add avatar_url column to bots
ALTER TABLE public.bots ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create storage bucket for bot avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('bot-avatars', 'bot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to bot-avatars
CREATE POLICY "Authenticated users can upload bot avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'bot-avatars');

-- Allow anyone to view bot avatars (public bucket)
CREATE POLICY "Anyone can view bot avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'bot-avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own bot avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'bot-avatars');

-- Allow users to delete own bot avatars
CREATE POLICY "Users can delete own bot avatars"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'bot-avatars');