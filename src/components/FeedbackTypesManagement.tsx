import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Edit } from "lucide-react";
import { toast } from "sonner";

interface FeedbackType {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export const FeedbackTypesManagement = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingType, setEditingType] = useState<FeedbackType | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", display_order: 0, is_active: true });
  const queryClient = useQueryClient();

  const { data: types = [], isLoading } = useQuery({
    queryKey: ["admin-feedback-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback_types")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as FeedbackType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("feedback_types").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback-types"] });
      toast.success("Feedback type created successfully");
      setIsOpen(false);
      setFormData({ name: "", description: "", display_order: 0, is_active: true });
    },
    onError: (error) => {
      toast.error(`Failed to create feedback type: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from("feedback_types").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback-types"] });
      toast.success("Feedback type updated successfully");
      setIsOpen(false);
      setEditingType(null);
      setFormData({ name: "", description: "", display_order: 0, is_active: true });
    },
    onError: (error) => {
      toast.error(`Failed to update feedback type: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("feedback_types").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-feedback-types"] });
      toast.success("Feedback type deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete feedback type: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (type: FeedbackType) => {
    setEditingType(type);
    setFormData({ name: type.name, description: type.description || "", display_order: type.display_order, is_active: type.is_active });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this feedback type?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading feedback types...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Feedback Types Management</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingType(null); setFormData({ name: "", description: "", display_order: 0, is_active: true }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingType ? "Edit Feedback Type" : "Add New Feedback Type"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Type Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingType ? "Update" : "Create"} Type
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {types.map((type) => (
          <Card key={type.id} className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-lg">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.description}</p>
                <p className="text-xs text-muted-foreground">
                  Order: {type.display_order} • {type.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => handleEdit(type)} className="flex-1 sm:flex-none">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(type.id)} className="flex-1 sm:flex-none">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
