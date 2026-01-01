import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedPost {
  id: string;
  content: string;
  mood: string;
  username: string | null;
  likes_count: number;
  is_anonymous: boolean;
}

const moodColors: Record<string, string> = {
  happy: "from-yellow-400 to-orange-500",
  calm: "from-blue-400 to-cyan-500",
  sad: "from-gray-400 to-slate-500",
  angry: "from-red-400 to-rose-500",
  love: "from-pink-400 to-rose-500",
};

export function StoriesCarousel() {
  const navigate = useNavigate();

  const { data: featuredPosts } = useQuery({
    queryKey: ["featuredPosts"],
    queryFn: async () => {
      // Fetch pinned posts first
      const { data: pinned } = await supabase
        .from("pinned_voices")
        .select("voice_id, voices(*)")
        .limit(10);

      const pinnedVoices = pinned?.map((p: any) => ({
        ...p.voices,
        isPinned: true,
      })) || [];

      // Fetch top liked posts
      const { data: topPosts } = await supabase
        .from("voices")
        .select("*")
        .order("likes_count", { ascending: false })
        .limit(10);

      // Combine and deduplicate
      const allPosts = [...pinnedVoices];
      topPosts?.forEach((post) => {
        if (!allPosts.some((p) => p.id === post.id)) {
          allPosts.push(post);
        }
      });

      return allPosts.slice(0, 10) as (FeaturedPost & { isPinned?: boolean })[];
    },
  });

  const handlePostClick = (id: string) => {
    navigate(`/wall?voice=${id}`);
  };

  return (
    <div className="py-4 bg-background border-b border-border">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 px-4">
          {/* Create Story Button */}
          <button
            onClick={() => navigate("/share")}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/50">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <span className="text-[10px] text-muted-foreground">Your Story</span>
          </button>

          {/* Featured Posts */}
          {featuredPosts?.map((post) => {
            const isTeam = post.username?.startsWith("TEAM DYNAMIC");
            const displayName = post.is_anonymous
              ? "Anon"
              : post.username?.split(" ")[0]?.slice(0, 8) || "Student";

            return (
              <button
                key={post.id}
                onClick={() => handlePostClick(post.id)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-full p-0.5 bg-gradient-to-br",
                    moodColors[post.mood] || "from-primary to-accent"
                  )}
                >
                  <div className="w-full h-full rounded-full bg-background flex items-center justify-center text-2xl">
                    {post.mood === "happy" && "😃"}
                    {post.mood === "calm" && "😌"}
                    {post.mood === "sad" && "😞"}
                    {post.mood === "angry" && "😠"}
                    {post.mood === "love" && "❤️"}
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  <span className="text-[10px] text-foreground max-w-[60px] truncate">
                    {displayName}
                  </span>
                  {isTeam && (
                    <BadgeCheck className="h-3 w-3 text-emerald-500 fill-emerald-500/20" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </div>
  );
}