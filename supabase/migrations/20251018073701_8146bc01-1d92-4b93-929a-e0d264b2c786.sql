-- Create table for tracking active visitors
CREATE TABLE public.active_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  last_seen timestamp with time zone DEFAULT now(),
  page text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.active_visitors ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can manage their sessions
CREATE POLICY "Users can manage their sessions" 
ON public.active_visitors 
FOR ALL 
USING (true);

-- Enable realtime for visitor tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_visitors;