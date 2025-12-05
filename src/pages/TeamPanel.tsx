import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Pin,
  TrendingUp,
  LogIn,
  Shield,
} from "lucide-react";

export default function TeamPanel() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamMember, setTeamMember] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");

  // Check existing auth session
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if user is a team member
        const { data: member } = await supabase
          .from("team_members")
          .select("*")
          .eq("email", session.user.email)
          .eq("is_active", true)
          .maybeSingle();

        if (member) {
          setTeamMember(member);
          setIsAuthenticated(true);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify team member
      const { data: member } = await supabase
        .from("team_members")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .maybeSingle();

      if (!member) {
        await supabase.auth.signOut();
        toast.error("You are not authorized as a team member");
        return;
      }

      setTeamMember(member);
      setIsAuthenticated(true);
      toast.success(`Welcome back, ${member.name}!`);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch metrics for the team member
  const { data: metrics } = useQuery({
    queryKey: ["teamMetrics", teamMember?.id, timeRange],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // Get voices with comments from this team member
      const { data: comments, error: commentsError } = await supabase
        .from("comments")
        .select("*, voices(*)")
        .eq("is_core_team_reply", true)
        .gte("created_at", daysAgo.toISOString());

      // Get pinned voices by team
      const { data: pinned } = await supabase
        .from("pinned_voices")
        .select("*, voices(*)")
        .gte("created_at", daysAgo.toISOString());

      // Get total engagement on posts team interacted with
      let totalLikes = 0;
      let totalComments = 0;
      let totalReshares = 0;

      if (comments) {
        comments.forEach((c: any) => {
          if (c.voices) {
            totalLikes += c.voices.likes_count || 0;
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
        .limit(10);

      return data || [];
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto p-4 md:p-8 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Team Panel Login</CardTitle>
              <p className="text-sm text-muted-foreground">
                Access restricted to Dynamic Edu team members
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@dynamicedu.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Contact admin if you need access credentials
              </p>
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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/wall")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Team Panel</h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {teamMember?.name} • {teamMember?.role}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              setIsAuthenticated(false);
              setTeamMember(null);
            }}
          >
            Sign Out
          </Button>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-6">
          {(["7", "30", "90"] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range} Days
            </Button>
          ))}
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalResponses || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Pin className="h-4 w-4" />
                Pinned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.pinnedPosts || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Total Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalLikes || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalComments || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                Reshares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.totalReshares || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="trending">
          <TabsList className="mb-4">
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              Top Student Posts
            </TabsTrigger>
            <TabsTrigger value="responses">
              <MessageCircle className="h-4 w-4 mr-2" />
              My Responses
            </TabsTrigger>
            <TabsTrigger value="pinned">
              <Pin className="h-4 w-4 mr-2" />
              Pinned Posts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending">
            <Card>
              <CardContent className="p-4">
                {topPosts?.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    No trending posts in this period
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topPosts?.map((post: any) => (
                      <div
                        key={post.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => navigate(`/wall?voice=${post.id}`)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{post.mood}</span>
                          <span className="text-xs px-2 py-1 bg-primary/10 rounded">
                            {post.category}
                          </span>
                        </div>
                        <p className="text-sm mb-2 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>❤️ {post.support_count + (post.likes_count || 0)}</span>
                          <span>💬 {post.comment_count}</span>
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
                  <p className="text-center py-8 text-muted-foreground">
                    No responses yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metrics?.recentComments?.map((comment: any) => (
                      <div key={comment.id} className="p-4 border rounded-lg">
                        <p className="text-sm mb-2">{comment.content}</p>
                        {comment.voices && (
                          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded mt-2">
                            <p className="line-clamp-2">
                              Replying to: {comment.voices.content}
                            </p>
                          </div>
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
                  <p className="text-center py-8 text-muted-foreground">
                    No pinned posts yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {metrics?.recentPinned?.map((pin: any) => (
                      <div key={pin.id} className="p-4 border rounded-lg">
                        {pin.pin_note && (
                          <p className="text-sm italic mb-2 border-l-2 border-primary pl-3">
                            "{pin.pin_note}"
                          </p>
                        )}
                        {pin.voices && (
                          <div className="bg-muted/50 p-3 rounded">
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
