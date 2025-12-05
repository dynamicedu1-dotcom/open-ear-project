-- Add panel_password column to team_members for team panel auth
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS panel_password text DEFAULT null;

-- Add panel_enabled column to control access
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS panel_enabled boolean DEFAULT false;