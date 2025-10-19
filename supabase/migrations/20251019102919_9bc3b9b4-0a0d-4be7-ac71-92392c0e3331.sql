-- Add phone column to feedback table for collaboration outreach
ALTER TABLE public.feedback ADD COLUMN phone text;

-- Create partners table to showcase trusted organizations
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  description text,
  website text,
  testimonial text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Public can view active partners
CREATE POLICY "Anyone can view active partners" 
ON public.partners 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all partners
CREATE POLICY "Admins can manage partners" 
ON public.partners 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create team_members table for dynamic team management
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  whatsapp text NOT NULL,
  profile_image text,
  bio text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Public can view active team members
CREATE POLICY "Anyone can view active team members" 
ON public.team_members 
FOR SELECT 
USING (is_active = true);

-- Admins can manage all team members
CREATE POLICY "Admins can manage team members" 
ON public.team_members 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));