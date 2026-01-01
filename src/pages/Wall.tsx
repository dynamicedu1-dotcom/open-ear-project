import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceCard } from "@/components/VoiceCard";
import { ResharedVoiceCard } from "@/components/ResharedVoiceCard";
import { FloatingVoiceButton } from "@/components/FloatingVoiceButton";
import { VoiceDetailDialog } from "@/components/VoiceDetailDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsiveLayout } from "@/layouts/ResponsiveLayout";
import { useIsMobile } from "@/hooks/useDeviceType";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface Voice {
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  is_anonymous: boolean;
  username: string | null;
  support_count: number;
  comment_count: number;
  likes_count?: number;
  reshare_count?: number;
  image_url?: string;
  created_at: string;
}

interface Reshare {
  id: string;
  voice_id: string;
  comment: string | null;
  created_at: string;
  user_profile: {
    display_name: string | null;
    unique_id: string | null;
  } | null;
  voice: Voice;
}

const Wall = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [reshares, setReshares] = useState<Reshare[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "all"
  );
  const [moodFilter, setMoodFilter] = useState("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const categories = ["all", "Education", "Pressure", "Future", "Skills", "Dreams", "Other"];
  const moods = ["all", "happy", "calm", "sad", "angry", "love"];

  useEffect(() => {
    fetchVoices();
    fetchReshares();
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voice_reshares'
        },
        () => {
          fetchReshares();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryFilter, moodFilter, searchQuery]);

  const fetchReshares = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_reshares')
        .select(`
          id,
          voice_id,
          comment,
          created_at,
          user_profile:user_profiles!voice_reshares_user_profile_id_fkey(display_name, unique_id),
          voice:voices!voice_reshares_voice_id_fkey(*)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const validReshares = (data || []).filter((r: any) => r.voice) as Reshare[];
      setReshares(validReshares);
    } catch (error) {
      console.error('Error fetching reshares:', error);
    }
  };

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

  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const voiceParam = searchParams.get('voice');
    if (voiceParam && voices.some(v => v.id === voiceParam)) {
      setSelectedVoiceId(voiceParam);
      setDialogOpen(true);
    }
  }, [searchParams, voices]);

  const handleVoiceClick = (id: string) => {
    setSelectedVoiceId(id);
    setDialogOpen(true);
  };

  const activeFiltersCount = (categoryFilter !== "all" ? 1 : 0) + (moodFilter !== "all" ? 1 : 0);

  // Mobile Filters Sheet
  const MobileFilters = () => (
    <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <SlidersHorizontal className="h-4 w-4" />
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[50vh] rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Filter Voices</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <Select value={categoryFilter} onValueChange={(val) => {
              setCategoryFilter(val);
              setFilterSheetOpen(false);
            }}>
              <SelectTrigger>
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Mood</label>
            <Select value={moodFilter} onValueChange={(val) => {
              setMoodFilter(val);
              setFilterSheetOpen(false);
            }}>
              <SelectTrigger>
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
          {activeFiltersCount > 0 && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setCategoryFilter("all");
                setMoodFilter("all");
                setFilterSheetOpen(false);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <ResponsiveLayout mobileTitle="Opinion Wall">
      {/* Mobile Header with Search */}
      {isMobile ? (
        <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voices..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <MobileFilters />
          </div>
        </div>
      ) : (
        <div className="gradient-warm py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 animate-fade-in">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-accent-glow bg-clip-text text-transparent">
                Opinion Wall
              </h1>
              <p className="text-lg text-foreground/80">
                Live Voices from Students
              </p>
            </div>

            {/* Desktop Filters */}
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
      )}

      <div className={isMobile ? "p-4" : "max-w-7xl mx-auto px-6 py-12"}>
        {/* Reshares Section */}
        {reshares.length > 0 && !isMobile && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 text-foreground/90">Recently Reshared</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reshares.slice(0, 6).map((reshare) => (
                <ResharedVoiceCard
                  key={reshare.id}
                  reshareId={reshare.id}
                  resharedByName={reshare.user_profile?.display_name || "Someone"}
                  resharedByUniqueId={reshare.user_profile?.unique_id || null}
                  reshareComment={reshare.comment}
                  resharedAt={reshare.created_at}
                  voiceId={reshare.voice.id}
                  content={reshare.voice.content}
                  mood={reshare.voice.mood}
                  category={reshare.voice.category}
                  isAnonymous={reshare.voice.is_anonymous}
                  username={reshare.voice.username || undefined}
                  supportCount={reshare.voice.support_count || 0}
                  commentCount={reshare.voice.comment_count || 0}
                  likesCount={reshare.voice.likes_count || 0}
                  reshareCount={reshare.voice.reshare_count || 0}
                  imageUrl={reshare.voice.image_url}
                  createdAt={reshare.voice.created_at}
                  onClick={handleVoiceClick}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Voices */}
        {!isMobile && (
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">All Voices</h2>
        )}
        
        {loading ? (
          <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
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
          <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up"}>
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
                imageUrl={voice.image_url}
                createdAt={voice.created_at}
                onSupport={handleSupport}
                onClick={handleVoiceClick}
                onLikeChange={fetchVoices}
              />
            ))}
          </div>
        )}
      </div>

      {!isMobile && <FloatingVoiceButton />}
      
      <VoiceDetailDialog 
        voiceId={selectedVoiceId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </ResponsiveLayout>
  );
};

export default Wall;