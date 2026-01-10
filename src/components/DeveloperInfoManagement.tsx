import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Save, Upload, Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DeveloperInfo {
  name: string;
  role: string;
  bio: string;
  profileImage: string;
  skills: string[];
  social: {
    github?: string;
    linkedin?: string;
    twitter?: string;
    website?: string;
    email?: string;
  };
}

const defaultDeveloperInfo: DeveloperInfo = {
  name: "",
  role: "",
  bio: "",
  profileImage: "",
  skills: [],
  social: {},
};

export function DeveloperInfoManagement() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<DeveloperInfo>(defaultDeveloperInfo);
  const [newSkill, setNewSkill] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["aboutDeveloperPage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("static_pages")
        .select("*")
        .eq("slug", "about-developer")
        .maybeSingle();

      if (error) throw error;

      if (data?.content) {
        try {
          const parsed = JSON.parse(data.content);
          setFormData({
            ...defaultDeveloperInfo,
            ...parsed,
            skills: parsed.skills || [],
            social: parsed.social || {},
          });
        } catch {
          setFormData(defaultDeveloperInfo);
        }
      }

      return data;
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `developer-profile-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, profileImage: urlData.publicUrl }));
      toast.success("Image uploaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill),
    }));
  };

  const updateSocial = (key: keyof DeveloperInfo['social'], value: string) => {
    setFormData(prev => ({
      ...prev,
      social: { ...prev.social, [key]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const content = JSON.stringify(formData);

      if (pageData) {
        const { error } = await supabase
          .from("static_pages")
          .update({
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", pageData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("static_pages").insert({
          slug: "about-developer",
          title: "About Developer",
          content,
          is_published: true,
        });

        if (error) throw error;
      }

      toast.success("Developer info saved!");
      queryClient.invalidateQueries({ queryKey: ["aboutDeveloperPage"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>About Developer</CardTitle>
            <CardDescription>Manage your developer profile page</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <a href="/about-developer" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview
            </a>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Image */}
        <div className="space-y-2">
          <Label>Profile Image</Label>
          <div className="flex items-center gap-4">
            {formData.profileImage ? (
              <img
                src={formData.profileImage}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <input
              type="file"
              ref={imageInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Image"}
            </Button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Role / Title</Label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              placeholder="e.g., Full Stack Developer"
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label>Bio</Label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell visitors about yourself..."
            rows={5}
          />
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <Label>Skills</Label>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <Button type="button" onClick={addSkill} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="space-y-4">
          <Label>Social Links</Label>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">GitHub</Label>
              <Input
                value={formData.social.github || ""}
                onChange={(e) => updateSocial("github", e.target.value)}
                placeholder="https://github.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">LinkedIn</Label>
              <Input
                value={formData.social.linkedin || ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Twitter</Label>
              <Input
                value={formData.social.twitter || ""}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Website</Label>
              <Input
                value={formData.social.website || ""}
                onChange={(e) => updateSocial("website", e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs text-muted-foreground">Email</Label>
              <Input
                type="email"
                value={formData.social.email || ""}
                onChange={(e) => updateSocial("email", e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={isSaving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Developer Info"}
        </Button>
      </CardContent>
    </Card>
  );
}
