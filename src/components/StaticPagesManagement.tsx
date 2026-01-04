import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function StaticPagesManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any>(null);
  const [formData, setFormData] = useState({
    slug: "",
    title: "",
    content: "",
    meta_description: "",
    is_published: true,
  });

  const { data: pages, refetch } = useQuery({
    queryKey: ["adminStaticPages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("static_pages")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async () => {
    if (!formData.slug || !formData.title || !formData.content) {
      toast.error("Please fill in required fields");
      return;
    }

    const slug = formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    try {
      const payload = {
        slug,
        title: formData.title,
        content: formData.content,
        meta_description: formData.meta_description || null,
        is_published: formData.is_published,
        updated_at: new Date().toISOString(),
      };

      if (editingPage) {
        const { error } = await supabase
          .from("static_pages")
          .update(payload)
          .eq("id", editingPage.id);
        if (error) throw error;
        toast.success("Page updated");
      } else {
        const { error } = await supabase
          .from("static_pages")
          .insert([payload]);
        if (error) throw error;
        toast.success("Page created");
      }

      setDialogOpen(false);
      setEditingPage(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save page");
    }
  };

  const handleEdit = (page: any) => {
    setEditingPage(page);
    setFormData({
      slug: page.slug,
      title: page.title,
      content: page.content,
      meta_description: page.meta_description || "",
      is_published: page.is_published,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("static_pages").delete().eq("id", id);
      if (error) throw error;
      toast.success("Page deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleTogglePublish = async (page: any) => {
    try {
      const { error } = await supabase
        .from("static_pages")
        .update({ is_published: !page.is_published })
        .eq("id", page.id);
      if (error) throw error;
      toast.success(page.is_published ? "Page unpublished" : "Page published");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  const resetForm = () => {
    setFormData({
      slug: "",
      title: "",
      content: "",
      meta_description: "",
      is_published: true,
    });
  };

  // Common page templates
  const templates = [
    { slug: "terms-of-service", title: "Terms of Service" },
    { slug: "privacy-policy", title: "Privacy Policy" },
    { slug: "community-guidelines", title: "Community Guidelines" },
    { slug: "about-developer", title: "About Developer" },
    { slug: "faq", title: "FAQ" },
  ];

  const applyTemplate = (template: { slug: string; title: string }) => {
    setFormData({
      ...formData,
      slug: template.slug,
      title: template.title,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Static Pages</CardTitle>
            <CardDescription>Manage Terms, Privacy Policy, and other pages</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingPage(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPage ? "Edit Page" : "Create Page"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Quick Templates */}
                {!editingPage && (
                  <div className="space-y-2">
                    <Label>Quick Templates</Label>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((t) => (
                        <Button
                          key={t.slug}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => applyTemplate(t)}
                        >
                          {t.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>URL Slug *</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="terms-of-service"
                    disabled={!!editingPage}
                  />
                  <p className="text-xs text-muted-foreground">
                    Page URL: /page/{formData.slug || "your-slug"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Page Title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Content *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Write your page content here..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text with line breaks preserved
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Meta Description (SEO)</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
                    placeholder="Brief description for search engines..."
                    className="min-h-[60px]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label>Published</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingPage ? "Update Page" : "Create Page"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {pages?.map((page) => (
            <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{page.title}</h3>
                  {page.is_published ? (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">Published</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">Draft</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">/page/{page.slug}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Updated {format(new Date(page.updated_at), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                >
                  <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleTogglePublish(page)}
                >
                  {page.is_published ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(page)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {(!pages || pages.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No pages yet. Create your first static page!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
