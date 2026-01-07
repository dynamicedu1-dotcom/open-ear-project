-- Create search_history table for tracking user searches
CREATE TABLE public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own search history" ON public.search_history 
FOR SELECT USING (auth.uid()::text = user_profile_id::text);

CREATE POLICY "Users can insert their own search history" ON public.search_history 
FOR INSERT WITH CHECK (auth.uid()::text = user_profile_id::text);

CREATE POLICY "Anyone can insert search history" ON public.search_history 
FOR INSERT WITH CHECK (true);