import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Collaborate = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organizationType: "individual",
    collaborationArea: "awareness",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("feedback").insert([
        {
          name: formData.name,
          email: formData.email,
          organization: formData.organizationType,
          type: "collaboration",
          message: `[${formData.collaborationArea}] ${formData.message}`,
        },
      ]);

      if (error) throw error;

      toast({
        title: "✅ Collaboration Request Sent!",
        description: "Thank you! We'll be in touch soon to discuss next steps.",
      });

      setFormData({
        name: "",
        email: "",
        organizationType: "individual",
        collaborationArea: "awareness",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-warm py-16 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <Users className="h-16 w-16 mx-auto mb-6 text-accent-glow" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Partner with Dynamic Edu
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto mb-4">
            We welcome schools, NGOs, artists, volunteers, and change-makers.
            Together, we can build a better future for students everywhere.
          </p>
          <div className="flex items-center justify-center gap-2 text-accent">
            <Sparkles className="h-5 w-5" />
            <p className="italic text-sm">
              "Collaboration is the root of transformation"
            </p>
          </div>
        </div>
      </section>

      {/* Collaboration Form */}
      <section className="py-16 px-6 max-w-3xl mx-auto">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Let's Build Together</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name / Organization Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Your name or organization"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Contact Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.organizationType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, organizationType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area of Collaboration *</Label>
                <Select
                  value={formData.collaborationArea}
                  onValueChange={(value) =>
                    setFormData({ ...formData, collaborationArea: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">Awareness Campaigns</SelectItem>
                    <SelectItem value="skills">Skills Development</SelectItem>
                    <SelectItem value="funding">Funding & Sponsorship</SelectItem>
                    <SelectItem value="research">Research & Development</SelectItem>
                    <SelectItem value="events">Events & Workshops</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Tell Us About Your Vision *</Label>
                <Textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Share your ideas, goals, and how you'd like to collaborate with Dynamic Edu..."
                  className="min-h-[150px]"
                  maxLength={1000}
                />
                <p className="text-sm text-muted-foreground text-right">
                  {formData.message.length}/1000
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  className="flex-1 gradient-accent"
                  disabled={loading || !formData.name || !formData.email || !formData.message}
                >
                  {loading ? "Submitting..." : "Submit Collaboration Request"}
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

        {/* Why Collaborate Section */}
        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-center">
            Why Collaborate with Dynamic Edu?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">🎯 Real Impact</h3>
                <p className="text-sm text-foreground/80">
                  Your collaboration directly affects thousands of students and
                  communities.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">🌱 Innovation</h3>
                <p className="text-sm text-foreground/80">
                  Work with a forward-thinking team dedicated to reimagining
                  education.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">🤝 Shared Vision</h3>
                <p className="text-sm text-foreground/80">
                  Join a community of change-makers building a better future
                  together.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Collaborate;
