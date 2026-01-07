import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Upload, X } from "lucide-react";
import { toast } from "sonner";

export function TeamManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    whatsapp: "",
    profile_image: "",
    bio: "",
    is_active: true,
    display_order: 0,
    panel_enabled: false,
    panel_password: "",
    permissions: {
      create_posts: true,
      create_blogs: false,
      pin_posts: false,
      respond_comments: true,
      manage_blogs: false,
    },
  });

  const { data: teamMembers, refetch } = useQuery({
    queryKey: ["adminTeam"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete team member");
    } else {
      toast.success("Team member deleted successfully");
      refetch();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMember) {
      const { error } = await supabase
        .from("team_members")
        .update(formData)
        .eq("id", editingMember.id);

      if (error) {
        toast.error("Failed to update team member");
      } else {
        toast.success("Team member updated successfully");
        setDialogOpen(false);
        setEditingMember(null);
        resetForm();
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("team_members")
        .insert([formData]);

      if (error) {
        toast.error("Failed to add team member");
      } else {
        toast.success("Team member added successfully");
        setDialogOpen(false);
        resetForm();
        refetch();
      }
    }
  };

  const handleEdit = (member: any) => {
    setEditingMember(member);
    const permissions = member.permissions || {};
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      whatsapp: member.whatsapp,
      profile_image: member.profile_image || "",
      bio: member.bio || "",
      is_active: member.is_active,
      display_order: member.display_order,
      panel_enabled: member.panel_enabled || false,
      panel_password: member.panel_password || "",
      permissions: {
        create_posts: permissions.create_posts ?? true,
        create_blogs: permissions.create_blogs ?? false,
        pin_posts: permissions.pin_posts ?? false,
        respond_comments: permissions.respond_comments ?? true,
        manage_blogs: permissions.manage_blogs ?? false,
      },
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      role: "",
      email: "",
      phone: "",
      whatsapp: "",
      profile_image: "",
      bio: "",
      is_active: true,
      display_order: 0,
      panel_enabled: false,
      panel_password: "",
      permissions: {
        create_posts: true,
        create_blogs: false,
        pin_posts: false,
        respond_comments: true,
        manage_blogs: false,
      },
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('team-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('team-avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, profile_image: publicUrl });
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, profile_image: "" });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Team Members</CardTitle>
        <CardDescription>Manage your team displayed on the Team page</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingMember(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Update team member information" : "Add a new member to your team"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Input
                  id="role"
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Director, Coordinator, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251912345678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                <Input
                  id="whatsapp"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="+251912345678"
                />
              </div>
              <div className="space-y-2">
                <Label>Profile Image</Label>
                {formData.profile_image ? (
                  <div className="relative w-full p-4 border rounded-lg bg-muted/50">
                    <div className="flex items-center gap-4">
                      <img 
                        src={formData.profile_image} 
                        alt="Preview" 
                        className="h-24 w-24 rounded-full object-cover border-2 border-border"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Image uploaded</p>
                        <p className="text-xs text-muted-foreground">Click remove to change image</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveImage}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="profile_image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <label htmlFor="profile_image" className="cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-3 rounded-full bg-primary/10">
                          <Upload className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {uploading ? "Uploading..." : "Drop image here or click to upload"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            JPG, PNG or WEBP (max 2MB)
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="A brief description..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active (shown on website)</Label>
              </div>
              
              {/* Team Panel Access Section */}
              <div className="border-t pt-4 mt-4 space-y-4">
                <h4 className="font-medium text-sm">Team Panel Access</h4>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="panel_enabled"
                    checked={formData.panel_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, panel_enabled: checked })}
                  />
                  <Label htmlFor="panel_enabled">Enable Team Panel Access</Label>
                </div>
                {formData.panel_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="panel_password">Panel Login Password</Label>
                      <Input
                        id="panel_password"
                        type="password"
                        value={formData.panel_password}
                        onChange={(e) => setFormData({ ...formData, panel_password: e.target.value })}
                        placeholder="Set password for team panel login"
                      />
                      <p className="text-xs text-muted-foreground">
                        This password will be used by the team member to login to their Team Panel
                      </p>
                    </div>

                    {/* Permissions */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm font-medium">Permissions</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="perm_posts"
                            checked={formData.permissions.create_posts}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, create_posts: checked }
                            })}
                          />
                          <Label htmlFor="perm_posts" className="text-sm">Create Posts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="perm_blogs"
                            checked={formData.permissions.create_blogs}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, create_blogs: checked }
                            })}
                          />
                          <Label htmlFor="perm_blogs" className="text-sm">Create Blogs</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="perm_pin"
                            checked={formData.permissions.pin_posts}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, pin_posts: checked }
                            })}
                          />
                          <Label htmlFor="perm_pin" className="text-sm">Pin Posts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="perm_respond"
                            checked={formData.permissions.respond_comments}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, respond_comments: checked }
                            })}
                          />
                          <Label htmlFor="perm_respond" className="text-sm">Respond as Team</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="perm_manage_blogs"
                            checked={formData.permissions.manage_blogs}
                            onCheckedChange={(checked) => setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, manage_blogs: checked }
                            })}
                          />
                          <Label htmlFor="perm_manage_blogs" className="text-sm">Manage Blogs</Label>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <Button type="submit" className="w-full">
                {editingMember ? "Update Team Member" : "Add Team Member"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {teamMembers?.map((member) => (
            <div key={member.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex gap-4 flex-1">
                {member.profile_image ? (
                  <img src={member.profile_image} alt={member.name} className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-xl font-semibold">{member.name[0]}</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{member.name}</h3>
                    {member.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">Inactive</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                  {member.bio && <p className="text-sm text-muted-foreground mb-2">{member.bio}</p>}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>📧 {member.email}</span>
                    <span>📞 {member.phone}</span>
                    <span>💬 {member.whatsapp}</span>
                    <span>📊 Order: {member.display_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(member)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!teamMembers || teamMembers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No team members yet. Add one to get started!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
