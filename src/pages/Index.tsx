import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { VoiceCard } from "@/components/VoiceCard";
import { FloatingVoiceButton } from "@/components/FloatingVoiceButton";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Mic, TrendingUp, Heart, MessageSquare, LogIn, Shield, FileText, Code2 } from "lucide-react";
import { BannerDisplay } from "@/components/BannerDisplay";
import { WeeklyBlogSection } from "@/components/WeeklyBlogSection";
import { useToast } from "@/hooks/use-toast";
import VisitorCounter from "@/components/VisitorCounter";
import { ResponsiveLayout } from "@/layouts/ResponsiveLayout";
import { useIsMobile } from "@/hooks/useDeviceType";

interface Voice {
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  is_anonymous: boolean;
  username: string | null;
  support_count: number;
  comment_count: number;
  image_url?: string;
  created_at?: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [totalVoices, setTotalVoices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchVoices();
    fetchCount();

    const channel = supabase
      .channel('voices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'voices'
        },
        () => {
          fetchVoices();
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchVoices = async () => {
    try {
      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(isMobile ? 10 : 6);

      if (error) throw error;
      setVoices((data || []) as Voice[]);
    } catch (error) {
      console.error('Error fetching voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCount = async () => {
    try {
      const { count, error } = await supabase
        .from('voices')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      setTotalVoices(count || 0);
    } catch (error) {
      console.error('Error fetching count:', error);
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
    navigate(`/wall?voice=${id}`);
  };

  // Mobile Feed View
  if (isMobile) {
    return (
      <ResponsiveLayout mobileTitle="Your Voice" showStories={true}>
        {/* Mobile Feed */}
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-card/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-20 px-4">
              <p className="text-foreground/60 text-lg mb-6">
                No voices yet. Be the first to share!
              </p>
              <Button onClick={() => navigate("/share")} className="gradient-accent">
                <Mic className="mr-2 h-4 w-4" />
                Share Your Voice
              </Button>
            </div>
          ) : (
            <div className="space-y-4 p-4">
              {/* Quick Stats */}
              <div className="flex items-center justify-center gap-3 bg-card/50 rounded-xl p-3">
                <TrendingUp className="h-5 w-5 text-accent" />
                <span className="text-xl font-bold text-accent">{totalVoices.toLocaleString()}</span>
                <span className="text-foreground/70 text-sm">Voices Shared</span>
              </div>

              {/* Voice Feed */}
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/wall")}
              >
                View All Voices
              </Button>
            </div>
          )}
        </div>
      </ResponsiveLayout>
    );
  }

  // Desktop View (existing)
  return (
    <ResponsiveLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-warm py-20 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-glow to-accent-glow bg-clip-text text-transparent">
            Your Voice
          </h1>
          <p className="text-2xl md:text-3xl text-foreground/90 mb-4">
            Every Student Deserves to be Heard
          </p>
          <p className="text-lg text-foreground/70 mb-8 max-w-2xl mx-auto">
            Speak. Share. Change. — A platform by Dynamic Edu
          </p>

          <Button
            size="lg"
            className="gradient-accent shadow-accent-glow text-lg px-8 py-6 h-auto hover:scale-105 transition-transform"
            onClick={() => navigate("/share")}
          >
            <Mic className="mr-2 h-5 w-5" />
            Share Your Voice Now
          </Button>

          {/* Live Counter */}
          <div className="mt-12 inline-block bg-card/50 backdrop-blur-md rounded-2xl px-8 py-4 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-accent animate-pulse" />
              <span className="text-3xl font-bold text-accent">{totalVoices.toLocaleString()}</span>
              <span className="text-foreground/70">Voices Shared</span>
            </div>
          </div>
        </div>
      </section>

      {/* Banners */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <BannerDisplay position="home-hero" />
      </div>

      {/* Weekly Blog Section */}
      <WeeklyBlogSection />

      {/* Trending Voices */}
      <section className="py-16 px-6 bg-card/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-3">
            <MessageSquare className="h-8 w-8 text-accent" />
            Trending Voices
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-card/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : voices.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-foreground/60 text-lg mb-6">
                No voices yet. Be the first to share!
              </p>
              <Button onClick={() => navigate("/share")} className="gradient-accent">
                <Mic className="mr-2 h-4 w-4" />
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
                  imageUrl={voice.image_url}
                  createdAt={voice.created_at}
                  onSupport={handleSupport}
                  onClick={handleVoiceClick}
                  onLikeChange={fetchVoices}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="gradient-hero text-primary-foreground border-0"
              onClick={() => navigate("/wall")}
            >
              View All Voices
            </Button>
          </div>
        </div>
      </section>

      {/* We Hear You Section */}
      <section className="py-20 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6">📣 We Hear You</h2>
        <p className="text-lg text-foreground/80 mb-8">
          Your Voice is shaping the next generation of education. At Dynamic Edu,
          we don't just collect opinions — we act on them. Every voice matters,
          and together we're building a better future for students everywhere.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" onClick={() => navigate("/actions")}>
            See Our Actions
          </Button>
          <Button variant="outline" onClick={() => navigate("/contact")}>
            Reach Out to Us
          </Button>
        </div>
      </section>

      {/* Floating Action Button */}
      <FloatingVoiceButton />

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div>
              <h3 className="font-bold text-lg mb-4">Your Voice</h3>
              <p className="text-sm text-muted-foreground">
                A platform by Dynamic Edu where every student deserves to be heard.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/wall")}>
                  Opinion Wall
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/insights")}>
                  Insights
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/actions")}>
                  Action Hub
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Get in Touch</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/contact")}>
                  Contact Us
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/team")}>
                  Our Team
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/feedback")}>
                  Feedback
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/donate")}>
                  <Heart className="h-4 w-4 mr-1" />
                  Donate
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Legal</h3>
              <div className="flex flex-col gap-2">
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/terms")}>
                  <FileText className="h-4 w-4 mr-1" />
                  Terms & Policies
                </Button>
                <Button variant="link" className="h-auto p-0 justify-center md:justify-start" onClick={() => navigate("/about-developer")}>
                  <Code2 className="h-4 w-4 mr-1" />
                  About Developer
                </Button>
                <Button 
                  variant="link" 
                  className="h-auto p-0 justify-center md:justify-start flex items-center gap-2" 
                  onClick={() => navigate(user ? "/admin" : "/auth")}
                >
                  {user ? (
                    <>
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                © 2025 Dynamic Edu. All rights reserved.
              </p>
              <VisitorCounter />
            </div>
          </div>
        </div>
      </footer>
    </ResponsiveLayout>
  );
};

export default Index;