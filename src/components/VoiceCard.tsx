import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, User, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "./EmailCaptureModal";
import { ShareModal } from "./ShareModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VoiceCardProps {
  key?: React.Key;
  id: string;
  content: string;
  mood: "happy" | "calm" | "sad" | "angry" | "love";
  category: string;
  isAnonymous: boolean;
  username?: string;
  supportCount: number;
  commentCount: number;
  imageUrl?: string;
  videoUrl?: string;
  createdAt?: string;
  isTeamPost?: boolean;
  onSupport: (id: string) => void;
  onClick: (id: string) => void;
  onLikeChange?: () => void;
}

const moodEmojis = {
  happy: "😃",
  calm: "😌",
  sad: "😞",
  angry: "😠",
  love: "❤️",
};

const moodColors = {
  happy: "border-mood-happy bg-yellow-500/5",
  calm: "border-mood-calm bg-blue-500/5",
  sad: "border-mood-sad bg-gray-500/5",
  angry: "border-mood-angry bg-red-500/5",
  love: "border-mood-love bg-pink-500/5",
};

export const VoiceCard = ({
  id,
  content,
  mood,
  category,
  isAnonymous,
  username,
  supportCount,
  commentCount,
  imageUrl,
  videoUrl,
  createdAt,
  isTeamPost,
  onSupport,
  onClick,
  onLikeChange,
}: VoiceCardProps) => {
  const { profile, isIdentified } = useIdentity();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [pendingAction, setPendingAction] = useState<'like' | null>(null);

  const displayContent = content.length > 150 ? content.substring(0, 150) + "..." : content;
  const displayName = isAnonymous ? "Anonymous" : username || "Student";
  const timeAgo = createdAt ? getTimeAgo(new Date(createdAt)) : "";
  const isTeam = isTeamPost || username?.startsWith("TEAM DYNAMIC");

  // Check if user has liked this post
  useEffect(() => {
    const checkLike = async () => {
      if (!profile?.id) {
        setIsLiked(false);
        return;
      }
      
      const { data } = await supabase
        .from('voice_likes')
        .select('id')
        .eq('voice_id', id)
        .eq('user_profile_id', profile.id)
        .maybeSingle();
      
      setIsLiked(!!data);
    };
    
    const fetchLikesCount = async () => {
      const { count } = await supabase
        .from('voice_likes')
        .select('*', { count: 'exact', head: true })
        .eq('voice_id', id);
      
      setLocalLikesCount(count || 0);
    };

    checkLike();
    fetchLikesCount();
  }, [profile?.id, id]);

  const handleLikeAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isIdentified) {
      setPendingAction('like');
      setShowEmailModal(true);
      return;
    }

    handleLike();
  };

  const handleShareAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  const handleLike = async () => {
    if (!profile?.id || isLiking) return;
    setIsLiking(true);

    try {
      if (isLiked) {
        await supabase
          .from('voice_likes')
          .delete()
          .eq('voice_id', id)
          .eq('user_profile_id', profile.id);
        
        setIsLiked(false);
        setLocalLikesCount(prev => Math.max(0, prev - 1));
      } else {
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

  const handleEmailCaptureSuccess = () => {
    setShowEmailModal(false);
    if (pendingAction === 'like') {
      handleLike();
    }
    setPendingAction(null);
  };

  return (
    <>
      <EmailCaptureModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onSuccess={handleEmailCaptureSuccess}
        actionDescription="like this post"
      />

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        voiceId={id}
        voiceContent={content}
        voiceMood={moodEmojis[mood]}
        voiceCategory={category}
        onReshareSuccess={onLikeChange}
      />

      <Card
        className={cn(
          "p-0 overflow-hidden border-l-4 hover:shadow-card transition-all duration-300 cursor-pointer group hover:scale-[1.02] bg-card/50 backdrop-blur-sm",
          moodColors[mood]
        )}
        onClick={() => onClick(id)}
      >
        <CardContent className="p-5 pb-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                isTeam ? "bg-emerald-500/20" : "bg-muted"
              )}>
                <User className={cn(
                  "h-4 w-4",
                  isTeam ? "text-emerald-500" : "text-muted-foreground"
                )} />
              </div>
              <div className="flex items-center gap-1.5">
                <p className={cn(
                  "text-sm font-medium",
                  isTeam && "text-emerald-600 dark:text-emerald-400"
                )}>
                  {displayName}
                </p>
                {isTeam && (
                  <BadgeCheck className="h-4 w-4 text-emerald-500 fill-emerald-500/20" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {timeAgo && (
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              )}
              <span className="text-3xl">{moodEmojis[mood]}</span>
            </div>
          </div>

          {/* Topic Badge */}
          <Badge variant="secondary" className="mb-3">
            {category}
          </Badge>

          {/* Content */}
          <p className="text-sm text-foreground/90 line-clamp-4">{displayContent}</p>

          {/* Video */}
          {videoUrl && (
            <div className="rounded-lg overflow-hidden mt-3">
              <video
                src={videoUrl}
                controls
                className="w-full max-h-64 object-contain bg-black rounded-lg"
                preload="metadata"
                onClick={(e) => e.stopPropagation()}
              >
                Your browser does not support video playback.
              </video>
            </div>
          )}

          {/* Image */}
          {imageUrl && !videoUrl && (
            <div className="rounded-lg overflow-hidden mt-3">
              <img src={imageUrl} alt="" className="w-full h-40 object-cover" />
            </div>
          )}
        </CardContent>

        {/* Social Actions Footer */}
        <CardFooter className="px-5 py-3 border-t border-border/50 bg-muted/30">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-8 gap-1.5 hover:text-red-500 hover:bg-red-500/10",
                isLiked && "text-red-500"
              )}
              onClick={handleLikeAction}
              disabled={isLiking}
            >
              <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
              <span className="text-xs">{localLikesCount + supportCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 hover:text-blue-500 hover:bg-blue-500/10"
              onClick={(e) => {
                e.stopPropagation();
                onClick(id);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">{commentCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 hover:text-green-500 hover:bg-green-500/10"
              onClick={handleShareAction}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}
