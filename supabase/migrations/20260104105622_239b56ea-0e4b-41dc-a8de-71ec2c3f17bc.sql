-- Create donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC NOT NULL,
  donor_name TEXT,
  donor_email TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  message TEXT,
  transaction_id TEXT,
  payment_method TEXT DEFAULT 'upi',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create donation_settings table
CREATE TABLE public.donation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id TEXT,
  qr_code_url TEXT,
  description TEXT,
  goal_amount NUMERIC,
  is_active BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create static_pages table
CREATE TABLE public.static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_published BOOLEAN DEFAULT true,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create banners table
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_type TEXT NOT NULL DEFAULT 'update',
  title TEXT,
  description TEXT,
  image_url TEXT,
  external_link TEXT,
  position TEXT DEFAULT 'home-hero',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  page TEXT,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB DEFAULT '{}',
  country TEXT,
  region TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add location fields to active_visitors
ALTER TABLE public.active_visitors ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.active_visitors ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE public.active_visitors ADD COLUMN IF NOT EXISTS city TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.static_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Donations policies
CREATE POLICY "Anyone can view donations" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Anyone can submit donations" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage donations" ON public.donations FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Donation settings policies
CREATE POLICY "Anyone can view donation settings" ON public.donation_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage donation settings" ON public.donation_settings FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Static pages policies
CREATE POLICY "Anyone can view published pages" ON public.static_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage pages" ON public.static_pages FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Banners policies
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT USING (is_active = true AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Analytics events policies
CREATE POLICY "System can insert events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view events" ON public.analytics_events FOR SELECT USING (has_role(auth.uid(), 'admin'));