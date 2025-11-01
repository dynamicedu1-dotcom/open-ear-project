-- Create storage bucket for team avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-avatars',
  'team-avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- RLS policies for team-avatars bucket
CREATE POLICY "Admins can upload team avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update team avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete team avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-avatars' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view team avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'team-avatars');