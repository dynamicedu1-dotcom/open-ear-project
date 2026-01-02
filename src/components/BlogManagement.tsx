import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Calendar, Upload, X, Users, DollarSign, FileText, Megaphone, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
  blog_type: string;
  event_date: string | null;
  event_end_date: string | null;
  event_location: string | null;
  event_slots: number | null;
  registration_fields: any[];
  is_paid: boolean;
  price: number | null;
  payment_info: any;
  registration_deadline: string | null;
  requires_approval: boolean;
  max_registrations: number | null;
  team_can_edit: boolean;
}

const BLOG_TYPES = [
  { value: "article", label: "Article", icon: FileText, description: "Regular blog post" },
  { value: "event", label: "Event", icon: Calendar, description: "Event with registration" },
  { value: "announcement", label: "Announcement", icon: Megaphone, description: "Important notice" },
  { value: "registration", label: "Registration", icon: ClipboardList, description: "Open registration form" },
];

const DEFAULT_REGISTRATION_FIELDS = [
  { name: "name", label: "Full Name", type: "text", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "phone", label: "Phone Number", type: "tel", required: false },
];

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
    blog_type: "article",
    event_date: "",
    event_end_date: "",
    event_location: "",
    event_slots: 0,
    registration_fields: DEFAULT_REGISTRATION_FIELDS,
    is_paid: false,
    price: 0,
    payment_info: {},
    registration_deadline: "",
    requires_approval: false,
    max_registrations: 0,
    team_can_edit: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [customField, setCustomField] = useState({ name: "", label: "", type: "text", required: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      blog_type: "article",
      event_date: "",
      event_end_date: "",
      event_location: "",
      event_slots: 0,
      registration_fields: DEFAULT_REGISTRATION_FIELDS,
      is_paid: false,
      price: 0,
      payment_info: {},
      registration_deadline: "",
      requires_approval: false,
      max_registrations: 0,
      team_can_edit: false,
    });
    setEditingBlog(null);
    setImageFile(null);
    setImagePreview(null);
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
      blog_type: blog.blog_type || "article",
      event_date: blog.event_date ? blog.event_date.split('T')[0] + 'T' + (blog.event_date.split('T')[1]?.substring(0, 5) || "09:00") : "",
      event_end_date: blog.event_end_date ? blog.event_end_date.split('T')[0] + 'T' + (blog.event_end_date.split('T')[1]?.substring(0, 5) || "17:00") : "",
      event_location: blog.event_location || "",
      event_slots: blog.event_slots || 0,
      registration_fields: blog.registration_fields?.length ? blog.registration_fields : DEFAULT_REGISTRATION_FIELDS,
      is_paid: blog.is_paid || false,
      price: blog.price || 0,
      payment_info: blog.payment_info || {},
      registration_deadline: blog.registration_deadline ? blog.registration_deadline.split('T')[0] : "",
      requires_approval: blog.requires_approval || false,
      max_registrations: blog.max_registrations || 0,
      team_can_edit: blog.team_can_edit || false,
    });
    setImagePreview(blog.cover_image_url || null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setFormData({ ...formData, cover_image_url: "" });
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, cover_image_url: "" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addRegistrationField = () => {
    if (!customField.name || !customField.label) {
      toast.error("Field name and label are required");
      return;
    }
    setFormData({
      ...formData,
      registration_fields: [...formData.registration_fields, { ...customField }],
    });
    setCustomField({ name: "", label: "", type: "text", required: false });
  };

  const removeRegistrationField = (index: number) => {
    setFormData({
      ...formData,
      registration_fields: formData.registration_fields.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let coverImageUrl = formData.cover_image_url;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `blog-cover-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("blog-images")
          .getPublicUrl(fileName);
        
        coverImageUrl = urlData.publicUrl;
      }

      const payload: any = {
        title: formData.title,
        content: formData.content,
        summary: formData.summary || null,
        cover_image_url: coverImageUrl || null,
        author_name: formData.author_name || "Dynamic Edu",
        is_published: formData.is_published,
        publish_date: formData.publish_date || null,
        blog_type: formData.blog_type,
        team_can_edit: formData.team_can_edit,
      };

      // Add event/registration specific fields
      if (formData.blog_type === "event" || formData.blog_type === "registration") {
        payload.event_date = formData.event_date ? new Date(formData.event_date).toISOString() : null;
        payload.event_end_date = formData.event_end_date ? new Date(formData.event_end_date).toISOString() : null;
        payload.event_location = formData.event_location || null;
        payload.event_slots = formData.event_slots || null;
        payload.registration_fields = formData.registration_fields;
        payload.is_paid = formData.is_paid;
        payload.price = formData.is_paid ? formData.price : 0;
        payload.payment_info = formData.payment_info;
        payload.registration_deadline = formData.registration_deadline ? new Date(formData.registration_deadline).toISOString() : null;
        payload.requires_approval = formData.requires_approval;
        payload.max_registrations = formData.max_registrations || null;
      }

      if (editingBlog) {
        const { error } = await supabase
          .from("weekly_blogs")
          .update(payload)
          .eq("id", editingBlog.id);

        if (error) throw error;
        toast.success("Blog post updated successfully");
      } else {
        const { error } = await supabase.from("weekly_blogs").insert([payload]);

        if (error) throw error;
        toast.success("Blog post created successfully");
      }

      setDialogOpen(false);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save blog post");
    } finally {
      setIsUploading(false);
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

  const getBlogTypeIcon = (type: string) => {
    const blogType = BLOG_TYPES.find(t => t.value === type);
    if (blogType) {
      const Icon = blogType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const getBlogTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      article: "bg-blue-500/20 text-blue-600",
      event: "bg-purple-500/20 text-purple-600",
      announcement: "bg-orange-500/20 text-orange-600",
      registration: "bg-green-500/20 text-green-600",
    };
    return colors[type] || colors.article;
  };

  const showEventFields = formData.blog_type === "event" || formData.blog_type === "registration";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Blog & Events Management</CardTitle>
            <CardDescription>Create articles, events, announcements, and registration forms</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBlog ? "Edit Post" : "Create New Post"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {/* Blog Type Selection */}
                <div>
                  <Label>Post Type *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {BLOG_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, blog_type: type.value })}
                          className={`p-3 rounded-lg border text-left transition-all ${
                            formData.blog_type === type.value
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Icon className="h-5 w-5 mb-1" />
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter title"
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
                    placeholder="Full content"
                    rows={8}
                    required
                  />
                </div>

                {/* Event/Registration Fields */}
                {showEventFields && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formData.blog_type === "event" ? "Event Details" : "Registration Details"}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_date">Start Date & Time</Label>
                        <Input
                          id="event_date"
                          type="datetime-local"
                          value={formData.event_date}
                          onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="event_end_date">End Date & Time</Label>
                        <Input
                          id="event_end_date"
                          type="datetime-local"
                          value={formData.event_end_date}
                          onChange={(e) => setFormData({ ...formData, event_end_date: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="event_location">Location/Venue</Label>
                      <Input
                        id="event_location"
                        value={formData.event_location}
                        onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                        placeholder="e.g., Online / City Hall, Mumbai"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="event_slots">Available Slots (0 = unlimited)</Label>
                        <Input
                          id="event_slots"
                          type="number"
                          min="0"
                          value={formData.event_slots}
                          onChange={(e) => setFormData({ ...formData, event_slots: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="registration_deadline">Registration Deadline</Label>
                        <Input
                          id="registration_deadline"
                          type="date"
                          value={formData.registration_deadline}
                          onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Payment Options */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          id="is_paid"
                          checked={formData.is_paid}
                          onCheckedChange={(checked) => setFormData({ ...formData, is_paid: checked })}
                        />
                        <Label htmlFor="is_paid">Paid Registration</Label>
                      </div>
                      {formData.is_paid && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                            className="w-32"
                            placeholder="Amount"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="requires_approval"
                        checked={formData.requires_approval}
                        onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
                      />
                      <Label htmlFor="requires_approval">Require Admin Approval</Label>
                    </div>

                    {/* Registration Fields */}
                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4" />
                        Registration Form Fields
                      </Label>
                      <div className="space-y-2">
                        {formData.registration_fields.map((field, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
                            <span className="flex-1 text-sm">{field.label} ({field.type})</span>
                            {field.required && <Badge variant="secondary">Required</Badge>}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRegistrationField(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Input
                          placeholder="Field name"
                          value={customField.name}
                          onChange={(e) => setCustomField({ ...customField, name: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                          className="w-28"
                        />
                        <Input
                          placeholder="Label"
                          value={customField.label}
                          onChange={(e) => setCustomField({ ...customField, label: e.target.value })}
                          className="w-32"
                        />
                        <Select value={customField.type} onValueChange={(v) => setCustomField({ ...customField, type: v })}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="tel">Phone</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={customField.required}
                            onCheckedChange={(c) => setCustomField({ ...customField, required: c })}
                          />
                          <Label className="text-xs">Req</Label>
                        </div>
                        <Button type="button" size="sm" onClick={addRegistrationField}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cover Image */}
                <div>
                  <Label>Cover Image</Label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="relative mt-2">
                      <img
                        src={imagePreview}
                        alt="Cover preview"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      <div className="text-center text-xs text-muted-foreground">or</div>
                      <Input
                        id="cover_image_url"
                        value={formData.cover_image_url}
                        onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                        placeholder="Enter image URL"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                </div>

                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                    />
                    <Label htmlFor="is_published">Publish</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="team_can_edit"
                      checked={formData.team_can_edit}
                      onCheckedChange={(checked) => setFormData({ ...formData, team_can_edit: checked })}
                    />
                    <Label htmlFor="team_can_edit">Team Can Edit</Label>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Saving..." : editingBlog ? "Update" : "Create"}
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
              <div className="flex gap-3 flex-1 w-full">
                {blog.cover_image_url && (
                  <img
                    src={blog.cover_image_url}
                    alt={blog.title}
                    className="w-20 h-20 object-cover rounded shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getBlogTypeBadge(blog.blog_type || "article")}`}>
                      {getBlogTypeIcon(blog.blog_type || "article")}
                      {BLOG_TYPES.find(t => t.value === blog.blog_type)?.label || "Article"}
                    </span>
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
                    {blog.team_can_edit && (
                      <Badge variant="outline" className="text-xs">Team Edit</Badge>
                    )}
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
                    {blog.event_date && (
                      <span className="flex items-center gap-1 text-primary">
                        <Calendar className="h-3 w-3" />
                        Event: {new Date(blog.event_date).toLocaleDateString()}
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
              No posts yet. Create your first one!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}