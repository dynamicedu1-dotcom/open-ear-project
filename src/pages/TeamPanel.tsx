import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
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
  Clock,
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(true);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");

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

  // Fetch metrics for the team member
  const { data: metrics } = useQuery({
    queryKey: ["teamMetrics", teamMember?.id, timeRange],
    queryFn: async () => {
      if (!teamMember) return null;
      
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));

      // Get comments by this team member (core team replies)
      const { data: comments } = await supabase
        .from("comments")
        .select("*, voices(*)")
        .eq("is_core_team_reply", true)
        .gte("created_at", daysAgo.toISOString());

      // Get pinned voices by team
      const { data: pinned } = await supabase
        .from("pinned_voices")
        .select("*, voices(*)")
        .gte("created_at", daysAgo.toISOString());

      // Calculate engagement on posts team interacted with
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
        .limit(10);

      return data || [];
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
                <Select
                  value={selectedMemberId}
                  onValueChange={setSelectedMemberId}
                >
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

              <Button
                className="w-full"
                onClick={handleLogin}
                disabled={!selectedMemberId || !password || isLoading}
              >
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
              <CardDescription>
                Access restricted to Dynamic Edu team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowLoginDialog(true)} className="w-full">
                Login to Panel
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">
                Contact admin if you need panel access
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
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
            onClick={() => {
              setIsAuthenticated(false);
              setTeamMember(null);
              setPassword("");
              setSelectedMemberId("");
              setShowLoginDialog(true);
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
          <TabsList className="mb-4 w-full justify-start overflow-x-auto">
            <TabsTrigger value="trending">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Top Posts</span>
            </TabsTrigger>
            <TabsTrigger value="responses">
              <MessageCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Responses</span>
            </TabsTrigger>
            <TabsTrigger value="pinned">
              <Pin className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Pinned</span>
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
