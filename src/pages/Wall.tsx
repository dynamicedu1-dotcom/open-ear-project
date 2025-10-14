import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceCard } from "@/components/VoiceCard";
import { FloatingVoiceButton } from "@/components/FloatingVoiceButton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Search, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Voice {
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  is_anonymous: boolean;
  username: string | null;
  support_count: number;
  comment_count: number;
}

const Wall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [moodFilter, setMoodFilter] = useState("all");

  const categories = ["all", "Education", "Pressure", "Future", "Skills", "Dreams", "Other"];
  const moods = ["all", "happy", "calm", "sad", "angry", "love"];

  useEffect(() => {
    fetchVoices();

    const channel = supabase
      .channel('wall-voices')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voices'
        },
        () => {
          fetchVoices();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryFilter, moodFilter, searchQuery]);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('voices')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }

      if (moodFilter !== "all") {
        query = query.eq('mood', moodFilter);
      }

      if (searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVoices((data || []) as Voice[]);
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupport = async (id: string) => {
    try {
      const voice = voices.find(v => v.id === id);
      if (!voice) return;

      const { error } = await supabase
        .from('voices')
        .update({ support_count: voice.support_count + 1 })
        .eq('id', id);

      if (error) throw error;

      setVoices(voices.map(v =>
        v.id === id ? { ...v, support_count: v.support_count + 1 } : v
      ));

      toast({
        title: "❤️ Support added",
        description: "Your support has been recorded!",
      });
    } catch (error) {
      console.error('Error adding support:', error);
    }
  };

  const handleVoiceClick = (id: string) => {
    toast({
      title: "Voice details",
      description: "Full voice view coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-warm py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-accent-glow bg-clip-text text-transparent">
              Opinion Wall
            </h1>
            <p className="text-lg text-foreground/80">
              Live Voices from Students
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voices..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Topics" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={moodFilter} onValueChange={setMoodFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood === "all" ? "All Moods" : mood.charAt(0).toUpperCase() + mood.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-card/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : voices.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-foreground/60 text-lg mb-6">
              No voices found. Try adjusting your filters or be the first to share!
            </p>
            <Button onClick={() => navigate("/share")} className="gradient-accent">
              Share Your Voice
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {voices.map((voice) => (
              <VoiceCard
                key={voice.id}
                id={voice.id}
                content={voice.content}
                mood={voice.mood}
                category={voice.category}
                isAnonymous={voice.is_anonymous}
                username={voice.username || undefined}
                supportCount={voice.support_count}
                commentCount={voice.comment_count}
                onSupport={handleSupport}
                onClick={handleVoiceClick}
              />
            ))}
          </div>
        )}
      </div>

      <FloatingVoiceButton />
    </div>
  );
};

export default Wall;
