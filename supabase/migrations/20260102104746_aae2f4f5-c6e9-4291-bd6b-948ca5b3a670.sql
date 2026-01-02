-- Add blog_type enum
DO $$ BEGIN
  CREATE TYPE public.blog_type AS ENUM ('article', 'event', 'announcement', 'registration');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend weekly_blogs table
ALTER TABLE public.weekly_blogs
ADD COLUMN IF NOT EXISTS blog_type TEXT DEFAULT 'article',
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS event_location TEXT,
ADD COLUMN IF NOT EXISTS event_slots INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_fields JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS registration_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_registrations INTEGER,
ADD COLUMN IF NOT EXISTS team_can_edit BOOLEAN DEFAULT false;

-- Create blog_registrations table
CREATE TABLE IF NOT EXISTS public.blog_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_id UUID NOT NULL REFERENCES public.weekly_blogs(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  registration_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'unpaid',
  payment_reference TEXT,
  slots_booked INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.user_profiles(id),
  notes TEXT,
  contact_email TEXT,
  contact_name TEXT,
  contact_phone TEXT
);

-- Enable RLS on blog_registrations
ALTER TABLE public.blog_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_registrations
CREATE POLICY "Anyone can view their own registrations"
ON public.blog_registrations FOR SELECT
USING (true);

CREATE POLICY "Anyone can create registrations"
ON public.blog_registrations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own registrations"
ON public.blog_registrations FOR UPDATE
USING (user_profile_id IN (
  SELECT id FROM user_profiles WHERE session_token IS NOT NULL
));

CREATE POLICY "Admins can manage all registrations"
ON public.blog_registrations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_blog_registrations_blog_id ON public.blog_registrations(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_registrations_status ON public.blog_registrations(status);

-- Add platform setting for team blog access
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES ('team_blog_access', '{"enabled": true, "can_create": true, "can_edit_own": true, "requires_approval": false}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Enable realtime for registrations
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_registrations;