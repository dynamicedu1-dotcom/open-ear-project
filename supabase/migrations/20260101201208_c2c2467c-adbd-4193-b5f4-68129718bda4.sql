-- Phase 1: User Profile Enhancement
-- Add new fields to user_profiles table for enhanced profiles

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS institute TEXT,
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS job_role TEXT,
ADD COLUMN IF NOT EXISTS contact_details JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS profile_type TEXT DEFAULT 'student',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT;

-- Add permissions column to team_members for feature-wise toggles
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"create_posts": true, "create_blogs": true, "pin_posts": true, "respond_comments": true}';

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-logos', 'partner-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile photos
CREATE POLICY "Anyone can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'profile-photos');

CREATE POLICY "Users can update profile photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can delete profile photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'profile-photos');

-- Storage policies for partner logos
CREATE POLICY "Anyone can view partner logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'partner-logos');

CREATE POLICY "Admins can upload partner logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'partner-logos');

CREATE POLICY "Admins can update partner logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'partner-logos');

CREATE POLICY "Admins can delete partner logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'partner-logos');