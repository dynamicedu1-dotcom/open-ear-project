import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "@/components/EmailCaptureModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, MessageCircle, Heart, Share2, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const ITEMS_LIMIT = 20;

// Memoized list item components
const PostItem = React.memo(({ post, onDelete }: { post: any; onDelete: (id: string) => void }) => (
  <div className="p-3 border rounded-lg">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{post.mood}</span>
        <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">{post.category}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive shrink-0"
        onClick={() => onDelete(post.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <p className="text-sm mb-2 line-clamp-2">{post.content}</p>
    {post.image_url && (
      <img src={post.image_url} alt="" className="w-full h-24 object-cover rounded mb-2" />
    )}
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>❤️ {(post.support_count || 0) + (post.likes_count || 0)}</span>
      <span>💬 {post.comment_count || 0}</span>
      <span>{new Date(post.created_at).toLocaleDateString()}</span>
    </div>
  </div>
));

const CommentItem = React.memo(({ comment, onDelete }: { comment: any; onDelete: (id: string) => void }) => (
  <div className="p-3 border rounded-lg">
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm flex-1 line-clamp-2">{comment.content}</p>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive shrink-0"
        onClick={() => onDelete(comment.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {new Date(comment.created_at).toLocaleDateString()}
    </p>
  </div>
));

const LikeItem = React.memo(({ like }: { like: any }) => (
  <div className="p-3 border rounded-lg">
    {like.voices ? (
      <>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{like.voices.mood}</span>
          <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">{like.voices.category}</span>
        </div>
        <p className="text-sm line-clamp-2">{like.voices.content}</p>
      </>
    ) : (
      <p className="text-sm text-muted-foreground">Post no longer available</p>
    )}
    <p className="text-xs text-muted-foreground mt-1">
      Liked {new Date(like.created_at).toLocaleDateString()}
    </p>
  </div>
));

const ReshareItem = React.memo(({ reshare, onDelete }: { reshare: any; onDelete: (id: string) => void }) => (
  <div className="p-3 border rounded-lg">
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1">
        {reshare.comment && (
          <p className="text-sm italic mb-1 border-l-2 border-primary pl-2 line-clamp-1">
            "{reshare.comment}"
          </p>
        )}
        {reshare.voices ? (
          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-2">
            {reshare.voices.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Post no longer available</p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive shrink-0"
        onClick={() => onDelete(reshare.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
    <p className="text-xs text-muted-foreground mt-1">
      {new Date(reshare.created_at).toLocaleDateString()}
    </p>
  </div>
));

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="p-3 border rounded-lg">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-12 w-full mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    ))}
  </div>
);

export default function MyActivity() {
  const navigate = useNavigate();
  const { profile, isIdentified, isLoading: identityLoading, requiresIdentity, cancelIdentityRequest, requestIdentity } = useIdentity();
  const [activeTab, setActiveTab] = useState("posts");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string; type: string }>({
    open: false, id: '', type: ''
  });

  // Request identity on mount if not identified
  React.useEffect(() => {
    if (!identityLoading && !isIdentified) {
      requestIdentity();
    }
  }, [identityLoading, isIdentified, requestIdentity]);

  // Lazy load data based on active tab
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['my-posts', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('voices')
        .select('id, content, mood, category, support_count, likes_count, comment_count, image_url, created_at')
        .eq('user_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(ITEMS_LIMIT);
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'posts',
    staleTime: 30000,
  });

  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ['my-comments', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('comments')
        .select('id, content, created_at')
        .eq('user_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(ITEMS_LIMIT);
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'comments',
    staleTime: 30000,
  });

  const { data: likes = [], isLoading: likesLoading } = useQuery({
    queryKey: ['my-likes', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('voice_likes')
        .select('id, created_at, voices(content, mood, category)')
        .eq('user_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(ITEMS_LIMIT);
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'likes',
    staleTime: 30000,
  });

  const { data: reshares = [], isLoading: resharesLoading, refetch: refetchReshares } = useQuery({
    queryKey: ['my-reshares', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data } = await supabase
        .from('voice_reshares')
        .select('id, comment, created_at, voices(content)')
        .eq('user_profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(ITEMS_LIMIT);
      return data || [];
    },
    enabled: !!profile?.id && activeTab === 'reshares',
    staleTime: 30000,
  });

  const confirmDelete = useCallback((id: string, type: string) => {
    setDeleteDialog({ open: true, id, type });
  }, []);

  const handleDelete = useCallback(async () => {
    const { id, type } = deleteDialog;
    try {
      let error: any;
      
      switch (type) {
        case 'post':
          ({ error } = await supabase.from('voices').delete().eq('id', id));
          if (!error) refetchPosts();
          break;
        case 'comment':
          ({ error } = await supabase.from('comments').delete().eq('id', id));
          if (!error) refetchComments();
          break;
        case 'reshare':
          ({ error } = await supabase.from('voice_reshares').delete().eq('id', id));
          if (!error) refetchReshares();
          break;
      }

      if (error) throw error;
      if (error) throw error;
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setDeleteDialog({ open: false, id: '', type: '' });
    }
  }, [deleteDialog, refetchPosts, refetchComments, refetchReshares]);

  // Show loading skeleton while identity is loading
  if (identityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <EmailCaptureModal
        open={requiresIdentity}
        onOpenChange={(open) => !open && cancelIdentityRequest()}
        onSuccess={() => {}}
        actionDescription="view your activity"
      />

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">My Activity</h1>
            {profile && (
              <p className="text-sm text-muted-foreground">{profile.unique_id || profile.display_name}</p>
            )}
          </div>
        </div>

        {!isIdentified ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Sign in to view your activity</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="posts" className="gap-1 text-xs">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-1 text-xs">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Comments</span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="gap-1 text-xs">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Likes</span>
              </TabsTrigger>
              <TabsTrigger value="reshares" className="gap-1 text-xs">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Reshares</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-3">
              {postsLoading ? <LoadingSkeleton /> : posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No posts yet</p>
                  <Button onClick={() => navigate("/share")} size="sm" className="mt-3">Share Your Voice</Button>
                </div>
              ) : (
                posts.map((post: any) => (
                  <PostItem key={post.id} post={post} onDelete={(id) => confirmDelete(id, 'post')} />
                ))
              )}
            </TabsContent>

            <TabsContent value="comments" className="space-y-3">
              {commentsLoading ? <LoadingSkeleton /> : comments.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No comments yet</p>
              ) : (
                comments.map((comment: any) => (
                  <CommentItem key={comment.id} comment={comment} onDelete={(id) => confirmDelete(id, 'comment')} />
                ))
              )}
            </TabsContent>

            <TabsContent value="likes" className="space-y-3">
              {likesLoading ? <LoadingSkeleton /> : likes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No likes yet</p>
              ) : (
                likes.map((like: any) => <LikeItem key={like.id} like={like} />)
              )}
            </TabsContent>

            <TabsContent value="reshares" className="space-y-3">
              {resharesLoading ? <LoadingSkeleton /> : reshares.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground text-sm">No reshares yet</p>
              ) : (
                reshares.map((reshare: any) => (
                  <ReshareItem key={reshare.id} reshare={reshare} onDelete={(id) => confirmDelete(id, 'reshare')} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog.type}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
