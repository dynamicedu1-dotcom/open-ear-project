import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Heart, TrendingUp, MessageCircle, Pin } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PostDetailDialog } from "./PostDetailDialog";

interface PublicPostCardProps {
  post: any;
}

const postTypeIcons: Record<string, string> = {
  update: "💡",
  idea: "🚀",
  task: "✅",
  announcement: "📢",
};

const postTypeColors: Record<string, string> = {
  update: "bg-blue-500/10 text-blue-500",
  idea: "bg-purple-500/10 text-purple-500",
  task: "bg-orange-500/10 text-orange-500",
  announcement: "bg-green-500/10 text-green-500",
};

export const PublicPostCard = ({ post }: PublicPostCardProps) => {
  const { toast } = useToast();
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [localLikes, setLocalLikes] = useState(post.likes_count);
  const [localHearts, setLocalHearts] = useState(post.hearts_count);
  const [localSupport, setLocalSupport] = useState(post.support_count);

  const excerpt = post.content.length > 250 ? post.content.slice(0, 250) + "..." : post.content;
  const author = post.author?.team_member;

  const handleReaction = async (type: "like" | "heart" | "support") => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to react to posts.",
          variant: "destructive",
        });
        return;
      }

      // Check if already reacted
      const { data: existing } = await supabase
        .from("post_reactions")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .eq("reaction_type", type)
        .single();

      if (existing) {
        // Remove reaction
        await supabase
          .from("post_reactions")
          .delete()
          .eq("id", existing.id);

        if (type === "like") setLocalLikes(prev => prev - 1);
        if (type === "heart") setLocalHearts(prev => prev - 1);
        if (type === "support") setLocalSupport(prev => prev - 1);
      } else {
        // Add reaction
        await supabase
          .from("post_reactions")
          .insert([{ post_id: post.id, user_id: user.id, reaction_type: type }]);

        if (type === "like") setLocalLikes(prev => prev + 1);
        if (type === "heart") setLocalHearts(prev => prev + 1);
        if (type === "support") setLocalSupport(prev => prev + 1);
      }
    } catch (error: any) {
      console.error("Error handling reaction:", error);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header with Author */}
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author?.image_url} />
              <AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{author?.name}</p>
                <span className="text-sm text-muted-foreground">•</span>
                <p className="text-sm text-muted-foreground">{author?.role}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={postTypeColors[post.post_type]}>
                {postTypeIcons[post.post_type]} {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
              </Badge>
              {post.is_pinned && (
                <Badge variant="outline">
                  <Pin className="h-3 w-3 mr-1" />
                  Pinned
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-xl font-bold mb-2">{post.title}</h3>
            <p className="text-foreground/80">{excerpt}</p>
            {post.content.length > 250 && (
              <Button
                variant="link"
                className="px-0 mt-2"
                onClick={() => setDetailDialogOpen(true)}
              >
                Read more
              </Button>
            )}
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Reactions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("like")}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              {localLikes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("heart")}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              {localHearts}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("support")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {localSupport}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailDialogOpen(true)}
              className="gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comment_count}
            </Button>
          </div>
        </div>
      </Card>

      <PostDetailDialog
        postId={post.id}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </>
  );
};
