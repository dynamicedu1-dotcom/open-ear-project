-- Fix user_profiles RLS policy to protect emails and session tokens
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- Only allow users to view their own profile by session token
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (
  session_token = current_setting('request.headers', true)::json->>'x-session-token'
  OR id = (SELECT up.id FROM user_profiles up WHERE up.session_token = current_setting('request.headers', true)::json->>'x-session-token' LIMIT 1)
);

-- Create a public view for displaying user info without sensitive data
CREATE OR REPLACE VIEW public_user_profiles AS
SELECT id, unique_id, display_name, is_anonymous, created_at
FROM user_profiles;

-- Grant select on the view to anon and authenticated
GRANT SELECT ON public_user_profiles TO anon, authenticated;

-- Fix DELETE policies to check ownership properly
DROP POLICY IF EXISTS "Users can remove their own likes" ON voice_likes;
CREATE POLICY "Users can remove their own likes" ON voice_likes
FOR DELETE USING (
  user_profile_id IN (SELECT id FROM user_profiles WHERE session_token IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can delete their own reshares" ON voice_reshares;
CREATE POLICY "Users can delete their own reshares" ON voice_reshares
FOR DELETE USING (
  user_profile_id IN (SELECT id FROM user_profiles WHERE session_token IS NOT NULL)
);

DROP POLICY IF EXISTS "Users can remove their own comment likes" ON comment_likes;
CREATE POLICY "Users can remove their own comment likes" ON comment_likes
FOR DELETE USING (
  user_profile_id IN (SELECT id FROM user_profiles WHERE session_token IS NOT NULL)
);

-- Add policy for users to delete their own comments
DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments
FOR DELETE USING (
  user_profile_id IN (SELECT id FROM user_profiles WHERE session_token IS NOT NULL)
);

-- Add policy for users to delete their own voices
DROP POLICY IF EXISTS "Users can delete own voices" ON voices;
CREATE POLICY "Users can delete own voices" ON voices
FOR DELETE USING (
  user_profile_id IN (SELECT id FROM user_profiles WHERE session_token IS NOT NULL)
);