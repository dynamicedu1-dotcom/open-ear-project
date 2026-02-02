import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Heart, Copy, CheckCircle, Gift, Users, Target, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function Donate() {
  const queryClient = useQueryClient();
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
  const { data: settings } = useQuery({
    queryKey: ["donationSettings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donation_settings")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent donations
  const { data: donations } = useQuery({
    queryKey: ["publicDonations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate total donations
  const { data: totalDonations } = useQuery({
    queryKey: ["totalDonations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("donations")
        .select("amount");
      
      if (error) throw error;
      return data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
    },
  });

  // Realtime subscription for donations and settings
  useEffect(() => {
    const donationsChannel = supabase
      .channel('donations_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donations' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["publicDonations"] });
          queryClient.invalidateQueries({ queryKey: ["totalDonations"] });
        }
      )
      .subscribe();

    const settingsChannel = supabase
      .channel('donation_settings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'donation_settings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ["donationSettings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(donationsChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, [queryClient]);

  const copyUpiId = () => {
    if (settings?.upi_id) {
      navigator.clipboard.writeText(settings.upi_id);
      setCopied(true);
      toast.success("UPI ID copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!razorpayLoaded) {
      toast.error("Payment system is loading. Please try again.");
      return;
    }

    setIsRazorpayLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          amount: parseFloat(amount),
          currency: 'INR',
          notes: {
            donor_name: isAnonymous ? 'Anonymous' : donorName,
            message: message || '',
          },
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: 'Your Voice - Dynamic Edu',
        description: 'Donation to support our mission',
        handler: async function (response: any) {
          // Payment successful, record the donation
          try {
            const { error: insertError } = await supabase.from("donations").insert({
              amount: parseFloat(amount),
              donor_name: isAnonymous ? null : donorName,
              donor_email: donorEmail || null,
              is_anonymous: isAnonymous,
              message: message || null,
              transaction_id: response.razorpay_payment_id,
              payment_method: 'razorpay',
              status: "completed",
            });

            if (insertError) throw insertError;

            toast.success("Thank you for your donation!");
            setDonorName("");
            setDonorEmail("");
            setAmount("");
            setMessage("");
            setIsAnonymous(false);
          } catch (err: any) {
            toast.error("Payment received but failed to record. Please contact support.");
            console.error('Error recording donation:', err);
          }
        },
        prefill: {
          name: isAnonymous ? '' : donorName,
          email: donorEmail,
        },
        theme: {
          color: '#6366f1',
        },
        modal: {
          ondismiss: function () {
            setIsRazorpayLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      toast.error(error.message || "Failed to initiate payment");
      console.error('Razorpay error:', error);
    } finally {
      setIsRazorpayLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("donations").insert({
        amount: parseFloat(amount),
        donor_name: isAnonymous ? null : donorName,
        donor_email: donorEmail || null,
        is_anonymous: isAnonymous,
        message: message || null,
        transaction_id: transactionId || null,
        status: "completed",
      });

      if (error) throw error;

      toast.success("Thank you for your donation!");
      setDonorName("");
      setDonorEmail("");
      setAmount("");
      setMessage("");
      setTransactionId("");
      setIsAnonymous(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to record donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = settings?.goal_amount 
    ? Math.min((totalDonations || 0) / Number(settings.goal_amount) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <Navigation />
      
      <div className="container mx-auto p-4 md:p-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Support Our Mission</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {settings?.description || "Your generous donations help us continue our work and make a difference in the community."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Gift className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">₹{(totalDonations || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{donations?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Supporters</p>
              </div>
            </CardContent>
          </Card>
          
          {settings?.goal_amount && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="p-3 rounded-full bg-amber-500/10">
                    <Target className="h-6 w-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{progress.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">of ₹{Number(settings.goal_amount).toLocaleString()} goal</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Form */}
          <div className="space-y-6">
            {/* UPI Section */}
            {settings?.upi_id && (
              <Card>
                <CardHeader>
                  <CardTitle>Pay via UPI</CardTitle>
                  <CardDescription>Scan QR code or use UPI ID</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {settings.qr_code_url && (
                    <div className="flex justify-center">
                      <img 
                        src={settings.qr_code_url} 
                        alt="Payment QR Code" 
                        className="w-48 h-48 rounded-lg border object-contain bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Input 
                      value={settings.upi_id} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={copyUpiId}
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Razorpay Payment Section */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Pay Online
                </CardTitle>
                <CardDescription>Secure payment via Razorpay</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="razorpay-amount">Amount (₹)</Label>
                  <Input
                    id="razorpay-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="razorpay-anonymous"
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label htmlFor="razorpay-anonymous">Donate anonymously</Label>
                </div>

                {!isAnonymous && (
                  <div className="space-y-2">
                    <Label htmlFor="razorpay-name">Your Name</Label>
                    <Input
                      id="razorpay-name"
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      placeholder="Enter your name"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="razorpay-email">Email (for receipt)</Label>
                  <Input
                    id="razorpay-email"
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razorpay-message">Message (optional)</Label>
                  <Textarea
                    id="razorpay-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Leave a message of support..."
                    className="min-h-[60px]"
                  />
                </div>

                <Button 
                  onClick={handleRazorpayPayment} 
                  className="w-full gradient-accent"
                  disabled={isRazorpayLoading || !razorpayLoaded}
                >
                  {isRazorpayLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Pay with Razorpay
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Record Donation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Record Your Donation</CardTitle>
                <CardDescription>After payment, fill this form to confirm</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={setIsAnonymous}
                    />
                    <Label htmlFor="anonymous">Donate anonymously</Label>
                  </div>

                  {!isAnonymous && (
                    <div className="space-y-2">
                      <Label htmlFor="name">Your Name</Label>
                      <Input
                        id="name"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transaction">Transaction/UTR ID (optional)</Label>
                    <Input
                      id="transaction"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="Enter transaction reference"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Leave a message of support..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Recording..." : "Confirm Donation"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Donations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Supporters</CardTitle>
              <CardDescription>Thank you to all our donors!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {donations?.map((donation) => (
                  <div 
                    key={donation.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Heart className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {donation.is_anonymous ? "Anonymous" : (donation.donor_name || "Kind Donor")}
                        </p>
                        <p className="font-bold text-primary shrink-0">
                          ₹{Number(donation.amount).toLocaleString()}
                        </p>
                      </div>
                      {donation.message && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {donation.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(donation.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
                
                {(!donations || donations.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No donations yet. Be the first to support!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
