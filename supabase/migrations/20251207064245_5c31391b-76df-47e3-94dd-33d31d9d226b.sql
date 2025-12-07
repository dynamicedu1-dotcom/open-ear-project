-- Create function to increment blog views safely
CREATE OR REPLACE FUNCTION increment_blog_views(blog_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE weekly_blogs SET views_count = COALESCE(views_count, 0) + 1 WHERE id = blog_uuid;
END;
$$;