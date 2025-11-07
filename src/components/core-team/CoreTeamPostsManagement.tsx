import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Trash2, Pin, PinOff, Globe, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
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

export const CoreTeamPostsManagement = () => {
  const { toast } = useToast();
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["admin-core-posts", visibilityFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from("core_team_posts")
        .select(`
          *,
          author:core_member_profiles(
            team_member:team_members(name, role)
          )
        `)
        .order("created_at", { ascending: false });

      if (visibilityFilter !== "all") {
        query = query.eq("visibility", visibilityFilter);
      }

      if (typeFilter !== "all") {
        query = query.eq("post_type", typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleTogglePin = async (postId: string, currentlyPinned: boolean) => {
    try {
      const { error } = await supabase
        .from("core_team_posts")
        .update({ is_pinned: !currentlyPinned })
        .eq("id", postId);

      if (error) throw error;
      toast({ title: currentlyPinned ? "Post unpinned" : "Post pinned" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleVisibility = async (postId: string, currentVisibility: string) => {
    try {
      const newVisibility = currentVisibility === "public" ? "internal" : "public";
      const { error } = await supabase
        .from("core_team_posts")
        .update({ visibility: newVisibility })
        .eq("id", postId);

      if (error) throw error;
      toast({ title: `Post is now ${newVisibility}` });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedPostId) return;

    try {
      const { error } = await supabase
        .from("core_team_posts")
        .delete()
        .eq("id", selectedPostId);

      if (error) throw error;
      toast({ title: "Post deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedPostId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex gap-4">
          <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visibility</SelectItem>
              <SelectItem value="public">Public Only</SelectItem>
              <SelectItem value="internal">Internal Only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="update">Updates</SelectItem>
              <SelectItem value="idea">Ideas</SelectItem>
              <SelectItem value="task">Tasks</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts?.map((post: any) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author?.team_member?.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{post.post_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={post.visibility === "public" ? "default" : "secondary"}>
                      {post.visibility === "public" ? (
                        <><Globe className="h-3 w-3 mr-1" />Public</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" />Internal</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{post.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      ❤️ {post.likes_count + post.hearts_count + post.support_count} • 
                      💬 {post.comment_count}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {format(new Date(post.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePin(post.id, post.is_pinned)}
                        title={post.is_pinned ? "Unpin" : "Pin"}
                      >
                        {post.is_pinned ? (
                          <PinOff className="h-4 w-4" />
                        ) : (
                          <Pin className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleVisibility(post.id, post.visibility)}
                        title="Toggle Visibility"
                      >
                        {post.visibility === "public" ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPostId(post.id);
                          setDeleteDialogOpen(true);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No posts found with the current filters.
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the post and all associated comments and reactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
