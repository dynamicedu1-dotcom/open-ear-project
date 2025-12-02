import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, MoreHorizontal, User } from "lucide-react";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "./EmailCaptureModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SocialVoiceCardProps {
  id: string;
  content: string;
  mood: string;
  category: string;
  isAnonymous: boolean;
  username?: string;
  supportCount: number;
  commentCount: number;
  likesCount?: number;
  reshareCount?: number;
  imageUrl?: string;
  createdAt?: string;
  onClick?: (id: string) => void;
  onLikeChange?: () => void;
}

const moodEmojis: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  sad: "😢",
  angry: "😠",
  love: "❤️",
};

const moodColors: Record<string, string> = {
  happy: "bg-yellow-500/20 border-yellow-500/30",
  calm: "bg-blue-500/20 border-blue-500/30",
  sad: "bg-gray-500/20 border-gray-500/30",
  angry: "bg-red-500/20 border-red-500/30",
  love: "bg-pink-500/20 border-pink-500/30",
};

export function SocialVoiceCard({
  id,
  content,
  mood,
  category,
  isAnonymous,
  username,
  supportCount,
  commentCount,
  likesCount = 0,
  reshareCount = 0,
  imageUrl,
  createdAt,
  onClick,
  onLikeChange,
}: SocialVoiceCardProps) {
  const { profile, isIdentified, requestIdentity, requiresIdentity, cancelIdentityRequest } = useIdentity();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(likesCount);
  const [isLiking, setIsLiking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'like' | 'comment' | 'reshare' | null>(null);

  // Check if user has liked this post
  useState(() => {
    const checkLike = async () => {
      if (!profile?.id) return;
      const { data } = await supabase
        .from('voice_likes')
        .select('id')
        .eq('voice_id', id)
        .eq('user_profile_id', profile.id)
        .single();
      
      setIsLiked(!!data);
    };
    checkLike();
  });

  const handleAction = (action: 'like' | 'comment' | 'reshare') => {
    if (!isIdentified) {
      setPendingAction(action);
      setShowEmailModal(true);
      return;
    }

    switch (action) {
      case 'like':
        handleLike();
        break;
      case 'comment':
        onClick?.(id);
        break;
      case 'reshare':
        handleReshare();
        break;
    }
  };

  const handleLike = async () => {
    if (!profile?.id || isLiking) return;
    setIsLiking(true);

    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('voice_likes')
          .delete()
          .eq('voice_id', id)
          .eq('user_profile_id', profile.id);
        
        setIsLiked(false);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else {
        // Like
        await supabase
          .from('voice_likes')
          .insert({
            voice_id: id,
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

  const handleReshare = async () => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('voice_reshares')
        .insert({
          voice_id: id,
          user_profile_id: profile.id,
        });
      
      toast.success('Voice reshared!');
      onLikeChange?.();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.info('You already reshared this voice');
      } else {
        console.error('Reshare error:', error);
        toast.error('Failed to reshare');
      }
    }
  };

  const handleEmailCaptureSuccess = () => {
    setShowEmailModal(false);
    if (pendingAction) {
      handleAction(pendingAction);
      setPendingAction(null);
    }
  };

  const displayName = isAnonymous ? "Anonymous" : username || "Anonymous";
  const timeAgo = createdAt ? getTimeAgo(new Date(createdAt)) : "";

  return (
    <>
      <EmailCaptureModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onSuccess={handleEmailCaptureSuccess}
        actionDescription={pendingAction === 'like' ? 'like this post' : pendingAction === 'comment' ? 'comment on this post' : 'reshare this post'}
      />

      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer border-2",
          moodColors[mood] || "border-border"
        )}
      >
        <CardContent className="p-4" onClick={() => onClick?.(id)}>
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{displayName}</p>
                {timeAgo && (
                  <p className="text-xs text-muted-foreground">{timeAgo}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{moodEmojis[mood] || "💭"}</span>
            </div>
          </div>

          {/* Topic Badge */}
          <Badge variant="secondary" className="mb-3">
            {category}
          </Badge>

          {/* Content */}
          <p className="text-sm line-clamp-4 mb-3">{content}</p>

          {/* Image */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden mb-3">
              <img src={imageUrl} alt="" className="w-full h-48 object-cover" />
            </div>
          )}
        </CardContent>

        {/* Social Actions */}
        <CardFooter className="p-4 pt-0 border-t border-border/50">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-2 hover:text-red-500",
                isLiked && "text-red-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                handleAction('like');
              }}
              disabled={isLiking}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span>{localLikesCount + supportCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('comment');
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 hover:text-green-500"
              onClick={(e) => {
                e.stopPropagation();
                handleAction('reshare');
              }}
            >
              <Share2 className="h-4 w-4" />
              <span>{reshareCount}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}
