import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, Heart, TrendingUp, MessageCircle, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface PostDetailDialogProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export const PostDetailDialog = ({ postId, open, onOpenChange }: PostDetailDialogProps) => {
  const { toast } = useToast();
  const [commentContent, setCommentContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const { data: post, refetch: refetchPost } = useQuery({
    queryKey: ["post-detail", postId],
    queryFn: async () => {
      if (!postId) return null;
      const { data, error } = await supabase
        .from("core_team_posts")
        .select(`
          *,
          author:core_member_profiles!inner(
            team_member:team_members(name, role, image_url)
          )
        `)
        .eq("id", postId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const { data: comments, refetch: refetchComments } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          author:core_member_profiles(
            team_member:team_members(name, role, image_url)
          )
        `)
        .eq("post_id", postId)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });

  const handleReaction = async (type: "like" | "heart" | "support") => {
    if (!postId) return;

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

      const { data: existing } = await supabase
        .from("post_reactions")
        .select("id")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("reaction_type", type)
        .single();

      if (existing) {
        await supabase.from("post_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("post_reactions").insert([{ 
          post_id: postId, 
          user_id: user.id, 
          reaction_type: type 
        }]);
      }

      refetchPost();
    } catch (error: any) {
      console.error("Error handling reaction:", error);
    }
  };

  const handleSubmitComment = async () => {
    if (!postId || !commentContent.trim()) return;

    setSubmittingComment(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to comment.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("post_comments")
        .insert([{
          post_id: postId,
          author_id: user.id,
          content: commentContent.trim(),
        }]);

      if (error) throw error;

      setCommentContent("");
      refetchComments();
      refetchPost();
      toast({ title: "Comment added!" });
    } catch (error: any) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!post) return null;

  const author = post.author?.team_member;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={author?.image_url} />
              <AvatarFallback>{author?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-left">{author?.name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{author?.role}</p>
            </div>
            <Badge className={`ml-auto ${postTypeColors[post.post_type]}`}>
              {postTypeIcons[post.post_type]} {post.post_type}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Content */}
          <div>
            <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
            <p className="text-foreground/80 whitespace-pre-wrap">{post.content}</p>
            <p className="text-xs text-muted-foreground mt-4">
              {format(new Date(post.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.hashtags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
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
              {post.likes_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("heart")}
              className="gap-2"
            >
              <Heart className="h-4 w-4" />
              {post.hearts_count}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction("support")}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              {post.support_count}
            </Button>
            <div className="flex items-center gap-2 text-muted-foreground ml-auto">
              <MessageCircle className="h-4 w-4" />
              {post.comment_count} comments
            </div>
          </div>

          <Separator />

          {/* Comments Section */}
          <div>
            <h3 className="font-semibold mb-4">Comments</h3>
            
            {/* Comment Input */}
            <div className="flex gap-3 mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                rows={3}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentContent.trim() || submittingComment}
                size="sm"
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Comments List */}
            <div className="space-y-4">
              {comments?.map((comment: any) => {
                const commentAuthor = comment.author?.team_member;
                return (
                  <div key={comment.id} className="flex gap-3 p-4 bg-muted/50 rounded-lg">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={commentAuthor?.image_url} />
                      <AvatarFallback>{commentAuthor?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{commentAuthor?.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/80">{comment.content}</p>
                    </div>
                  </div>
                );
              })}
              {comments?.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
