-- Create video storage bucket for team posts
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for videos bucket
CREATE POLICY "Public video access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'videos');

CREATE POLICY "Team can upload videos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Team can delete videos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'videos');

-- Add video_url column to voices table
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS video_url TEXT;