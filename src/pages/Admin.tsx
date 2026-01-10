import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, MessageCircle, MessageSquare, Lightbulb, Users, Star, Plus, Edit, Handshake, UserSquare, Tag, FileText, FolderTree, BookOpen, User, Download, ClipboardList, Heart, Image, BarChart3, Code } from "lucide-react";
import { toast } from "sonner";
import { PartnersManagement } from "@/components/PartnersManagement";
import { TeamManagement } from "@/components/TeamManagement";
import { TopicsManagement } from "@/components/TopicsManagement";
import { FeedbackTypesManagement } from "@/components/FeedbackTypesManagement";
import { CollaborationOptionsManagement } from "@/components/CollaborationOptionsManagement";
import { BlogManagement } from "@/components/BlogManagement";
import { UsersManagement } from "@/components/UsersManagement";
import { RegistrationsManagement } from "@/components/RegistrationsManagement";
import { DonationsManagement } from "@/components/DonationsManagement";
import { StaticPagesManagement } from "@/components/StaticPagesManagement";
import { BannersManagement } from "@/components/BannersManagement";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { DeveloperInfoManagement } from "@/components/DeveloperInfoManagement";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AdminPasswordDialog } from "@/components/AdminPasswordDialog";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("voices");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Check if user has admin role
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["userRole"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        return null;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      return data;
    },
    enabled: isAuthenticated,
  });

  // Update admin status when role data changes
  React.useEffect(() => {
    if (isAuthenticated && !roleLoading) {
      if (!userRole) {
        toast.error("Access denied. Admin role required.");
        navigate("/auth");
      } else {
        setIsAdmin(true);
      }
    }
  }, [userRole, roleLoading, isAuthenticated, navigate]);

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const [voices, comments, actions, feedback, collaborations] = await Promise.all([
        supabase.from("voices").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("actions").select("id", { count: "exact", head: true }),
        supabase.from("feedback").select("id", { count: "exact", head: true }),
        supabase.from("feedback").select("id", { count: "exact", head: true }).eq("type", "collaboration"),
      ]);

      return {
        voices: voices.count || 0,
        comments: comments.count || 0,
        actions: actions.count || 0,
        feedback: feedback.count || 0,
        collaborations: collaborations.count || 0,
      };
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <AdminPasswordDialog open={!isAuthenticated} onSuccess={() => setIsAuthenticated(true)} />;
  }

  // Show loading while checking admin role
  if (roleLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage your platform</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Voices</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.voices || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.comments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Actions</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.actions || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Collabs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.collaborations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">Feedback</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{stats?.feedback || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <ScrollArea className="w-full whitespace-nowrap rounded-md mb-6">
            <TabsList className="inline-flex h-12 items-center justify-start w-max">
              <TabsTrigger value="voices" className="flex items-center gap-2 min-h-[44px] px-4">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Voices</span>
              </TabsTrigger>
              <TabsTrigger value="comments" className="flex items-center gap-2 min-h-[44px] px-4">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Comments</span>
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2 min-h-[44px] px-4">
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Actions</span>
              </TabsTrigger>
              <TabsTrigger value="collaborations" className="flex items-center gap-2 min-h-[44px] px-4">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Collaborations</span>
              </TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-2 min-h-[44px] px-4">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback</span>
              </TabsTrigger>
              <TabsTrigger value="partners" className="flex items-center gap-2 min-h-[44px] px-4">
                <Handshake className="h-4 w-4" />
                <span className="hidden sm:inline">Partners</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center gap-2 min-h-[44px] px-4">
                <UserSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Team</span>
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2 min-h-[44px] px-4">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Topics</span>
              </TabsTrigger>
              <TabsTrigger value="feedback-types" className="flex items-center gap-2 min-h-[44px] px-4">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Feedback Types</span>
              </TabsTrigger>
              <TabsTrigger value="collab-options" className="flex items-center gap-2 min-h-[44px] px-4">
                <FolderTree className="h-4 w-4" />
                <span className="hidden sm:inline">Collab Options</span>
              </TabsTrigger>
              <TabsTrigger value="blog" className="flex items-center gap-2 min-h-[44px] px-4">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Weekly Blog</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2 min-h-[44px] px-4">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
              <TabsTrigger value="export" className="flex items-center gap-2 min-h-[44px] px-4">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </TabsTrigger>
              <TabsTrigger value="registrations" className="flex items-center gap-2 min-h-[44px] px-4">
                <ClipboardList className="h-4 w-4" />
                <span className="hidden sm:inline">Registrations</span>
              </TabsTrigger>
              <TabsTrigger value="donations" className="flex items-center gap-2 min-h-[44px] px-4">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Donations</span>
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center gap-2 min-h-[44px] px-4">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Pages</span>
              </TabsTrigger>
              <TabsTrigger value="banners" className="flex items-center gap-2 min-h-[44px] px-4">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Banners</span>
              </TabsTrigger>
              <TabsTrigger value="developer" className="flex items-center gap-2 min-h-[44px] px-4">
                <Code className="h-4 w-4" />
                <span className="hidden sm:inline">Developer</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2 min-h-[44px] px-4">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="voices">
            <VoicesManagement />
          </TabsContent>

          <TabsContent value="comments">
            <CommentsManagement />
          </TabsContent>

          <TabsContent value="actions">
            <ActionsManagement />
          </TabsContent>

          <TabsContent value="collaborations">
            <CollaborationsManagement />
          </TabsContent>

          <TabsContent value="feedback">
            <FeedbackManagement />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersManagement />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          {/* REMOVED: core-posts tab that was causing build errors */}
          {/* Will be re-added as "team-content" after migration */}

          <TabsContent value="topics">
            <TopicsManagement />
          </TabsContent>

          <TabsContent value="feedback-types">
            <FeedbackTypesManagement />
          </TabsContent>

          <TabsContent value="collab-options">
            <CollaborationOptionsManagement />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManagement />
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="export">
            <DataExportManagement />
          </TabsContent>

          <TabsContent value="registrations">
            <RegistrationsManagement />
          </TabsContent>

          <TabsContent value="donations">
            <DonationsManagement />
          </TabsContent>

          <TabsContent value="pages">
            <StaticPagesManagement />
          </TabsContent>

          <TabsContent value="banners">
            <BannersManagement />
          </TabsContent>

          <TabsContent value="developer">
            <DeveloperInfoManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Voices Management Component
function VoicesManagement() {
  const { data: voices, refetch } = useQuery({
    queryKey: ["adminVoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voices")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("voices")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete voice");
    } else {
      toast.success("Voice deleted successfully");
      refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Voices</CardTitle>
        <CardDescription>View and moderate community voices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {voices?.map((voice) => (
            <div key={voice.id} className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg gap-3">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-lg">{voice.mood}</span>
                  <span className="text-xs md:text-sm font-medium px-2 py-1 bg-primary/10 rounded">
                    {voice.category}
                  </span>
                </div>
                <p className="text-sm mb-2 break-words">{voice.content}</p>
                <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="truncate">{voice.username || "Anonymous"}</span>
                  <span>❤️ {voice.support_count}</span>
                  <span>💬 {voice.comment_count}</span>
                  <span className="hidden sm:inline">{new Date(voice.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(voice.id)}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Comments Management Component
function CommentsManagement() {
  const { data: comments, refetch } = useQuery({
    queryKey: ["adminComments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, voices(content)")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted successfully");
      refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Comments</CardTitle>
        <CardDescription>Moderate community comments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {comments?.map((comment) => (
            <div key={comment.id} className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg gap-3">
              <div className="flex-1 w-full">
                <p className="text-sm mb-2 break-words">{comment.content}</p>
                <div className="flex items-center gap-2 md:gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="truncate">{comment.author_name || "Anonymous"}</span>
                  <span className="hidden sm:inline">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(comment.id)}
                className="w-full sm:w-auto"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Actions Management Component
function ActionsManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "in-progress",
    image_url: "",
  });

  const { data: actions, refetch } = useQuery({
    queryKey: ["adminActions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("actions")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("actions")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete action");
    } else {
      toast.success("Action deleted successfully");
      refetch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingAction) {
      const { error } = await supabase
        .from("actions")
        .update(formData)
        .eq("id", editingAction.id);

      if (error) {
        toast.error("Failed to update action");
      } else {
        toast.success("Action updated successfully");
        setDialogOpen(false);
        setEditingAction(null);
        setFormData({ title: "", description: "", status: "in-progress", image_url: "" });
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("actions")
        .insert([formData]);

      if (error) {
        console.error("Create action error:", error);
        if (error.message.includes("row-level security")) {
          toast.error("Permission denied. Admin role required.");
        } else {
          toast.error(`Failed to create action: ${error.message}`);
        }
      } else {
        toast.success("Action created successfully");
        setDialogOpen(false);
        setFormData({ title: "", description: "", status: "in-progress", image_url: "" });
        refetch();
      }
    }
  };

  const handleEdit = (action: any) => {
    setEditingAction(action);
    setFormData({
      title: action.title,
      description: action.description,
      status: action.status,
      image_url: action.image_url || "",
    });
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Actions</CardTitle>
        <CardDescription>Create and manage community actions</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingAction(null);
            setFormData({ title: "", description: "", status: "in-progress", image_url: "" });
          }
        }}>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Create New Action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAction ? "Edit Action" : "Create New Action"}</DialogTitle>
              <DialogDescription>
                {editingAction ? "Update the action details" : "Add a new action to track community initiatives"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Action title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the action..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Input
                  id="status"
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  placeholder="e.g., in-progress, completed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL (optional)</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <Button type="submit" className="w-full">
                {editingAction ? "Update Action" : "Create Action"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {actions?.map((action) => (
            <div key={action.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">{action.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-primary/10 rounded">{action.status}</span>
                  <span>👁️ {action.views || 0}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(action)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(action.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Collaborations Management Component
function CollaborationsManagement() {
  const { data: collaborations, refetch } = useQuery({
    queryKey: ["adminCollaborations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("type", "collaboration")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete collaboration request");
    } else {
      toast.success("Collaboration request deleted successfully");
      refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Collaboration Requests</CardTitle>
        <CardDescription>Manage partnership and collaboration requests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {collaborations?.map((item) => (
            <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 rounded">
                    {item.organization}
                  </span>
                </div>
                <p className="text-sm mb-2">{item.message}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {item.email && <span>📧 {item.email}</span>}
                  {item.phone && <span>📞 {item.phone}</span>}
                  <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {item.phone && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${item.phone.replace(/\D/g, '')}?text=Hi ${item.name}, thank you for your collaboration request with Dynamic Edu.`, '_blank')}
                  >
                    WhatsApp
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!collaborations || collaborations.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No collaboration requests yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Feedback Management Component
function FeedbackManagement() {
  const [editingFeedback, setEditingFeedback] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
    type: "",
    organization: "",
    phone: "",
    rating: 0,
  });

  const { data: feedback, refetch } = useQuery({
    queryKey: ["adminFeedback"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("feedback")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete feedback");
    } else {
      toast.success("Feedback deleted successfully");
      refetch();
    }
  };

  const handleEdit = (item: any) => {
    setEditingFeedback(item);
    setFormData({
      name: item.name || "",
      email: item.email || "",
      message: item.message,
      type: item.type,
      organization: item.organization || "",
      phone: item.phone || "",
      rating: item.rating || 0,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingFeedback) return;

    const { error } = await supabase
      .from("feedback")
      .update({
        name: formData.name || null,
        email: formData.email || null,
        message: formData.message,
        type: formData.type,
        organization: formData.organization || null,
        phone: formData.phone || null,
        rating: formData.rating || null,
      })
      .eq("id", editingFeedback.id);

    if (error) {
      toast.error("Failed to update feedback");
    } else {
      toast.success("Feedback updated successfully");
      setDialogOpen(false);
      setEditingFeedback(null);
      refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>View and manage community feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingFeedback(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Feedback</DialogTitle>
              <DialogDescription>Update feedback details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Input
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">Update Feedback</Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {feedback?.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium px-2 py-1 bg-primary/10 rounded">
                      {item.type}
                    </span>
                    {item.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < item.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-sm mb-2">{item.message}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                    {item.name && <span>{item.name}</span>}
                    {item.email && <span>{item.email}</span>}
                    {item.organization && <span>{item.organization}</span>}
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!feedback || feedback.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No feedback yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Data Export Management Component
function DataExportManagement() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const exportData = async (tableName: string, displayName: string) => {
    setIsExporting(tableName);
    try {
      let query = supabase.from(tableName as any).select("*");
      const { data, error } = await query;

      if (error) throw error;

      // Convert to CSV
      if (!data || data.length === 0) {
        toast.error(`No ${displayName} data to export`);
        return;
      }

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map(row => 
          headers.map(header => {
            const value = (row as any)[header];
            if (value === null || value === undefined) return "";
            if (typeof value === "object") return JSON.stringify(value).replace(/"/g, '""');
            return String(value).includes(",") ? `"${value}"` : value;
          }).join(",")
        )
      ].join("\n");

      // Download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${tableName}_export_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`${displayName} exported successfully`);
    } catch (error: any) {
      toast.error(`Failed to export ${displayName}: ${error.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const exportAllData = async () => {
    setIsExporting("all");
    try {
      const tables = [
        { name: "user_profiles", display: "Users" },
        { name: "voices", display: "Posts" },
        { name: "comments", display: "Comments" },
        { name: "weekly_blogs", display: "Blogs" },
        { name: "feedback", display: "Feedback" },
        { name: "partners", display: "Partners" },
        { name: "actions", display: "Actions" },
        { name: "team_members", display: "Team Members" },
      ];

      const allData: Record<string, any[]> = {};

      for (const table of tables) {
        const { data } = await supabase.from(table.name as any).select("*");
        allData[table.name] = data || [];
      }

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `yourvoice_full_export_${new Date().toISOString().split("T")[0]}.json`;
      link.click();

      toast.success("All data exported successfully");
    } catch (error: any) {
      toast.error(`Failed to export: ${error.message}`);
    } finally {
      setIsExporting(null);
    }
  };

  const exportItems = [
    { table: "user_profiles", name: "Users", icon: User, description: "All user profiles and account data" },
    { table: "voices", name: "Posts/Voices", icon: MessageCircle, description: "All community posts and opinions" },
    { table: "comments", name: "Comments", icon: MessageSquare, description: "All comments on posts" },
    { table: "weekly_blogs", name: "Blogs", icon: BookOpen, description: "All blog articles" },
    { table: "feedback", name: "Feedback", icon: Star, description: "All feedback submissions" },
    { table: "partners", name: "Partners", icon: Handshake, description: "Partner organizations" },
    { table: "actions", name: "Actions", icon: Lightbulb, description: "Community actions and initiatives" },
    { table: "team_members", name: "Team", icon: UserSquare, description: "Team member profiles" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Data Export
        </CardTitle>
        <CardDescription>Export platform data for analytics, backup, or AI training</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Export All Button */}
        <Button 
          onClick={exportAllData} 
          disabled={isExporting !== null}
          className="w-full mb-6"
          size="lg"
        >
          {isExporting === "all" ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
              Exporting All Data...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export All Data (JSON)
            </>
          )}
        </Button>

        <div className="text-sm text-muted-foreground mb-4">Or export individual tables as CSV:</div>

        <div className="grid gap-3 sm:grid-cols-2">
          {exportItems.map((item) => (
            <div 
              key={item.table}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportData(item.table, item.name)}
                disabled={isExporting !== null}
              >
                {isExporting === item.table ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
