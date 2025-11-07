import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatePostDialog } from "@/components/core-team/CreatePostDialog";
import { CoreTeamPostCard } from "@/components/core-team/CoreTeamPostCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
}

const CoreTeamDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Check if user is a core member
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      return data;
    },
  });

  // Get core member profile
  const { data: profile } = useQuery({
    queryKey: ["core-member-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("core_member_profiles")
        .select(`
          *,
          team_member:team_members(name, role, image_url, bio)
        `)
        .eq("user_id", user.id)
        .single();

      return data;
    },
  });

  // Get my posts
  const { data: myPosts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ["my-posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("core_team_posts")
        .select("*")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Post[];
    },
  });

  // Get posts I commented on
  const { data: commentedPosts } = useQuery({
    queryKey: ["commented-posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          post:core_team_posts(*)
        `)
        .eq("author_id", user.id);

      if (error) throw error;
      return data?.map(d => d.post).filter(Boolean) as Post[];
    },
  });

  // Get trending posts
  const { data: trendingPosts } = useQuery({
    queryKey: ["trending-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_team_posts")
        .select("*")
        .eq("status", "published")
        .order("trending_score", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Post[];
    },
  });

  useEffect(() => {
    if (!roleLoading && (!userRole || (userRole.role !== "core_member" && userRole.role !== "admin"))) {
      toast({
        title: "Access Denied",
        description: "You must be a core team member to access this dashboard.",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [userRole, roleLoading, navigate, toast]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const teamMember = profile?.team_member;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-8 p-6 bg-card rounded-lg border border-border">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={teamMember?.image_url} />
              <AvatarFallback className="text-2xl">
                {teamMember?.name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{teamMember?.name || "Core Member"}</h1>
              <p className="text-lg text-muted-foreground mb-3">{teamMember?.role}</p>
              {teamMember?.bio && (
                <p className="text-foreground/80">{teamMember.bio}</p>
              )}
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Create Post
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="my-posts">My Posts</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="my-posts">
            {postsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : myPosts?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground mb-4">You haven't created any posts yet.</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Post
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {myPosts?.map((post) => (
                  <CoreTeamPostCard
                    key={post.id}
                    post={post}
                    onEdit={(post) => {
                      setSelectedPost(post);
                      setCreateDialogOpen(true);
                    }}
                    onDeleted={refetchPosts}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            {commentedPosts?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">You haven't commented on any posts yet.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {commentedPosts?.map((post) => (
                  <CoreTeamPostCard key={post.id} post={post} showAuthor />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending">
            {trendingPosts?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No trending posts yet.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {trendingPosts?.map((post) => (
                  <CoreTeamPostCard key={post.id} post={post} showAuthor />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          setCreateDialogOpen(open);
          if (!open) setSelectedPost(null);
        }}
        post={selectedPost}
        onSuccess={() => {
          refetchPosts();
          setCreateDialogOpen(false);
          setSelectedPost(null);
        }}
      />
    </div>
  );
};

export default CoreTeamDashboard;
