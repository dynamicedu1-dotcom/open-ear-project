-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for blog image uploads (admins/team can upload)
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images');