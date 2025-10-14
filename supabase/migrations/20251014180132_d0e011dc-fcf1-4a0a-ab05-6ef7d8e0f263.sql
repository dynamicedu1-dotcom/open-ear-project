-- Create voices table for student submissions
CREATE TABLE public.voices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'calm', 'sad', 'angry', 'love')),
  category TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT true,
  username TEXT,
  age TEXT,
  location TEXT,
  support_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create actions table for Dynamic Edu responses
CREATE TABLE public.actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  related_voices TEXT[],
  status TEXT NOT NULL CHECK (status IN ('ongoing', 'completed')),
  views INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create feedback table for contact/feedback messages
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('feedback', 'contact', 'collaboration')),
  organization TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.voices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Public read policies (anyone can view)
CREATE POLICY "Anyone can view voices" ON public.voices FOR SELECT USING (true);
CREATE POLICY "Anyone can view actions" ON public.actions FOR SELECT USING (true);

-- Public insert policies (anyone can submit)
CREATE POLICY "Anyone can submit voices" ON public.voices FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can submit feedback" ON public.feedback FOR INSERT WITH CHECK (true);

-- Public update for support count
CREATE POLICY "Anyone can update voice support" ON public.voices 
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voices_timestamp
  BEFORE UPDATE ON public.voices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.voices;