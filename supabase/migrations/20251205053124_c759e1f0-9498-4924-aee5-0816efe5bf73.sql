-- Drop the view completely
DROP VIEW IF EXISTS public_user_profiles;

-- Recreate with explicit SECURITY INVOKER
CREATE VIEW public_user_profiles 
WITH (security_invoker = true)
AS
SELECT id, unique_id, display_name, is_anonymous, created_at
FROM user_profiles;

-- Grant select on the view
GRANT SELECT ON public_user_profiles TO anon, authenticated;