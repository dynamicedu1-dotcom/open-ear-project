import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

const moods = [
  { emoji: "😃", value: "happy", label: "Happy" },
  { emoji: "😌", value: "calm", label: "Calm" },
  { emoji: "😞", value: "sad", label: "Sad" },
  { emoji: "😠", value: "angry", label: "Angry" },
  { emoji: "❤️", value: "love", label: "Love" },
];

const categories = [
  "Education",
  "Pressure",
  "Future",
  "Skills",
  "Dreams",
  "Other",
];

const Share = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    isAnonymous: true,
    username: "",
    age: "",
    location: "",
    category: "",
    content: "",
    mood: "",
    consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please share your thoughts before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.mood) {
      toast({
        title: "Mood required",
        description: "Please select how you're feeling.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Topic required",
        description: "Please select a topic.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.consent) {
      toast({
        title: "Consent required",
        description: "Please agree to the consent checkbox.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('voices').insert({
        content: formData.content,
        mood: formData.mood,
        category: formData.category,
        is_anonymous: formData.isAnonymous,
        username: formData.isAnonymous ? null : formData.username || null,
        age: formData.age || null,
        location: formData.location || null,
      });

      if (error) throw error;

      toast({
        title: "🎉 Voice shared!",
        description: "Thank you! Your voice is now live on the wall.",
      });

      // Reset form
      setFormData({
        isAnonymous: true,
        username: "",
        age: "",
        location: "",
        category: "",
        content: "",
        mood: "",
        consent: false,
      });

      setTimeout(() => navigate("/wall"), 1500);
    } catch (error) {
      console.error('Error submitting voice:', error);
      toast({
        title: "Error",
        description: "Failed to submit your voice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-warm py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="text-center mb-8 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-accent-glow bg-clip-text text-transparent">
              Share Your Voice
            </h1>
            <p className="text-lg text-foreground/80">
              Be honest. Be kind. Be real.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <Card className="p-8 shadow-card animate-slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <Label htmlFor="anonymous" className="text-base">
                Share as Anonymous
              </Label>
              <Switch
                id="anonymous"
                checked={formData.isAnonymous}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAnonymous: checked })
                }
              />
            </div>

            {/* Username (if not anonymous) */}
            {!formData.isAnonymous && (
              <div className="space-y-2">
                <Label htmlFor="username">First Name (Optional)</Label>
                <Input
                  id="username"
                  placeholder="Your first name"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
            )}

            {/* Age & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age / Class (Optional)</Label>
                <Input
                  id="age"
                  placeholder="e.g., 16 or Class 10"
                  value={formData.age}
                  onChange={(e) =>
                    setFormData({ ...formData, age: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="e.g., Ukhrul"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Topic Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">Choose Topic *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a topic" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Express Yourself *</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts, struggles, dreams, or anything you'd like to express..."
                className="min-h-[200px] resize-none"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                maxLength={900}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.content.length} / 900 characters
              </p>
            </div>

            {/* Mood Picker */}
            <div className="space-y-3">
              <Label>How do you feel today? *</Label>
              <div className="grid grid-cols-5 gap-3">
                {moods.map((mood) => (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, mood: mood.value })}
                    className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                      formData.mood === mood.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="text-3xl mb-1">{mood.emoji}</div>
                    <div className="text-xs text-foreground/70">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 p-4 bg-secondary/30 rounded-lg">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, consent: checked as boolean })
                }
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                I allow Dynamic Edu to use my message (anonymously if selected) for
                awareness and research purposes.
              </Label>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              size="lg"
              className="w-full gradient-accent shadow-accent-glow text-lg"
              disabled={loading}
            >
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="mr-2 h-5 w-5" />
                  Speak It Out
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground italic">
              "Your words matter. Together we're building change."
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Share;
