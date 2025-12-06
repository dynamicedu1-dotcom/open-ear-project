import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Pin,
  TrendingUp,
  Shield,
  Plus,
  Image,
  BookOpen,
  Upload,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  panel_enabled: boolean;
  panel_password: string | null;
}

export default function TeamPanel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");
  
  // Post creation state
  const [postContent, setPostContent] = useState("");
  const [postMood, setPostMood] = useState("💬");
  const [postCategory, setPostCategory] = useState("General");
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const postImageRef = useRef<HTMLInputElement>(null);
  
  // Blog creation state
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogImage, setBlogImage] = useState<File | null>(null);
  const [blogImagePreview, setBlogImagePreview] = useState<string | null>(null);
  const [isBlogPosting, setIsBlogPosting] = useState(false);
  const blogImageRef = useRef<HTMLInputElement>(null);
  
  // Pin state
  const [pinNote, setPinNote] = useState("");
  const [pinningPostId, setPinningPostId] = useState<string | null>(null);

  // Fetch team members with panel access enabled
  const { data: teamMembers } = useQuery({
    queryKey: ["teamMembersWithPanel"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, name, role, email, panel_enabled, panel_password")
        .eq("panel_enabled", true)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return (data || []) as TeamMember[];
    },
  });

  // Fetch topics for category selection
  const { data: topics } = useQuery({
    queryKey: ["topics"],
    queryFn: async () => {
      const { data } = await supabase
        .from("topics")
        .select("name")
        .eq("is_active", true)
        .order("display_order");
      return data?.map(t => t.name) || ["General"];
    },
    enabled: isAuthenticated,
  });

  const handleLogin = async () => {
    if (!selectedMemberId) {
      toast.error("Please select your name");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const member = teamMembers?.find(m => m.id === selectedMemberId);
      
      if (!member) {
        toast.error("Team member not found");
        return;
      }

      if (!member.panel_password) {
        toast.error("No password set. Contact admin.");
        return;
      }

      if (password !== member.panel_password) {
        toast.error("Incorrect password");
        return;
      }

      setTeamMember(member);
      setIsAuthenticated(true);
      setShowLoginDialog(false);
      toast.success(`Welcome, ${member.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle post image selection
  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setPostImage(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle blog image selection
  const handleBlogImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setBlogImage(file);
      setBlogImagePreview(URL.createObjectURL(file));
    }
  };

  // Create post as team member
  const handleCreatePost = async () => {
    if (!postContent.trim()) {
      toast.error("Please enter post content");
      return;
    }

    setIsPosting(true);
    try {
      let imageUrl = null;

      // Upload image if selected
      if (postImage) {
        const fileExt = postImage.name.split('.').pop();
        const fileName = `team-post-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("blog-images")
          .upload(fileName, postImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("blog-images")
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Create post with team identity
      const { error } = await supabase.from("voices").insert({
        content: postContent,
        mood: postMood,
        category: postCategory,
        username: `TEAM DYNAMIC • ${teamMember?.role}`,
        is_anonymous: false,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      setPostContent("");
      setPostMood("💬");
      setPostCategory("General");
      setPostImage(null);
      setPostImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["topStudentPosts"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setIsPosting(false);
    }
  };

  // Create blog post
  const handleCreateBlog = async () => {
    if (!blogTitle.trim() || !blogContent.trim()) {
      toast.error("Please enter title and content");
      return;
    }

    setIsBlogPosting(true);
    try {
      let coverImageUrl = null;

      // Upload image if selected
      if (blogImage) {
        const fileExt = blogImage.name.split('.').pop();
        const fileName = `blog-cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, blogImage);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("blog-images")
          .getPublicUrl(fileName);
        
        coverImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("weekly_blogs").insert({
        title: blogTitle,
        content: blogContent,
        summary: blogSummary || null,
        cover_image_url: coverImageUrl,
        author_name: `TEAM DYNAMIC • ${teamMember?.name}`,
        is_published: true,
        publish_date: new Date().toISOString().split('T')[0],
      });

      if (error) throw error;

      toast.success("Blog post created successfully!");
      setBlogTitle("");
      setBlogContent("");
      setBlogSummary("");
      setBlogImage(null);
      setBlogImagePreview(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to create blog");
    } finally {
      setIsBlogPosting(false);
    }
  };

  // Pin a post
  const handlePinPost = async (voiceId: string) => {
    try {
      // Get or create a user profile for the team member
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("email", teamMember?.email)
        .maybeSingle();

      let profileId = profile?.id;

      if (!profileId) {
        const { data: newProfile, error: createError } = await supabase
          .from("user_profiles")
          .insert({
            email: teamMember?.email || `team-${teamMember?.id}@dynamic.edu`,
            display_name: teamMember?.name,
            is_anonymous: false,
          })
          .select("id")
          .single();

        if (createError) throw createError;
        profileId = newProfile.id;
      }

      const { error } = await supabase.from("pinned_voices").insert({
        voice_id: voiceId,
        pinned_by: profileId,
        pin_note: pinNote || `Pinned by ${teamMember?.name}`,
        pin_location: "highlight",
      });

      if (error) throw error;

      toast.success("Post pinned successfully!");
      setPinNote("");
      setPinningPostId(null);
      queryClient.invalidateQueries({ queryKey: ["teamMetrics"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to pin post");
    }
  };

  // Fetch metrics for the team member
  const { data: metrics } = useQuery({
    queryKey: ["teamMetrics", teamMember?.id, timeRange],
    queryFn: async () => {
      if (!teamMember) return null;
      
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data: comments } = await supabase
        .from("comments")
        .select("*, voices(*)")
        .eq("is_core_team_reply", true)
        .gte("created_at", daysAgo.toISOString());

      const { data: pinned } = await supabase
        .from("pinned_voices")
        .select("*, voices(*)")
        .gte("created_at", daysAgo.toISOString());

      let totalLikes = 0;
      let totalComments = 0;
      let totalReshares = 0;

      if (comments) {
        comments.forEach((c: any) => {
          if (c.voices) {
            totalLikes += (c.voices.likes_count || 0) + (c.voices.support_count || 0);
            totalComments += c.voices.comment_count || 0;
            totalReshares += c.voices.reshare_count || 0;
          }
        });
      }

      return {
        totalResponses: comments?.length || 0,
        pinnedPosts: pinned?.length || 0,
        totalLikes,
        totalComments,
        totalReshares,
        recentComments: comments?.slice(0, 10) || [],
        recentPinned: pinned?.slice(0, 10) || [],
      };
    },
    enabled: isAuthenticated && !!teamMember,
  });

  // Fetch top student posts
  const { data: topPosts } = useQuery({
    queryKey: ["topStudentPosts", timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      const { data } = await supabase
        .from("voices")
        .select("*")
        .eq("is_hidden", false)
        .gte("created_at", daysAgo.toISOString())
        .order("support_count", { ascending: false })
        .limit(20);

      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Check if post is already pinned
  const { data: pinnedIds } = useQuery({
    queryKey: ["pinnedVoiceIds"],
    queryFn: async () => {
      const { data } = await supabase
        .from("pinned_voices")
        .select("voice_id");
      return new Set(data?.map(p => p.voice_id) || []);
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        
        <Dialog open={showLoginDialog} onOpenChange={(open) => {
          if (!open && !isAuthenticated) {
            navigate("/");
          }
          setShowLoginDialog(open);
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center">Team Panel Login</DialogTitle>
              <DialogDescription className="text-center">
                Select your name and enter the password set by admin
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Your Name</Label>
                <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMemberId && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your panel password"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              )}

              <Button className="w-full" onClick={handleLogin} disabled={!selectedMemberId || !password || isLoading}>
                {isLoading ? "Signing in..." : "Login to Panel"}
              </Button>

              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-sm text-muted-foreground text-center">
                  No team members with panel access enabled. Contact admin.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <div className="container mx-auto p-8 flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Team Panel</CardTitle>
              <CardDescription>Access restricted to Dynamic Edu team members</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowLoginDialog(true)} className="w-full">
                Login to Panel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/wall")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Team Panel</h1>
              <p className="text-sm text-muted-foreground">
                TEAM DYNAMIC • {teamMember?.name} • {teamMember?.role}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            setIsAuthenticated(false);
            setTeamMember(null);
            setPassword("");
            setSelectedMemberId("");
            setShowLoginDialog(true);
          }}>
            Sign Out
          </Button>
        </div>

        {/* Time Range */}
        <div className="flex gap-2 mb-6">
          {(["7", "30", "90"] as const).map((range) => (
            <Button key={range} variant={timeRange === range ? "default" : "outline"} size="sm" onClick={() => setTimeRange(range)}>
              {range}d
            </Button>
          ))}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-5 gap-2 md:gap-4 mb-6">
          <Card className="p-3">
            <div className="text-center">
              <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics?.totalResponses || 0}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Responses</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Pin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics?.pinnedPosts || 0}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Pinned</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Heart className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics?.totalLikes || 0}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Likes</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <MessageCircle className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics?.totalComments || 0}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Comments</div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-center">
              <Share2 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-lg font-bold">{metrics?.totalReshares || 0}</div>
              <div className="text-xs text-muted-foreground hidden sm:block">Reshares</div>
            </div>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="create">
          <TabsList className="mb-4 w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="create" className="text-xs py-2"><Plus className="h-3 w-3 mr-1" />Post</TabsTrigger>
            <TabsTrigger value="blog" className="text-xs py-2"><BookOpen className="h-3 w-3 mr-1" />Blog</TabsTrigger>
            <TabsTrigger value="trending" className="text-xs py-2"><TrendingUp className="h-3 w-3 mr-1" />Top</TabsTrigger>
            <TabsTrigger value="responses" className="text-xs py-2"><MessageCircle className="h-3 w-3" /></TabsTrigger>
            <TabsTrigger value="pinned" className="text-xs py-2"><Pin className="h-3 w-3" /></TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Post</CardTitle>
                <CardDescription>Post as TEAM DYNAMIC • {teamMember?.role}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Select value={postMood} onValueChange={setPostMood}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["💬", "😊", "😢", "😤", "💡", "❤️", "🙏", "🎉"].map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={postCategory} onValueChange={setPostCategory}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(topics || ["General"]).map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share something with the community..."
                  rows={4}
                />
                <div>
                  <input
                    type="file"
                    ref={postImageRef}
                    accept="image/*"
                    onChange={handlePostImageChange}
                    className="hidden"
                  />
                  {postImagePreview ? (
                    <div className="relative">
                      <img src={postImagePreview} alt="Preview" className="w-full h-40 object-cover rounded" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => { setPostImage(null); setPostImagePreview(null); }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => postImageRef.current?.click()}>
                      <Image className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  )}
                </div>
                <Button onClick={handleCreatePost} disabled={isPosting || !postContent.trim()} className="w-full">
                  {isPosting ? "Posting..." : "Post as Team"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blog">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create Blog Post</CardTitle>
                <CardDescription>Publish a blog as TEAM DYNAMIC • {teamMember?.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="Blog title" />
                </div>
                <div>
                  <Label>Summary</Label>
                  <Input value={blogSummary} onChange={(e) => setBlogSummary(e.target.value)} placeholder="Brief summary" />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea value={blogContent} onChange={(e) => setBlogContent(e.target.value)} placeholder="Blog content..." rows={8} />
                </div>
                <div>
                  <Label>Cover Image</Label>
                  <input
                    type="file"
                    ref={blogImageRef}
                    accept="image/*"
                    onChange={handleBlogImageChange}
                    className="hidden"
                  />
                  {blogImagePreview ? (
                    <div className="relative mt-2">
                      <img src={blogImagePreview} alt="Preview" className="w-full h-40 object-cover rounded" />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => { setBlogImage(null); setBlogImagePreview(null); }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => blogImageRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Cover
                    </Button>
                  )}
                </div>
                <Button onClick={handleCreateBlog} disabled={isBlogPosting || !blogTitle.trim() || !blogContent.trim()} className="w-full">
                  {isBlogPosting ? "Publishing..." : "Publish Blog"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trending">
            <Card>
              <CardContent className="p-4">
                {topPosts?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No posts in this period</p>
                ) : (
                  <div className="space-y-3">
                    {topPosts?.map((post: any) => (
                      <div key={post.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span>{post.mood}</span>
                            <span className="text-xs px-2 py-0.5 bg-primary/10 rounded">{post.category}</span>
                          </div>
                          {!pinnedIds?.has(post.id) && (
                            pinningPostId === post.id ? (
                              <div className="flex gap-1">
                                <Input
                                  value={pinNote}
                                  onChange={(e) => setPinNote(e.target.value)}
                                  placeholder="Pin note..."
                                  className="h-8 text-xs w-32"
                                />
                                <Button size="sm" className="h-8" onClick={() => handlePinPost(post.id)}>
                                  <Pin className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8" onClick={() => setPinningPostId(null)}>
                                  ✕
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPinningPostId(post.id)}>
                                <Pin className="h-3 w-3 mr-1" />Pin
                              </Button>
                            )
                          )}
                          {pinnedIds?.has(post.id) && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Pinned</span>
                          )}
                        </div>
                        <p className="text-sm line-clamp-3 mb-2">{post.content}</p>
                        {post.image_url && (
                          <img src={post.image_url} alt="" className="w-full h-24 object-cover rounded mb-2" />
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>❤️ {(post.support_count || 0) + (post.likes_count || 0)}</span>
                          <span>💬 {post.comment_count || 0}</span>
                          <span>🔄 {post.reshare_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses">
            <Card>
              <CardContent className="p-4">
                {metrics?.recentComments?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No responses yet</p>
                ) : (
                  <div className="space-y-3">
                    {metrics?.recentComments?.map((comment: any) => (
                      <div key={comment.id} className="p-3 border rounded-lg">
                        <p className="text-sm mb-2">{comment.content}</p>
                        {comment.voices && (
                          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded line-clamp-2">
                            Replying to: {comment.voices.content}
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

          <TabsContent value="pinned">
            <Card>
              <CardContent className="p-4">
                {metrics?.recentPinned?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No pinned posts yet</p>
                ) : (
                  <div className="space-y-3">
                    {metrics?.recentPinned?.map((pin: any) => (
                      <div key={pin.id} className="p-3 border rounded-lg">
                        {pin.pin_note && (
                          <p className="text-sm italic mb-2 border-l-2 border-primary pl-2">"{pin.pin_note}"</p>
                        )}
                        {pin.voices && (
                          <div className="bg-muted/50 p-2 rounded">
                            <p className="text-sm line-clamp-3">{pin.voices.content}</p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Pinned {new Date(pin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
