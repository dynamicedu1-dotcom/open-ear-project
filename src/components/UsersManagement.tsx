import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, MessageCircle, Heart, Share2, Eye, Ban, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  unique_id: string | null;
  is_anonymous: boolean | null;
  is_blocked: boolean | null;
  created_at: string | null;
}

interface UserActivity {
  posts: number;
  comments: number;
  likes: number;
  reshares: number;
}

export function UsersManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showActivityDialog, setShowActivityDialog] = useState(false);

  // Fetch all users
  const { data: users, refetch } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserProfile[];
    },
  });

  // Fetch activity counts for all users
  const { data: activityCounts } = useQuery({
    queryKey: ["userActivityCounts"],
    queryFn: async () => {
      const [postsRes, commentsRes, likesRes, resharesRes] = await Promise.all([
        supabase.from("voices").select("user_profile_id"),
        supabase.from("comments").select("user_profile_id"),
        supabase.from("voice_likes").select("user_profile_id"),
        supabase.from("voice_reshares").select("user_profile_id"),
      ]);

      const counts: Record<string, UserActivity> = {};

      const initUser = (id: string) => {
        if (!counts[id]) counts[id] = { posts: 0, comments: 0, likes: 0, reshares: 0 };
      };

      postsRes.data?.forEach((p: any) => {
        if (p.user_profile_id) {
          initUser(p.user_profile_id);
          counts[p.user_profile_id].posts++;
        }
      });

      commentsRes.data?.forEach((c: any) => {
        if (c.user_profile_id) {
          initUser(c.user_profile_id);
          counts[c.user_profile_id].comments++;
        }
      });

      likesRes.data?.forEach((l: any) => {
        if (l.user_profile_id) {
          initUser(l.user_profile_id);
          counts[l.user_profile_id].likes++;
        }
      });

      resharesRes.data?.forEach((r: any) => {
        if (r.user_profile_id) {
          initUser(r.user_profile_id);
          counts[r.user_profile_id].reshares++;
        }
      });

      return counts;
    },
  });

  // Fetch detailed activity for selected user
  const { data: userActivity } = useQuery({
    queryKey: ["userDetailedActivity", selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser?.id) return null;

      const [posts, comments, likes, reshares] = await Promise.all([
        supabase
          .from("voices")
          .select("id, content, mood, category, created_at, support_count, likes_count, comment_count")
          .eq("user_profile_id", selectedUser.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("comments")
          .select("id, content, created_at, voices(content)")
          .eq("user_profile_id", selectedUser.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("voice_likes")
          .select("id, created_at, voices(content, mood)")
          .eq("user_profile_id", selectedUser.id)
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("voice_reshares")
          .select("id, comment, created_at, voices(content, mood)")
          .eq("user_profile_id", selectedUser.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      return {
        posts: posts.data || [],
        comments: comments.data || [],
        likes: likes.data || [],
        reshares: reshares.data || [],
      };
    },
    enabled: !!selectedUser?.id && showActivityDialog,
  });

  // Toggle user blocked status
  const handleToggleBlock = async (user: UserProfile) => {
    const { error } = await supabase
      .from("user_profiles")
      .update({ is_blocked: !user.is_blocked })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update user status");
    } else {
      toast.success(user.is_blocked ? "User unblocked" : "User blocked");
      refetch();
    }
  };

  // Filter users by search
  const filteredUsers = users?.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query) ||
      user.unique_id?.toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View all registered users and their activity</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email, name, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="p-3">
            <div className="text-center">
              <User className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{users?.length || 0}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
              <div className="text-lg font-bold">{users?.filter(u => !u.is_blocked).length || 0}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Ban className="h-4 w-4 mx-auto mb-1 text-red-500" />
              <div className="text-lg font-bold">{users?.filter(u => u.is_blocked).length || 0}</div>
              <div className="text-xs text-muted-foreground">Blocked</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Eye className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{users?.filter(u => u.is_anonymous).length || 0}</div>
              <div className="text-xs text-muted-foreground">Anonymous</div>
            </div>
          </Card>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {filteredUsers?.map((user) => {
            const activity = activityCounts?.[user.id] || { posts: 0, comments: 0, likes: 0, reshares: 0 };

            return (
              <div
                key={user.id}
                className={`p-4 border rounded-lg ${user.is_blocked ? "bg-red-50 border-red-200" : ""}`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium">{user.unique_id || "No ID"}</span>
                      {user.is_blocked && (
                        <Badge variant="destructive" className="text-xs">Blocked</Badge>
                      )}
                      {user.is_anonymous && (
                        <Badge variant="secondary" className="text-xs">Anonymous</Badge>
                      )}
                    </div>
                    <p className="text-sm text-primary">{user.email}</p>
                    {user.display_name && (
                      <p className="text-sm text-muted-foreground">{user.display_name}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {activity.posts} posts
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {activity.comments} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {activity.likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        {activity.reshares} reshares
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowActivityDialog(true);
                      }}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Activity
                    </Button>
                    <Button
                      variant={user.is_blocked ? "default" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleBlock(user)}
                      className="flex-1 sm:flex-none"
                    >
                      {user.is_blocked ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Block
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {(!filteredUsers || filteredUsers.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No users found matching your search" : "No registered users yet"}
            </div>
          )}
        </div>

        {/* Activity Dialog */}
        <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Activity: {selectedUser?.unique_id || selectedUser?.display_name || selectedUser?.email}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              {/* Posts */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Posts ({userActivity?.posts?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userActivity?.posts?.map((post: any) => (
                    <div key={post.id} className="p-2 bg-muted/50 rounded text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span>{post.mood}</span>
                        <span className="text-xs px-1 bg-primary/10 rounded">{post.category}</span>
                      </div>
                      <p className="line-clamp-2">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No posts</p>}
                </div>
              </div>

              {/* Comments */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Comments ({userActivity?.comments?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userActivity?.comments?.map((comment: any) => (
                    <div key={comment.id} className="p-2 bg-muted/50 rounded text-sm">
                      <p className="line-clamp-2">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No comments</p>}
                </div>
              </div>

              {/* Likes */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Likes ({userActivity?.likes?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userActivity?.likes?.map((like: any) => (
                    <div key={like.id} className="p-2 bg-muted/50 rounded text-sm">
                      <p className="line-clamp-2">{like.voices?.content || "Post deleted"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(like.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No likes</p>}
                </div>
              </div>

              {/* Reshares */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Reshares ({userActivity?.reshares?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {userActivity?.reshares?.map((reshare: any) => (
                    <div key={reshare.id} className="p-2 bg-muted/50 rounded text-sm">
                      {reshare.comment && (
                        <p className="italic border-l-2 border-primary pl-2 mb-1">"{reshare.comment}"</p>
                      )}
                      <p className="line-clamp-2">{reshare.voices?.content || "Post deleted"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(reshare.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No reshares</p>}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
