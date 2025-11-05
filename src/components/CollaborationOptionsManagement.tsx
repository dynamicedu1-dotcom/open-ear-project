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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Edit } from "lucide-react";
import { toast } from "sonner";

interface Option {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

type TableName = "collaboration_types" | "collaboration_areas";

const OptionManager = ({ tableName, title }: { tableName: TableName; title: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", display_order: 0, is_active: true });
  const queryClient = useQueryClient();

  const { data: options = [], isLoading } = useQuery({
    queryKey: [`admin-${tableName}`],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as Option[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from(tableName).insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      toast.success(`${title} created successfully`);
      setIsOpen(false);
      setFormData({ name: "", description: "", display_order: 0, is_active: true });
    },
    onError: (error) => {
      toast.error(`Failed to create: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from(tableName).update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      toast.success(`${title} updated successfully`);
      setIsOpen(false);
      setEditingOption(null);
      setFormData({ name: "", description: "", display_order: 0, is_active: true });
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`admin-${tableName}`] });
      toast.success(`${title} deleted successfully`);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingOption) {
      updateMutation.mutate({ id: editingOption.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (option: Option) => {
    setEditingOption(option);
    setFormData({ name: option.name, description: option.description || "", display_order: option.display_order, is_active: option.is_active });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete this ${title.toLowerCase()}?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading {title.toLowerCase()}...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg sm:text-xl font-semibold">{title}</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { setEditingOption(null); setFormData({ name: "", description: "", display_order: 0, is_active: true }); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingOption ? `Edit ${title}` : `Add New ${title}`}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
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
                {editingOption ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {options.map((option) => (
          <Card key={option.id} className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base">{option.name}</h4>
                {option.description && <p className="text-sm text-muted-foreground">{option.description}</p>}
                <p className="text-xs text-muted-foreground">
                  Order: {option.display_order} • {option.is_active ? "Active" : "Inactive"}
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" onClick={() => handleEdit(option)} className="flex-1 sm:flex-none">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(option.id)} className="flex-1 sm:flex-none">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export const CollaborationOptionsManagement = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold">Collaboration Options Management</h2>
      <Tabs defaultValue="types" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="types">Organization Types</TabsTrigger>
          <TabsTrigger value="areas">Collaboration Areas</TabsTrigger>
        </TabsList>
        <TabsContent value="types" className="mt-6">
          <OptionManager tableName="collaboration_types" title="Organization Type" />
        </TabsContent>
        <TabsContent value="areas" className="mt-6">
          <OptionManager tableName="collaboration_areas" title="Collaboration Area" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
