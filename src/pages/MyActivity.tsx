import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "@/components/EmailCaptureModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ArrowLeft, MessageCircle, Heart, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function MyActivity() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { profile, isIdentified, isLoading, requestIdentity, requiresIdentity, cancelIdentityRequest } = useIdentity();
  const [activeTab, setActiveTab] = useState("posts");
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: "post" | "comment" | "reshare" | null;
    id: string | null;
  }>({ open: false, type: null, id: null });

  // Request identity if not identified
  useEffect(() => {
    if (!isLoading && !isIdentified) {
      requestIdentity();
    }
  }, [isLoading, isIdentified, requestIdentity]);

  // Fetch user's posts
  const { data: myPosts, refetch: refetchPosts, isLoading: postsLoading } = useQuery({
    queryKey: ["myPosts", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("voices")
        .select("id, content, mood, category, support_count, likes_count, comment_count, created_at, image_url")
        .eq("user_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });

  // Fetch user's likes
  const { data: myLikes, isLoading: likesLoading } = useQuery({
    queryKey: ["myLikes", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("voice_likes")
        .select("id, created_at, voice_id, voices(id, content, mood, category)")
        .eq("user_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });

  // Fetch user's comments
  const { data: myComments, refetch: refetchComments, isLoading: commentsLoading } = useQuery({
    queryKey: ["myComments", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, voice_id, voices(content)")
        .eq("user_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });

  // Fetch user's reshares
  const { data: myReshares, refetch: refetchReshares, isLoading: resharesLoading } = useQuery({
    queryKey: ["myReshares", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await supabase
        .from("voice_reshares")
        .select("id, comment, created_at, voice_id, voices(id, content, mood, category)")
        .eq("user_profile_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
    staleTime: 30000,
  });

  // Memoize counts
  const counts = useMemo(() => ({
    posts: myPosts?.length || 0,
    likes: myLikes?.length || 0,
    comments: myComments?.length || 0,
    reshares: myReshares?.length || 0,
  }), [myPosts, myLikes, myComments, myReshares]);

  const handleDelete = async () => {
    if (!deleteDialog.type || !deleteDialog.id) return;

    try {
      let error;
      
      if (deleteDialog.type === "post") {
        ({ error } = await supabase
          .from("voices")
          .delete()
          .eq("id", deleteDialog.id)
          .eq("user_profile_id", profile?.id));
        if (!error) {
          refetchPosts();
          toast.success("Post deleted");
        }
      } else if (deleteDialog.type === "comment") {
        ({ error } = await supabase
          .from("comments")
          .delete()
          .eq("id", deleteDialog.id)
          .eq("user_profile_id", profile?.id));
        if (!error) {
          refetchComments();
          toast.success("Comment deleted");
        }
      } else if (deleteDialog.type === "reshare") {
        ({ error } = await supabase
          .from("voice_reshares")
          .delete()
          .eq("id", deleteDialog.id)
          .eq("user_profile_id", profile?.id));
        if (!error) {
          refetchReshares();
          toast.success("Reshare removed");
        }
      }

      if (error) throw error;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error("Failed to delete");
    } finally {
      setDeleteDialog({ open: false, type: null, id: null });
    }
  };

  const confirmDelete = (type: "post" | "comment" | "reshare", id: string) => {
    setDeleteDialog({ open: true, type, id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border rounded-lg">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <EmailCaptureModal
        open={requiresIdentity}
        onOpenChange={(open) => !open && cancelIdentityRequest()}
        actionDescription="view your activity"
      />

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your {deleteDialog.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/wall")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">My Activity</h1>
            <p className="text-sm text-muted-foreground">
              {profile?.unique_id || (profile?.is_anonymous ? "Anonymous" : profile?.display_name || profile?.email?.split("@")[0])}
            </p>
          </div>
        </div>

        {profile && (
          <>
            {/* Stats Cards - Simplified for mobile */}
            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-6">
              <Card className="p-3">
                <div className="text-center">
                  <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{counts.posts}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Posts</div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{counts.likes}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Likes</div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{counts.comments}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Comments</div>
                </div>
              </Card>
              <Card className="p-3">
                <div className="text-center">
                  <Share2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-lg font-bold">{counts.reshares}</div>
                  <div className="text-xs text-muted-foreground hidden sm:block">Reshares</div>
                </div>
              </Card>
            </div>

            {/* Activity Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4 w-full grid grid-cols-4 h-auto">
                <TabsTrigger value="posts" className="text-xs py-2">Posts</TabsTrigger>
                <TabsTrigger value="comments" className="text-xs py-2">Comments</TabsTrigger>
                <TabsTrigger value="likes" className="text-xs py-2">Likes</TabsTrigger>
                <TabsTrigger value="reshares" className="text-xs py-2">Reshares</TabsTrigger>
              </TabsList>

              <TabsContent value="posts">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    {postsLoading ? <LoadingSkeleton /> : myPosts?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No posts yet</p>
                        <Button onClick={() => navigate("/share")} size="sm" className="mt-3">
                          Share Your Voice
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myPosts?.map((post: any) => (
                          <div key={post.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-base">{post.mood}</span>
                                <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                                  {post.category}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive shrink-0"
                                onClick={() => confirmDelete("post", post.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-sm mb-2 line-clamp-3">{post.content}</p>
                            {post.image_url && (
                              <img src={post.image_url} alt="" className="w-full h-32 object-cover rounded mb-2" />
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>❤️ {(post.support_count || 0) + (post.likes_count || 0)}</span>
                              <span>💬 {post.comment_count || 0}</span>
                              <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    {commentsLoading ? <LoadingSkeleton /> : myComments?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No comments yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myComments?.map((comment: any) => (
                          <div key={comment.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm flex-1 line-clamp-3">{comment.content}</p>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive shrink-0"
                                onClick={() => confirmDelete("comment", comment.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {comment.voices && (
                              <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2 line-clamp-2">
                                On: {comment.voices.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(comment.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="likes">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    {likesLoading ? <LoadingSkeleton /> : myLikes?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Heart className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No likes yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myLikes?.map((like: any) => (
                          <div key={like.id} className="p-3 border rounded-lg">
                            {like.voices && (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-base">{like.voices.mood}</span>
                                  <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                                    {like.voices.category}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-3">{like.voices.content}</p>
                              </>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Liked on {new Date(like.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reshares">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    {resharesLoading ? <LoadingSkeleton /> : myReshares?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Share2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No reshares yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myReshares?.map((reshare: any) => (
                          <div key={reshare.id} className="p-3 border rounded-lg">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                {reshare.comment && (
                                  <p className="text-sm italic mb-2 border-l-2 border-primary pl-2 line-clamp-2">
                                    "{reshare.comment}"
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive shrink-0"
                                onClick={() => confirmDelete("reshare", reshare.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {reshare.voices && (
                              <>
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-base">{reshare.voices.mood}</span>
                                  <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">
                                    {reshare.voices.category}
                                  </span>
                                </div>
                                <p className="text-sm line-clamp-3">{reshare.voices.content}</p>
                              </>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Reshared on {new Date(reshare.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}
