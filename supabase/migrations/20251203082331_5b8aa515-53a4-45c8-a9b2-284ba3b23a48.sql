-- Create weekly_blogs table for admin-managed blog posts
CREATE TABLE IF NOT EXISTS public.weekly_blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  cover_image_url text,
  author_name text DEFAULT 'Dynamic Edu',
  is_published boolean DEFAULT false,
  publish_date date,
  week_number integer,
  views_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on weekly_blogs
ALTER TABLE public.weekly_blogs ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_blogs
CREATE POLICY "Anyone can view published blogs"
ON public.weekly_blogs
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all blogs"
ON public.weekly_blogs
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add unique_id column to user_profiles for display (like User#1234)
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS unique_id text UNIQUE;

-- Create function to generate unique user ID
CREATE OR REPLACE FUNCTION public.generate_unique_user_id()
RETURNS TRIGGER AS $$
DECLARE
  new_unique_id text;
  counter integer := 0;
BEGIN
  -- Generate a unique ID like "User#1234"
  LOOP
    new_unique_id := 'User#' || (1000 + floor(random() * 9000))::integer::text;
    
    -- Check if this ID already exists
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE unique_id = new_unique_id) THEN
      NEW.unique_id := new_unique_id;
      EXIT;
    END IF;
    
    counter := counter + 1;
    -- Safety exit after 100 attempts
    IF counter > 100 THEN
      NEW.unique_id := 'User#' || extract(epoch from now())::integer::text;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-generate unique_id on insert
DROP TRIGGER IF EXISTS generate_user_unique_id ON public.user_profiles;
CREATE TRIGGER generate_user_unique_id
BEFORE INSERT ON public.user_profiles
FOR EACH ROW
WHEN (NEW.unique_id IS NULL)
EXECUTE FUNCTION public.generate_unique_user_id();

-- Update existing user_profiles that don't have a unique_id
UPDATE public.user_profiles
SET unique_id = 'User#' || (1000 + floor(random() * 9000))::integer::text
WHERE unique_id IS NULL;