import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Upload, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function BannersManagement() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    banner_type: "update",
    title: "",
    description: "",
    image_url: "",
    external_link: "",
    position: "home-hero",
    display_order: 0,
    is_active: true,
    starts_at: "",
    ends_at: "",
  });

  const { data: banners, refetch } = useQuery({
    queryKey: ["adminBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: urlData.publicUrl });
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title && !formData.description && !formData.image_url) {
      toast.error("Please add content to the banner");
      return;
    }

    try {
      const payload = {
        banner_type: formData.banner_type,
        title: formData.title || null,
        description: formData.description || null,
        image_url: formData.image_url || null,
        external_link: formData.external_link || null,
        position: formData.position,
        display_order: formData.display_order,
        is_active: formData.is_active,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
      };

      if (editingBanner) {
        const { error } = await supabase
          .from("banners")
          .update(payload)
          .eq("id", editingBanner.id);
        if (error) throw error;
        toast.success("Banner updated");
      } else {
        const { error } = await supabase
          .from("banners")
          .insert([payload]);
        if (error) throw error;
        toast.success("Banner created");
      }

      setDialogOpen(false);
      setEditingBanner(null);
      resetForm();
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save banner");
    }
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      banner_type: banner.banner_type || "update",
      title: banner.title || "",
      description: banner.description || "",
      image_url: banner.image_url || "",
      external_link: banner.external_link || "",
      position: banner.position || "home-hero",
      display_order: banner.display_order || 0,
      is_active: banner.is_active ?? true,
      starts_at: banner.starts_at ? banner.starts_at.split("T")[0] : "",
      ends_at: banner.ends_at ? banner.ends_at.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      toast.success("Banner deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleToggleActive = async (banner: any) => {
    try {
      const { error } = await supabase
        .from("banners")
        .update({ is_active: !banner.is_active })
        .eq("id", banner.id);
      if (error) throw error;
      toast.success(banner.is_active ? "Banner hidden" : "Banner activated");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    }
  };

  const resetForm = () => {
    setFormData({
      banner_type: "update",
      title: "",
      description: "",
      image_url: "",
      external_link: "",
      position: "home-hero",
      display_order: 0,
      is_active: true,
      starts_at: "",
      ends_at: "",
    });
  };

  const positions = [
    { value: "home-hero", label: "Home Page - Hero" },
    { value: "home-sidebar", label: "Home Page - Sidebar" },
    { value: "wall-top", label: "Wall Page - Top" },
    { value: "blog-sidebar", label: "Blog - Sidebar" },
    { value: "footer", label: "Footer" },
  ];

  const bannerTypes = [
    { value: "update", label: "Update/News" },
    { value: "announcement", label: "Announcement" },
    { value: "ad", label: "Advertisement" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Banners & Ads</CardTitle>
            <CardDescription>Manage promotional banners and announcements</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingBanner(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Banner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingBanner ? "Edit Banner" : "Create Banner"}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={formData.banner_type}
                      onValueChange={(value) => setFormData({ ...formData, banner_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {bannerTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value) => setFormData({ ...formData, position: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos.value} value={pos.value}>
                            {pos.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Banner title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Banner description..."
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image</Label>
                  {formData.image_url ? (
                    <div className="relative inline-block">
                      <img src={formData.image_url} alt="Banner" className="h-24 rounded border" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, image_url: "" })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>External Link (optional)</Label>
                  <Input
                    value={formData.external_link}
                    onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  {editingBanner ? "Update Banner" : "Create Banner"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {banners?.map((banner) => (
            <div key={banner.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4 flex-1">
                {banner.image_url && (
                  <img
                    src={banner.image_url}
                    alt={banner.title || "Banner"}
                    className="w-16 h-16 rounded object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{banner.title || "Untitled"}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      banner.banner_type === "ad" 
                        ? "bg-amber-100 text-amber-800"
                        : banner.banner_type === "announcement"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                    }`}>
                      {banner.banner_type}
                    </span>
                    {banner.is_active ? (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">Hidden</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{banner.position}</p>
                  {banner.starts_at || banner.ends_at ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {banner.starts_at && `From: ${format(new Date(banner.starts_at), "MMM d")}`}
                      {banner.starts_at && banner.ends_at && " - "}
                      {banner.ends_at && `Until: ${format(new Date(banner.ends_at), "MMM d")}`}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(banner)}
                >
                  {banner.is_active ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleEdit(banner)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(banner.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {(!banners || banners.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              No banners yet. Create your first banner!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
