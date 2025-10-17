import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CommentCard } from "./CommentCard";
import { CommentForm } from "./CommentForm";
import { X, Heart, MessageCircle, MapPin, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Voice {
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  is_anonymous: boolean;
  username: string | null;
  age: string | null;
  location: string | null;
  support_count: number;
  comment_count: number;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  author_name: string | null;
  is_anonymous: boolean;
  created_at: string;
}

interface VoiceDetailDialogProps {
  voiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const moodEmojis = {
  happy: "😊",
  calm: "😌",
  sad: "😢",
  angry: "😠",
  love: "❤️",
};

const moodColors = {
  happy: "border-l-4 border-l-yellow-400",
  calm: "border-l-4 border-l-blue-400",
  sad: "border-l-4 border-l-purple-400",
  angry: "border-l-4 border-l-red-400",
  love: "border-l-4 border-l-pink-400",
};

export const VoiceDetailDialog = ({ voiceId, open, onOpenChange }: VoiceDetailDialogProps) => {
  const { toast } = useToast();
  const [voice, setVoice] = useState<Voice | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportCount, setSupportCount] = useState(0);

  useEffect(() => {
    if (open && voiceId) {
      fetchVoiceDetails();
      fetchComments();
      subscribeToComments();
    }
  }, [voiceId, open]);

  const fetchVoiceDetails = async () => {
    if (!voiceId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('voices')
        .select('*')
        .eq('id', voiceId)
        .single();

      if (error) throw error;
      setVoice(data as Voice);
      setSupportCount(data.support_count);
    } catch (error) {
      console.error('Error fetching voice:', error);
      toast({
        title: "Error",
        description: "Failed to load voice details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!voiceId) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('voice_id', voiceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments((data || []) as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const subscribeToComments = () => {
    if (!voiceId) return;

    const channel = supabase
      .channel(`comments-${voiceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `voice_id=eq.${voiceId}`
        },
        () => {
          fetchComments();
          fetchVoiceDetails(); // Refresh to get updated comment count
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSupport = async () => {
    if (!voice) return;

    try {
      const { error } = await supabase
        .from('voices')
        .update({ support_count: supportCount + 1 })
        .eq('id', voice.id);

      if (error) throw error;

      setSupportCount(supportCount + 1);
      toast({
        title: "❤️ Support added",
        description: "Your support has been recorded!",
      });
    } catch (error) {
      console.error('Error adding support:', error);
    }
  };

  if (!voice && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-lg">
        <DialogHeader className={`p-6 pb-4 flex-shrink-0 ${voice ? moodColors[voice.mood] : ''}`}>
          <DialogTitle className="sr-only">Voice Details</DialogTitle>
          <DialogDescription className="sr-only">
            View and respond to this voice with your comments
          </DialogDescription>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{voice ? moodEmojis[voice.mood] : ""}</span>
              <div>
                <Badge variant="secondary" className="mb-1">
                  {voice?.category}
                </Badge>
                <p className="text-xs text-muted-foreground">
                  {voice && formatDistanceToNow(new Date(voice.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 pb-6">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : voice ? (
              <div className="space-y-6">
              {/* Voice Content */}
              <div className="space-y-3">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {voice.content}
                </p>
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {voice.is_anonymous ? "Anonymous" : (voice.username || "Anonymous")}
                  </div>
                  {voice.age && (
                    <span>Age: {voice.age}</span>
                  )}
                  {voice.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {voice.location}
                    </div>
                  )}
                </div>
              </div>

              {/* Engagement Section */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSupport}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {supportCount} Support
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {voice.comment_count} Comments
                </Button>
              </div>

              <Separator />

              {/* Comments Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Comments ({comments.length})
                </h3>
                
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No comments yet. Be the first to respond!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        authorName={comment.author_name}
                        isAnonymous={comment.is_anonymous}
                        content={comment.content}
                        createdAt={comment.created_at}
                      />
                    ))}
                  </div>
                )}
              </div>

              <Separator />

                {/* Add Comment Form */}
                <CommentForm
                  voiceId={voice.id}
                  onCommentAdded={fetchComments}
                />
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
