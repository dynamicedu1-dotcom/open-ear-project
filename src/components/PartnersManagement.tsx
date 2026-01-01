import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Upload, X, Image } from "lucide-react";
import { toast } from "sonner";

export function PartnersManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    logo_url: "",
    description: "",
    website: "",
    testimonial: "",
    is_active: true,
    display_order: 0,
  });

  const { data: partners, refetch } = useQuery({
    queryKey: ["adminPartners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("partners")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete partner");
    } else {
      toast.success("Partner deleted successfully");
      refetch();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `partner-logo-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("partner-logos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("partner-logos")
        .getPublicUrl(fileName);
      
      setFormData({ ...formData, logo_url: urlData.publicUrl });
      setLogoPreview(urlData.publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" });
    setLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPartner) {
      const { error } = await supabase
        .from("partners")
        .update(formData)
        .eq("id", editingPartner.id);

      if (error) {
        toast.error("Failed to update partner");
      } else {
        toast.success("Partner updated successfully");
        setDialogOpen(false);
        setEditingPartner(null);
        resetForm();
        refetch();
      }
    } else {
      const { error } = await supabase
        .from("partners")
        .insert([formData]);

      if (error) {
        toast.error("Failed to create partner");
      } else {
        toast.success("Partner created successfully");
        setDialogOpen(false);
        resetForm();
        refetch();
      }
    }
  };

  const handleEdit = (partner: any) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo_url: partner.logo_url || "",
      description: partner.description || "",
      website: partner.website || "",
      testimonial: partner.testimonial || "",
      is_active: partner.is_active,
      display_order: partner.display_order,
    });
    setLogoPreview(partner.logo_url || null);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      logo_url: "",
      description: "",
      website: "",
      testimonial: "",
      is_active: true,
      display_order: 0,
    });
    setLogoPreview(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Partners</CardTitle>
        <CardDescription>Showcase trusted organizations on the Collaborate page</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingPartner(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Add New Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edit Partner" : "Add New Partner"}</DialogTitle>
              <DialogDescription>
                {editingPartner ? "Update partner information" : "Add a new organization to showcase as a trusted partner"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Partner organization name"
                />
              </div>
              
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label>Logo Image</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {logoPreview || formData.logo_url ? (
                  <div className="relative w-full p-4 border rounded-lg bg-muted">
                    <img 
                      src={logoPreview || formData.logo_url} 
                      alt="Logo preview" 
                      className="h-20 w-auto object-contain mx-auto"
                    />
                    <div className="flex gap-2 justify-center mt-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Replace
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload logo image
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG up to 5MB
                    </p>
                    {isUploading && (
                      <div className="mt-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the organization..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="testimonial">Testimonial</Label>
                <Textarea
                  id="testimonial"
                  value={formData.testimonial}
                  onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                  placeholder="What they say about working with Dynamic Edu..."
                  className="min-h-[100px]"
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
                <Label htmlFor="is_active">Display on website</Label>
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {editingPartner ? "Update Partner" : "Add Partner"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          {partners?.map((partner) => (
            <div key={partner.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="flex gap-4 flex-1">
                {partner.logo_url && (
                  <img src={partner.logo_url} alt={partner.name} className="h-12 w-12 object-contain rounded" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{partner.name}</h3>
                    {partner.is_active ? (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded dark:bg-green-900/30 dark:text-green-400">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded">Inactive</span>
                    )}
                  </div>
                  {partner.description && <p className="text-sm text-muted-foreground mb-2">{partner.description}</p>}
                  {partner.testimonial && (
                    <p className="text-sm italic text-muted-foreground">"{partner.testimonial}"</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    {partner.website && <span>🌐 {partner.website}</span>}
                    <span>📊 Order: {partner.display_order}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(partner)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(partner.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {!partners || partners.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No partners yet. Add one to get started!</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}