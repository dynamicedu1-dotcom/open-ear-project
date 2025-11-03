import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().email("Invalid email address").max(255).optional().or(z.literal("")),
  organization: z.string().trim().max(200).optional(),
  type: z.string(),
  rating: z.number().min(0).max(5).optional(),
  message: z.string().trim().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    type: "general",
    rating: 0,
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const validatedData = feedbackSchema.parse(formData);

      const { error } = await supabase.from("feedback").insert([
        {
          name: validatedData.name || null,
          email: validatedData.email || null,
          organization: validatedData.organization || null,
          type: validatedData.type,
          rating: validatedData.rating || null,
          message: validatedData.message,
        },
      ]);

      if (error) throw error;

      toast({
        title: "✅ Feedback Received!",
        description: "Thank you! Your feedback helps us improve.",
      });

      setFormData({
        name: "",
        email: "",
        organization: "",
        type: "general",
        rating: 0,
        message: "",
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive",
        });
      } else {
        console.error("Error submitting:", error);
        toast({
          title: "Error",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-accent py-16 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <MessageSquare className="h-16 w-16 mx-auto mb-6 text-accent-glow" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            We Value Your Feedback
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Your thoughts and experiences help us create a better platform.
            Share your feedback, report bugs, or suggest new features!
          </p>
        </div>
      </section>

      {/* Feedback Form */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Share Your Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name (Optional)</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization/School (Optional)</Label>
                <Input
                  id="organization"
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  placeholder="Your school or organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Feedback Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Feedback</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="praise">Praise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rate Your Experience</Label>
                <div className="flex items-center gap-4">
                  <StarRating
                    value={formData.rating}
                    onChange={(rating) =>
                      setFormData({ ...formData, rating })
                    }
                  />
                  {formData.rating > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {formData.rating} star{formData.rating !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Feedback *</Label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Tell us what you think..."
                  className={`min-h-[150px] ${errors.message ? "border-destructive" : ""}`}
                  maxLength={1000}
                />
                {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                <p className="text-sm text-muted-foreground text-right">
                  {formData.message.length}/1000
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 gradient-accent"
                  disabled={loading || !formData.message}
                >
                  {loading ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Feedback;
