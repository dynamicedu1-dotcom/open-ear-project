import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Heart } from "lucide-react";
import { useIdentity } from "@/hooks/useIdentity";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmailCaptureModal } from "./EmailCaptureModal";

interface CommentCardProps {
  key?: React.Key;
  id: string;
  authorName: string | null;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
  likesCount?: number;
  onLikeChange?: () => void;
}

export const CommentCard = ({ 
  id,
  authorName, 
  isAnonymous, 
  content, 
  createdAt,
  likesCount = 0,
  onLikeChange,
}: CommentCardProps) => {
  const { profile, isIdentified, requestIdentity, requiresIdentity, cancelIdentityRequest } = useIdentity();
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingLike, setPendingLike] = useState(false);

  const displayName = isAnonymous ? "Anonymous" : (authorName || "Anonymous");
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  // Check if user has liked this comment
  useEffect(() => {
    const checkLike = async () => {
      if (!profile?.id || !id) return;
      try {
        const { data } = await supabase
          .from('comment_likes')
          .select('id')
          .eq('comment_id', id)
          .eq('user_profile_id', profile.id)
          .maybeSingle();
        
        setIsLiked(!!data);
      } catch (error) {
        console.error('Error checking like:', error);
      }
    };
    checkLike();
  }, [profile?.id, id]);

  // Update local count when prop changes
  useEffect(() => {
    setLocalLikesCount(likesCount);
  }, [likesCount]);

  // Handle like after email capture
  useEffect(() => {
    if (pendingLike && isIdentified && profile?.id) {
      setPendingLike(false);
      performLike();
    }
  }, [pendingLike, isIdentified, profile?.id]);

  const performLike = async () => {
    if (!profile?.id || isLiking) return;
    setIsLiking(true);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', id)
          .eq('user_profile_id', profile.id);
        
        setIsLiked(false);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: id,
            user_profile_id: profile.id,
          });
        
        setIsLiked(true);
        setLocalLikesCount(prev => prev + 1);
      }
      onLikeChange?.();
    } catch (error: any) {
      console.error('Like error:', error);
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isIdentified) {
      setShowEmailModal(true);
      return;
    }

    performLike();
  };

  const handleEmailCaptureSuccess = () => {
    setShowEmailModal(false);
    setPendingLike(true);
  };

  return (
    <>
      <EmailCaptureModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onSuccess={handleEmailCaptureSuccess}
        actionDescription="like this comment"
      />
      
      <Card className="p-4 bg-card/50 border-border/50 hover:bg-card/70 transition-colors animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{displayName}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground text-xs">{timeAgo}</span>
            </div>
            <p className="text-foreground/90 text-sm leading-relaxed">{content}</p>
            
            {/* Like button */}
            <div className="flex items-center pt-2">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-7 px-2 gap-1.5 text-xs hover:text-red-500",
                  isLiked && "text-red-500"
                )}
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
                {localLikesCount > 0 && <span>{localLikesCount}</span>}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};
