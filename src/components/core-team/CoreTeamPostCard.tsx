import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThumbsUp, Heart, TrendingUp, MessageCircle, Eye, Edit, Trash2, Pin, Globe, Lock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Post {
  id: string;
  title: string;
  content: string;
  visibility: string;
  status: string;
  post_type: string;
  is_pinned: boolean;
  likes_count: number;
  hearts_count: number;
  support_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  author_id?: string;
}

interface CoreTeamPostCardProps {
  post: Post;
  showAuthor?: boolean;
  onEdit?: (post: Post) => void;
  onDeleted?: () => void;
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

export const CoreTeamPostCard = ({ post, showAuthor, onEdit, onDeleted }: CoreTeamPostCardProps) => {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { data: { user } } = useQuery({
    queryKey: ["user"],
    queryFn: async () => await supabase.auth.getUser(),
  });

  const { data: authorProfile } = useQuery({
    queryKey: ["author-profile", post.author_id],
    queryFn: async () => {
      if (!post.author_id) return null;
      const { data } = await supabase
        .from("core_member_profiles")
        .select(`
          team_member:team_members(name, role, image_url)
        `)
        .eq("user_id", post.author_id)
        .single();
      return data;
    },
    enabled: showAuthor && !!post.author_id,
  });

  const isAuthor = user?.user?.id === post.author_id;
  const excerpt = post.content.length > 200 ? post.content.slice(0, 200) + "..." : post.content;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("core_team_posts")
        .delete()
        .eq("id", post.id);

      if (error) throw error;

      toast({ title: "Post deleted successfully" });
      if (onDeleted) onDeleted();
    } catch (error: any) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={postTypeColors[post.post_type]}>
                  {postTypeIcons[post.post_type]} {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                </Badge>
                <Badge variant={post.visibility === "public" ? "default" : "secondary"}>
                  {post.visibility === "public" ? (
                    <><Globe className="h-3 w-3 mr-1" /> Public</>
                  ) : (
                    <><Lock className="h-3 w-3 mr-1" /> Internal</>
                  )}
                </Badge>
                {post.status === "draft" && (
                  <Badge variant="outline">Draft</Badge>
                )}
                {post.is_pinned && (
                  <Badge variant="outline"><Pin className="h-3 w-3 mr-1" />Pinned</Badge>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">{post.title}</h3>
              <p className="text-foreground/80">{excerpt}</p>
            </div>

            {isAuthor && onEdit && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(post)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Author */}
          {showAuthor && authorProfile?.team_member && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Avatar className="h-8 w-8">
                <AvatarImage src={authorProfile.team_member.image_url} />
                <AvatarFallback>
                  {authorProfile.team_member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{authorProfile.team_member.name}</p>
                <p className="text-xs text-muted-foreground">{authorProfile.team_member.role}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-1">
              <ThumbsUp className="h-4 w-4" />
              {post.likes_count}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {post.hearts_count}
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {post.support_count}
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              {post.comment_count}
            </div>
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {post.view_count}
            </div>
            <div className="ml-auto text-xs">
              {format(new Date(post.created_at), "MMM d, yyyy 'at' h:mm a")}
            </div>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post and all associated comments and reactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
