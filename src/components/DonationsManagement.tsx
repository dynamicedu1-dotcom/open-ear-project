import React, { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Download, Edit, Trash2, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function DonationsManagement() {
  const queryClient = useQueryClient();
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [donationDialogOpen, setDonationDialogOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settingsForm, setSettingsForm] = useState({
    upi_id: "",
    qr_code_url: "",
    description: "",
    goal_amount: "",
    is_active: true,
  });

  const [donationForm, setDonationForm] = useState({
    amount: "",
    donor_name: "",
    donor_email: "",
    is_anonymous: false,
    message: "",
    transaction_id: "",
    status: "completed",
  });

  // Fetch settings
  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ["adminDonationSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      if (data) {
        setSettingsForm({
          upi_id: data.upi_id || "",
          qr_code_url: data.qr_code_url || "",
          description: data.description || "",
          goal_amount: data.goal_amount?.toString() || "",
          is_active: data.is_active ?? true,
        });
      }
      return data;
    },
  });

  // Fetch donations
  const { data: donations, refetch: refetchDonations } = useQuery({
    queryKey: ["adminDonations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalAmount = donations?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
  const donorCount = new Set(donations?.filter(d => d.donor_email).map(d => d.donor_email)).size;

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qr-code-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(fileName);

      setSettingsForm({ ...settingsForm, qr_code_url: urlData.publicUrl });
      toast.success("QR code uploaded");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const payload = {
        upi_id: settingsForm.upi_id || null,
        qr_code_url: settingsForm.qr_code_url || null,
        description: settingsForm.description || null,
        goal_amount: settingsForm.goal_amount ? parseFloat(settingsForm.goal_amount) : null,
        is_active: settingsForm.is_active,
        updated_at: new Date().toISOString(),
      };

      if (settings?.id) {
        const { error } = await supabase
          .from("donation_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("donation_settings")
          .insert([payload]);
        if (error) throw error;
      }

      toast.success("Settings saved");
      setSettingsDialogOpen(false);
      refetchSettings();
    } catch (error: any) {
      toast.error(error.message || "Failed to save settings");
    }
  };

  const handleSaveDonation = async () => {
    if (!donationForm.amount || parseFloat(donationForm.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const payload = {
        amount: parseFloat(donationForm.amount),
        donor_name: donationForm.is_anonymous ? null : donationForm.donor_name || null,
        donor_email: donationForm.donor_email || null,
        is_anonymous: donationForm.is_anonymous,
        message: donationForm.message || null,
        transaction_id: donationForm.transaction_id || null,
        status: donationForm.status,
      };

      if (editingDonation) {
        const { error } = await supabase
          .from("donations")
          .update(payload)
          .eq("id", editingDonation.id);
        if (error) throw error;
        toast.success("Donation updated");
      } else {
        const { error } = await supabase
          .from("donations")
          .insert([payload]);
        if (error) throw error;
        toast.success("Donation added");
      }

      setDonationDialogOpen(false);
      setEditingDonation(null);
      resetDonationForm();
      refetchDonations();
    } catch (error: any) {
      toast.error(error.message || "Failed to save donation");
    }
  };

  const handleDeleteDonation = async (id: string) => {
    try {
      const { error } = await supabase.from("donations").delete().eq("id", id);
      if (error) throw error;
      toast.success("Donation deleted");
      refetchDonations();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
  };

  const handleEditDonation = (donation: any) => {
    setEditingDonation(donation);
    setDonationForm({
      amount: donation.amount.toString(),
      donor_name: donation.donor_name || "",
      donor_email: donation.donor_email || "",
      is_anonymous: donation.is_anonymous || false,
      message: donation.message || "",
      transaction_id: donation.transaction_id || "",
      status: donation.status || "completed",
    });
    setDonationDialogOpen(true);
  };

  const resetDonationForm = () => {
    setDonationForm({
      amount: "",
      donor_name: "",
      donor_email: "",
      is_anonymous: false,
      message: "",
      transaction_id: "",
      status: "completed",
    });
  };

  const exportDonations = () => {
    if (!donations || donations.length === 0) {
      toast.error("No donations to export");
      return;
    }

    const headers = ["Date", "Amount", "Donor", "Email", "Transaction ID", "Message", "Status"];
    const rows = donations.map(d => [
      format(new Date(d.created_at), "yyyy-MM-dd HH:mm"),
      d.amount,
      d.is_anonymous ? "Anonymous" : (d.donor_name || "N/A"),
      d.donor_email || "N/A",
      d.transaction_id || "N/A",
      d.message || "",
      d.status,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Donations exported");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Donations Management</CardTitle>
            <CardDescription>Manage donations and payment settings</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Donation Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      value={settingsForm.upi_id}
                      onChange={(e) => setSettingsForm({ ...settingsForm, upi_id: e.target.value })}
                      placeholder="yourname@upi"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>QR Code Image</Label>
                    {settingsForm.qr_code_url ? (
                      <div className="relative inline-block">
                        <img src={settingsForm.qr_code_url} alt="QR" className="h-32 w-32 rounded border" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6"
                          onClick={() => setSettingsForm({ ...settingsForm, qr_code_url: "" })}
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
                          onChange={handleQrUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploading ? "Uploading..." : "Upload QR Code"}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      placeholder="Why should people donate?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Goal Amount (₹)</Label>
                    <Input
                      type="number"
                      value={settingsForm.goal_amount}
                      onChange={(e) => setSettingsForm({ ...settingsForm, goal_amount: e.target.value })}
                      placeholder="10000"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settingsForm.is_active}
                      onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, is_active: checked })}
                    />
                    <Label>Enable Donations</Label>
                  </div>

                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={exportDonations}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Dialog open={donationDialogOpen} onOpenChange={(open) => {
              setDonationDialogOpen(open);
              if (!open) {
                setEditingDonation(null);
                resetDonationForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Donation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingDonation ? "Edit Donation" : "Add Donation"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={donationForm.amount}
                      onChange={(e) => setDonationForm({ ...donationForm, amount: e.target.value })}
                      placeholder="1000"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={donationForm.is_anonymous}
                      onCheckedChange={(checked) => setDonationForm({ ...donationForm, is_anonymous: checked })}
                    />
                    <Label>Anonymous</Label>
                  </div>

                  {!donationForm.is_anonymous && (
                    <div className="space-y-2">
                      <Label>Donor Name</Label>
                      <Input
                        value={donationForm.donor_name}
                        onChange={(e) => setDonationForm({ ...donationForm, donor_name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={donationForm.donor_email}
                      onChange={(e) => setDonationForm({ ...donationForm, donor_email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Transaction ID</Label>
                    <Input
                      value={donationForm.transaction_id}
                      onChange={(e) => setDonationForm({ ...donationForm, transaction_id: e.target.value })}
                      placeholder="UTR/Reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={donationForm.message}
                      onChange={(e) => setDonationForm({ ...donationForm, message: e.target.value })}
                      placeholder="Optional message"
                    />
                  </div>

                  <Button onClick={handleSaveDonation} className="w-full">
                    {editingDonation ? "Update" : "Add"} Donation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total Raised</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{donations?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Donations</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{donorCount}</p>
            <p className="text-sm text-muted-foreground">Unique Donors</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">
              ₹{donations?.length ? Math.round(totalAmount / donations.length) : 0}
            </p>
            <p className="text-sm text-muted-foreground">Avg Donation</p>
          </div>
        </div>

        {/* Donations List */}
        <div className="space-y-3">
          {donations?.map((donation) => (
            <div key={donation.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">₹{Number(donation.amount).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">
                    from {donation.is_anonymous ? "Anonymous" : (donation.donor_name || "Unknown")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {donation.donor_email && <span>{donation.donor_email}</span>}
                  {donation.transaction_id && <span>Txn: {donation.transaction_id}</span>}
                  <span>{format(new Date(donation.created_at), "MMM d, yyyy")}</span>
                </div>
                {donation.message && (
                  <p className="text-sm text-muted-foreground mt-1 italic">"{donation.message}"</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEditDonation(donation)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteDonation(donation.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {(!donations || donations.length === 0) && (
            <p className="text-center text-muted-foreground py-8">No donations yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
