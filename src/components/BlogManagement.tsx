import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  is_published: boolean;
  publish_date: string | null;
  week_number: number | null;
  views_count: number | null;
  created_at: string;
}

export function BlogManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    cover_image_url: "",
    author_name: "Dynamic Edu",
    is_published: false,
    publish_date: "",
  });

  const { data: blogs, refetch } = useQuery({
    queryKey: ["adminBlogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BlogPost[];
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      cover_image_url: "",
      author_name: "Dynamic Edu",
      is_published: false,
      publish_date: "",
    });
    setEditingBlog(null);
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title,
      content: blog.content,
      summary: blog.summary || "",
      cover_image_url: blog.cover_image_url || "",
      author_name: blog.author_name || "Dynamic Edu",
      is_published: blog.is_published,
      publish_date: blog.publish_date || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("weekly_blogs").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete blog post");
    } else {
      toast.success("Blog post deleted successfully");
      refetch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      content: formData.content,
      summary: formData.summary || null,
      cover_image_url: formData.cover_image_url || null,
      author_name: formData.author_name || "Dynamic Edu",
      is_published: formData.is_published,
      publish_date: formData.publish_date || null,
    };

    if (editingBlog) {
      const { error } = await supabase
        .from("weekly_blogs")
        .update(payload)
        .eq("id", editingBlog.id);

      if (error) {
        toast.error("Failed to update blog post");
      } else {
        toast.success("Blog post updated successfully");
        setDialogOpen(false);
        resetForm();
        refetch();
      }
    } else {
      const { error } = await supabase.from("weekly_blogs").insert([payload]);

      if (error) {
        toast.error("Failed to create blog post");
      } else {
        toast.success("Blog post created successfully");
        setDialogOpen(false);
        resetForm();
        refetch();
      }
    }
  };

  const togglePublish = async (blog: BlogPost) => {
    const { error } = await supabase
      .from("weekly_blogs")
      .update({ is_published: !blog.is_published })
      .eq("id", blog.id);

    if (error) {
      toast.error("Failed to update blog status");
    } else {
      toast.success(blog.is_published ? "Blog unpublished" : "Blog published");
      refetch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Weekly Blog Management</CardTitle>
            <CardDescription>Create and manage blog posts for the community</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Blog Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBlog ? "Edit Blog Post" : "Create New Blog Post"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter blog title"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Textarea
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Brief summary (shown on cards)"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Full blog content"
                    rows={10}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cover_image_url">Cover Image URL</Label>
                  <Input
                    id="cover_image_url"
                    value={formData.cover_image_url}
                    onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <Label htmlFor="author_name">Author Name</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setFormData({ ...formData, author_name: e.target.value })}
                    placeholder="Dynamic Edu"
                  />
                </div>

                <div>
                  <Label htmlFor="publish_date">Publish Date</Label>
                  <Input
                    id="publish_date"
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingBlog ? "Update" : "Create"} Blog Post
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {blogs?.map((blog) => (
            <div
              key={blog.id}
              className="flex flex-col sm:flex-row items-start justify-between p-4 border rounded-lg gap-3"
            >
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="font-semibold">{blog.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      blog.is_published
                        ? "bg-green-500/20 text-green-600"
                        : "bg-yellow-500/20 text-yellow-600"
                    }`}
                  >
                    {blog.is_published ? "Published" : "Draft"}
                  </span>
                </div>
                {blog.summary && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {blog.summary}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>{blog.author_name}</span>
                  {blog.publish_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(blog.publish_date).toLocaleDateString()}
                    </span>
                  )}
                  {blog.views_count !== null && blog.views_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {blog.views_count} views
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(blog)}
                  className="flex-1 sm:flex-none"
                >
                  {blog.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(blog)}
                  className="flex-1 sm:flex-none"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(blog.id)}
                  className="flex-1 sm:flex-none"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {(!blogs || blogs.length === 0) && (
            <div className="text-center py-12 text-muted-foreground">
              No blog posts yet. Create your first one!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
