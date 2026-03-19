
-- Create storage bucket for chat file attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to chat-attachments
CREATE POLICY "Users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow anyone to read chat attachments (needed for bot to analyze)
CREATE POLICY "Anyone can read chat attachments"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'chat-attachments');

-- Allow users to delete their own chat attachments
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own messages (needed for clear chat)
CREATE POLICY "Users can delete own messages"
ON public.messages FOR DELETE TO authenticated
USING (auth.uid() = user_id);
