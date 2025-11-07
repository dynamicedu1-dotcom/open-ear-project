import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, ThumbsUp, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PostDetailDialog } from "./PostDetailDialog";

export const TrendingPostsSidebar = () => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data: trendingPosts } = useQuery({
    queryKey: ["trending-posts-sidebar"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_team_posts")
        .select("id, title, likes_count, hearts_count, support_count, comment_count, post_type")
        .eq("visibility", "public")
        .eq("status", "published")
        .order("trending_score", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  const postTypeIcons: Record<string, string> = {
    update: "💡",
    idea: "🚀",
    task: "✅",
    announcement: "📢",
  };

  return (
    <>
      <Card className="p-6 sticky top-6">
        <div className="flex items-center gap-2 mb-6">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-bold">Trending Now</h3>
        </div>

        {!trendingPosts || trendingPosts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trending posts yet</p>
        ) : (
          <div className="space-y-4">
            {trendingPosts.map((post, index) => {
              const totalEngagement = post.likes_count + post.hearts_count + post.support_count + post.comment_count;
              
              return (
                <div
                  key={post.id}
                  className="pb-4 border-b last:border-0 cursor-pointer hover:bg-accent/50 p-2 rounded transition-colors"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">
                          {postTypeIcons[post.post_type]}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {post.post_type}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm line-clamp-2 mb-2">
                        {post.title}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {post.likes_count + post.hearts_count + post.support_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          {post.comment_count}
                        </span>
                        <span className="ml-auto">
                          {totalEngagement} reactions
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <PostDetailDialog
        postId={selectedPostId}
        open={!!selectedPostId}
        onOpenChange={(open) => !open && setSelectedPostId(null)}
      />
    </>
  );
};
