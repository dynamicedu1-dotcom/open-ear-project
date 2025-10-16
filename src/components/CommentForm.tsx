import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

interface CommentFormProps {
  voiceId: string;
  onCommentAdded: () => void;
}

export const CommentForm = ({ voiceId, onCommentAdded }: CommentFormProps) => {
  const { toast } = useToast();
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxLength = 500;
  const remainingChars = maxLength - content.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Comment required",
        description: "Please enter a comment before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (content.length > maxLength) {
      toast({
        title: "Comment too long",
        description: `Please keep your comment under ${maxLength} characters.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          voice_id: voiceId,
          content: content.trim(),
          author_name: isAnonymous ? null : (authorName.trim() || null),
          is_anonymous: isAnonymous,
        });

      if (error) throw error;

      toast({
        title: "💬 Comment posted",
        description: "Your comment has been added successfully!",
      });

      // Reset form
      setContent("");
      setAuthorName("");
      setIsAnonymous(true);

      // Notify parent to refresh comments
      onCommentAdded();
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card/30 rounded-lg border border-border/50">
      <h3 className="text-lg font-semibold text-foreground">Add a Comment</h3>
      
      <div className="space-y-2">
        <Label htmlFor="authorName">Your Name (optional)</Label>
        <Input
          id="authorName"
          placeholder="Enter your name"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          disabled={isAnonymous || isSubmitting}
          maxLength={100}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
          disabled={isSubmitting}
        />
        <Label 
          htmlFor="anonymous" 
          className="text-sm cursor-pointer"
        >
          Post as Anonymous
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Your Comment</Label>
        <Textarea
          id="content"
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          maxLength={maxLength}
          className="min-h-[100px] resize-none"
          required
        />
        <div className="flex justify-end">
          <span className={`text-xs ${remainingChars < 50 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {remainingChars}/{maxLength}
          </span>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full gradient-accent"
        disabled={isSubmitting || !content.trim()}
      >
        <Send className="mr-2 h-4 w-4" />
        {isSubmitting ? "Posting..." : "Post Comment"}
      </Button>
    </form>
  );
};
