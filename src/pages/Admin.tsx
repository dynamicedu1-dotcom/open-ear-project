import { useState } from "react";
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
import { ArrowLeft, Users, MessageSquare, Lightbulb, MessageCircle, Star, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { PartnersManagement } from "@/components/PartnersManagement";
import { TeamManagement } from "@/components/TeamManagement";

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("voices");

  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAuth } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth?redirect=/admin');
        return false;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      return !!data;
    },
  });

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
    enabled: isAdmin,
  });

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">Checking access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Voices</CardTitle>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.voices || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.comments || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Actions</CardTitle>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.actions || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Collaborations</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.collaborations || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Feedback Items</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.feedback || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="voices">Voices</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
            <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
            <TabsTrigger value="partners">Partners</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

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
            <div key={voice.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{voice.mood}</span>
                  <span className="text-sm font-medium px-2 py-1 bg-primary/10 rounded">
                    {voice.category}
                  </span>
                </div>
                <p className="text-sm mb-2">{voice.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{voice.username || "Anonymous"}</span>
                  <span>❤️ {voice.support_count}</span>
                  <span>💬 {voice.comment_count}</span>
                  <span>{new Date(voice.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(voice.id)}
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
            <div key={comment.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <p className="text-sm mb-2">{comment.content}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{comment.author_name || "Anonymous"}</span>
                  <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(comment.id)}
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
        toast.error("Failed to create action");
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
  const { data: feedback } = useQuery({
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback</CardTitle>
        <CardDescription>View community feedback</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {feedback?.map((item) => (
            <div key={item.id} className="p-4 border rounded-lg">
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
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {item.name && <span>{item.name}</span>}
                {item.email && <span>{item.email}</span>}
                {item.organization && <span>{item.organization}</span>}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

