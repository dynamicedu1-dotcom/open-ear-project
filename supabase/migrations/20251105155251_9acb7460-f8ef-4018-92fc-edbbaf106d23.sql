-- Create topics table for dynamic voice categories
CREATE TABLE public.topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feedback_types table
CREATE TABLE public.feedback_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collaboration_types table (organization types)
CREATE TABLE public.collaboration_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collaboration_areas table
CREATE TABLE public.collaboration_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaboration_areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topics
CREATE POLICY "Anyone can view active topics"
ON public.topics FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage topics"
ON public.topics FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for feedback_types
CREATE POLICY "Anyone can view active feedback types"
ON public.feedback_types FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage feedback types"
ON public.feedback_types FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for collaboration_types
CREATE POLICY "Anyone can view active collaboration types"
ON public.collaboration_types FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage collaboration types"
ON public.collaboration_types FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for collaboration_areas
CREATE POLICY "Anyone can view active collaboration areas"
ON public.collaboration_areas FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage collaboration areas"
ON public.collaboration_areas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix feedback table RLS - add delete policy for admins
CREATE POLICY "Admins can delete feedback"
ON public.feedback FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed topics with current hardcoded values
INSERT INTO public.topics (name, display_order) VALUES
  ('Education Quality', 1),
  ('Mental Health', 2),
  ('Bullying', 3),
  ('Future Aspirations', 4),
  ('School Environment', 5),
  ('Other', 6);

-- Seed feedback_types
INSERT INTO public.feedback_types (name, description, display_order) VALUES
  ('general', 'General feedback about the platform', 1),
  ('collaboration', 'Collaboration and partnership requests', 2);

-- Seed collaboration_types (organization types)
INSERT INTO public.collaboration_types (name, display_order) VALUES
  ('Individual', 1),
  ('School', 2),
  ('NGO', 3),
  ('Business', 4),
  ('Other', 5);

-- Seed collaboration_areas
INSERT INTO public.collaboration_areas (name, display_order) VALUES
  ('Awareness Campaigns', 1),
  ('Skill Development', 2),
  ('Funding/Sponsorship', 3),
  ('Research Partnership', 4),
  ('Event Collaboration', 5),
  ('Other', 6);