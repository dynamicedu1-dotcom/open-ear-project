import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Lock, Image, FileText, Music, Video } from "lucide-react";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: any;
  onSuccess: () => void;
}

export const CreatePostDialog = ({ open, onOpenChange, post, onSuccess }: CreatePostDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(post?.title || "");
  const [content, setContent] = useState(post?.content || "");
  const [visibility, setVisibility] = useState(post?.visibility || "public");
  const [postType, setPostType] = useState(post?.post_type || "update");
  const [hashtags, setHashtags] = useState(post?.hashtags?.join(" ") || "");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const hashtagArray = hashtags
        .split(/\s+/)
        .filter(tag => tag.startsWith("#"))
        .map(tag => tag.slice(1));

      const postData = {
        title: title.trim(),
        content: content.trim(),
        visibility,
        post_type: postType,
        hashtags: hashtagArray.length > 0 ? hashtagArray : null,
        status: saveAsDraft ? "draft" : isScheduled && scheduledDate ? "scheduled" : "published",
        scheduled_for: isScheduled && scheduledDate ? scheduledDate : null,
        author_id: user.id,
      };

      if (post) {
        const { error } = await supabase
          .from("core_team_posts")
          .update(postData)
          .eq("id", post.id);

        if (error) throw error;
        toast({ title: "Post updated successfully!" });
      } else {
        const { error } = await supabase
          .from("core_team_posts")
          .insert([postData]);

        if (error) throw error;
        toast({ 
          title: saveAsDraft ? "Draft saved!" : "Post published!",
          description: saveAsDraft ? "Your draft has been saved." : "Your post is now live."
        });
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{post ? "Edit Post" : "Create New Post"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Post title (max 200 characters)"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 200))}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {title.length}/200 characters
            </p>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts, ideas, or updates..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, 5000))}
              maxLength={5000}
              rows={8}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {content.length}/5000 characters
            </p>
          </div>

          {/* Visibility */}
          <div>
            <Label>Visibility</Label>
            <RadioGroup value={visibility} onValueChange={setVisibility} className="mt-2">
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="public" id="public" />
                <Label htmlFor="public" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Globe className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium">Public</div>
                    <div className="text-xs text-muted-foreground">Visible on public wall and dashboard</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="internal" id="internal" />
                <Label htmlFor="internal" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Internal Only</div>
                    <div className="text-xs text-muted-foreground">Only visible to core team members</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Post Type */}
          <div>
            <Label htmlFor="post-type">Post Type</Label>
            <Select value={postType} onValueChange={setPostType}>
              <SelectTrigger id="post-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="update">💡 Update</SelectItem>
                <SelectItem value="idea">🚀 Idea</SelectItem>
                <SelectItem value="task">✅ Task</SelectItem>
                <SelectItem value="announcement">📢 Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hashtags */}
          <div>
            <Label htmlFor="hashtags">Hashtags</Label>
            <Input
              id="hashtags"
              placeholder="#education #innovation #ideas"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Separate hashtags with spaces. Example: #education #tech
            </p>
          </div>

          {/* Schedule */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="schedule">Schedule for later</Label>
              <p className="text-xs text-muted-foreground">Post will be published at the specified time</p>
            </div>
            <Switch
              id="schedule"
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
            />
          </div>

          {isScheduled && (
            <div>
              <Label htmlFor="scheduled-date">Publish Date & Time</Label>
              <Input
                id="scheduled-date"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSaveAsDraft(true);
                handleSubmit();
              }}
              disabled={loading}
            >
              Save as Draft
            </Button>
            <Button
              onClick={() => {
                setSaveAsDraft(false);
                handleSubmit();
              }}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isScheduled ? "Scheduling..." : "Publishing..."}
                </>
              ) : (
                <>{isScheduled ? "Schedule Post" : "Publish Now"}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
