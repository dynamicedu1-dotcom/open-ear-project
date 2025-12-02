-- Phase 1: Social Features Database Migration
-- =============================================

-- 1. Create user_profiles table for email-only identity
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  display_name text,
  is_anonymous boolean DEFAULT true,
  session_token text UNIQUE,
  role text DEFAULT 'user' CHECK (role IN ('user', 'core_team', 'admin')),
  is_blocked boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create voice_likes table
CREATE TABLE IF NOT EXISTS public.voice_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id uuid NOT NULL REFERENCES public.voices(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(voice_id, user_profile_id)
);

-- 3. Create voice_reshares table
CREATE TABLE IF NOT EXISTS public.voice_reshares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id uuid NOT NULL REFERENCES public.voices(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  comment text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create pinned_voices table for Core Team pinning
CREATE TABLE IF NOT EXISTS public.pinned_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id uuid NOT NULL REFERENCES public.voices(id) ON DELETE CASCADE,
  pinned_by uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  pin_note text,
  pin_location text DEFAULT 'highlight' CHECK (pin_location IN ('highlight', 'noticeboard')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(voice_id, pinned_by)
);

-- 5. Create platform_settings table for admin toggles
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES public.user_profiles(id)
);

-- 6. Create user_activity table for tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('post', 'comment', 'like', 'reshare', 'pin')),
  target_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- 7. Add new columns to voices table
ALTER TABLE public.voices 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS user_profile_id uuid REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reshare_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- 8. Add new columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS user_profile_id uuid REFERENCES public.user_profiles(id),
ADD COLUMN IF NOT EXISTS parent_comment_id uuid REFERENCES public.comments(id),
ADD COLUMN IF NOT EXISTS is_core_team_reply boolean DEFAULT false;

-- 9. Enable RLS on all new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_reshares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for user_profiles
CREATE POLICY "Anyone can create a profile" ON public.user_profiles
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all profiles" ON public.user_profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
FOR UPDATE USING (session_token = current_setting('app.session_token', true));

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. RLS Policies for voice_likes
CREATE POLICY "Anyone can view likes" ON public.voice_likes
FOR SELECT USING (true);

CREATE POLICY "Users can add likes" ON public.voice_likes
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can remove their own likes" ON public.voice_likes
FOR DELETE USING (true);

-- 12. RLS Policies for voice_reshares
CREATE POLICY "Anyone can view reshares" ON public.voice_reshares
FOR SELECT USING (true);

CREATE POLICY "Users can create reshares" ON public.voice_reshares
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete their own reshares" ON public.voice_reshares
FOR DELETE USING (true);

-- 13. RLS Policies for pinned_voices
CREATE POLICY "Anyone can view pinned voices" ON public.pinned_voices
FOR SELECT USING (true);

CREATE POLICY "Core team can pin voices" ON public.pinned_voices
FOR INSERT WITH CHECK (true);

CREATE POLICY "Core team can unpin their pins" ON public.pinned_voices
FOR DELETE USING (true);

CREATE POLICY "Admins can manage all pins" ON public.pinned_voices
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. RLS Policies for platform_settings
CREATE POLICY "Anyone can view settings" ON public.platform_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.platform_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 15. RLS Policies for user_activity
CREATE POLICY "Users can view their own activity" ON public.user_activity
FOR SELECT USING (true);

CREATE POLICY "System can insert activity" ON public.user_activity
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all activity" ON public.user_activity
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 16. Function to update likes count on voices
CREATE OR REPLACE FUNCTION public.update_voice_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.voices SET likes_count = likes_count + 1 WHERE id = NEW.voice_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.voices SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.voice_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 17. Trigger for likes count
DROP TRIGGER IF EXISTS update_voice_likes_count_trigger ON public.voice_likes;
CREATE TRIGGER update_voice_likes_count_trigger
AFTER INSERT OR DELETE ON public.voice_likes
FOR EACH ROW EXECUTE FUNCTION public.update_voice_likes_count();

-- 18. Function to update reshare count on voices
CREATE OR REPLACE FUNCTION public.update_voice_reshare_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.voices SET reshare_count = reshare_count + 1 WHERE id = NEW.voice_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.voices SET reshare_count = GREATEST(reshare_count - 1, 0) WHERE id = OLD.voice_id;
  END IF;
  RETURN NULL;
END;
$$;

-- 19. Trigger for reshare count
DROP TRIGGER IF EXISTS update_voice_reshare_count_trigger ON public.voice_reshares;
CREATE TRIGGER update_voice_reshare_count_trigger
AFTER INSERT OR DELETE ON public.voice_reshares
FOR EACH ROW EXECUTE FUNCTION public.update_voice_reshare_count();

-- 20. Insert default platform settings
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
  ('posting_enabled', '{"enabled": true}'::jsonb),
  ('commenting_enabled', '{"enabled": true}'::jsonb),
  ('resharing_enabled', '{"enabled": true}'::jsonb),
  ('max_video_length_seconds', '{"value": 300}'::jsonb),
  ('top_liked_days', '{"value": 7}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- 21. Enable realtime for social tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voice_reshares;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pinned_voices;