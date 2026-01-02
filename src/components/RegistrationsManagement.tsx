import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Eye, Download, Search, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Registration {
  id: string;
  blog_id: string;
  user_profile_id: string | null;
  registration_data: any;
  status: string;
  payment_status: string;
  payment_reference: string | null;
  slots_booked: number;
  created_at: string;
  contact_email: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  weekly_blogs?: {
    title: string;
    blog_type: string;
    event_date: string | null;
  };
}

export function RegistrationsManagement() {
  const queryClient = useQueryClient();
  const [selectedBlog, setSelectedBlog] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingRegistration, setViewingRegistration] = useState<Registration | null>(null);

  // Fetch blogs with registrations
  const { data: blogs } = useQuery({
    queryKey: ["blogsWithRegistrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_blogs")
        .select("id, title, blog_type, event_date")
        .in("blog_type", ["event", "registration"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch registrations
  const { data: registrations, isLoading } = useQuery({
    queryKey: ["registrations", selectedBlog, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("blog_registrations")
        .select(`
          *,
          weekly_blogs (title, blog_type, event_date)
        `)
        .order("created_at", { ascending: false });

      if (selectedBlog !== "all") {
        query = query.eq("blog_id", selectedBlog);
      }

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Registration[];
    },
  });

  const updateRegistrationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("blog_registrations")
        .update({
          status,
          approved_at: status === "approved" ? new Date().toISOString() : null,
        })
        .eq("id", id);

      if (error) throw error;
      toast.success(`Registration ${status}`);
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const updatePaymentStatus = async (id: string, paymentStatus: string) => {
    try {
      const { error } = await supabase
        .from("blog_registrations")
        .update({ payment_status: paymentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success("Payment status updated");
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
    } catch (error: any) {
      toast.error(error.message || "Failed to update payment status");
    }
  };

  const exportRegistrations = () => {
    if (!registrations || registrations.length === 0) {
      toast.error("No registrations to export");
      return;
    }

    const csvData = registrations.map((reg) => ({
      "Event/Blog": reg.weekly_blogs?.title || "N/A",
      "Name": reg.contact_name || reg.registration_data?.name || "N/A",
      "Email": reg.contact_email || reg.registration_data?.email || "N/A",
      "Phone": reg.contact_phone || reg.registration_data?.phone || "N/A",
      "Status": reg.status,
      "Payment Status": reg.payment_status,
      "Registered At": format(new Date(reg.created_at), "PPP p"),
      ...Object.entries(reg.registration_data || {}).reduce((acc, [key, value]) => {
        if (!["name", "email", "phone"].includes(key)) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>),
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers.map((h) => `"${(row as any)[h] || ""}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Registrations exported!");
  };

  const filteredRegistrations = registrations?.filter((reg) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      reg.contact_name?.toLowerCase().includes(searchLower) ||
      reg.contact_email?.toLowerCase().includes(searchLower) ||
      reg.contact_phone?.includes(searchTerm) ||
      JSON.stringify(reg.registration_data).toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      cancelled: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      unpaid: "bg-yellow-500/20 text-yellow-600",
      paid: "bg-green-500/20 text-green-600",
      not_applicable: "bg-gray-500/20 text-gray-500",
      refunded: "bg-blue-500/20 text-blue-600",
    };
    return <span className={`text-xs px-2 py-0.5 rounded ${colors[status] || colors.unpaid}`}>{status}</span>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registrations Management
            </CardTitle>
            <CardDescription>
              View and manage event and form registrations
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportRegistrations}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <Label>Event/Blog</Label>
            <Select value={selectedBlog} onValueChange={setSelectedBlog}>
              <SelectTrigger>
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {blogs?.map((blog) => (
                  <SelectItem key={blog.id} value={blog.id}>
                    {blog.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <div className="text-2xl font-bold">{registrations?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="p-4 bg-yellow-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {registrations?.filter((r) => r.status === "pending").length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-4 bg-green-500/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">
              {registrations?.filter((r) => r.status === "approved").length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Approved</div>
          </div>
          <div className="p-4 bg-destructive/10 rounded-lg text-center">
            <div className="text-2xl font-bold text-destructive">
              {registrations?.filter((r) => r.status === "rejected").length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Rejected</div>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredRegistrations?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No registrations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRegistrations?.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {reg.weekly_blogs?.title || "N/A"}
                    </TableCell>
                    <TableCell>{reg.contact_name || reg.registration_data?.name || "N/A"}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{reg.contact_email || reg.registration_data?.email}</div>
                        <div className="text-muted-foreground">{reg.contact_phone || reg.registration_data?.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(reg.status)}</TableCell>
                    <TableCell>{getPaymentBadge(reg.payment_status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(reg.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setViewingRegistration(reg)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {reg.status === "pending" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => updateRegistrationStatus(reg.id, "approved")}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => updateRegistrationStatus(reg.id, "rejected")}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* View Dialog */}
        <Dialog open={!!viewingRegistration} onOpenChange={() => setViewingRegistration(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Registration Details</DialogTitle>
            </DialogHeader>
            {viewingRegistration && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-2">{viewingRegistration.weekly_blogs?.title}</h3>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(viewingRegistration.status)}
                    {getPaymentBadge(viewingRegistration.payment_status)}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Registration Data</h4>
                  {Object.entries(viewingRegistration.registration_data || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Registered: {format(new Date(viewingRegistration.created_at), "PPP p")}
                </div>

                {viewingRegistration.payment_status === "unpaid" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        updatePaymentStatus(viewingRegistration.id, "paid");
                        setViewingRegistration(null);
                      }}
                    >
                      Mark as Paid
                    </Button>
                  </div>
                )}

                {viewingRegistration.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        updateRegistrationStatus(viewingRegistration.id, "approved");
                        setViewingRegistration(null);
                      }}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        updateRegistrationStatus(viewingRegistration.id, "rejected");
                        setViewingRegistration(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}