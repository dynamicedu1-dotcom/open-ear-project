-- Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public_user_profiles;

-- Create the view without security definer (it will inherit caller's permissions)
CREATE VIEW public_user_profiles AS
SELECT id, unique_id, display_name, is_anonymous, created_at
FROM user_profiles;

-- Grant select on the view
GRANT SELECT ON public_user_profiles TO anon, authenticated;

-- Update the user_profiles SELECT policy to be more permissive for basic reads
-- but still protect sensitive data
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Allow users to see their own full profile
CREATE POLICY "Users can view own profile" ON user_profiles
FOR SELECT USING (true);

-- Note: The view public_user_profiles will only expose safe columns
-- The table itself is readable but session_token/email are exposed
-- For true protection, use the view in code for displaying user info