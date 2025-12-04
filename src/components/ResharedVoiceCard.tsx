import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Share2, Repeat2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface ResharedVoiceCardProps {
  key?: React.Key;
  reshareId: string;
  resharedByName: string;
  resharedByUniqueId: string | null;
  reshareComment?: string | null;
  resharedAt: string;
  // Original voice props
  voiceId: string;
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

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return date.toLocaleDateString();
}

export function ResharedVoiceCard({
  reshareId,
  resharedByName,
  resharedByUniqueId,
  reshareComment,
  resharedAt,
  voiceId,
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
}: ResharedVoiceCardProps) {
  const displayName = isAnonymous ? "Anonymous" : username || "Anonymous";
  const resharedByDisplay = resharedByUniqueId || resharedByName || "Someone";
  const reshareTimeAgo = getTimeAgo(new Date(resharedAt));
  const originalTimeAgo = createdAt ? getTimeAgo(new Date(createdAt)) : "";

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-2 border-green-500/30 bg-green-500/5">
      {/* Reshare Header */}
      <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
        <Repeat2 className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-700 dark:text-green-400">
          Reshared by <span className="font-semibold">{resharedByDisplay}</span>
        </span>
        <span className="text-xs text-muted-foreground ml-auto">{reshareTimeAgo}</span>
      </div>

      {/* Reshare Comment */}
      {reshareComment && (
        <div className="px-4 py-3 bg-muted/30 border-b border-border/50">
          <p className="text-sm italic text-foreground/80">"{reshareComment}"</p>
        </div>
      )}

      {/* Original Voice Content */}
      <CardContent 
        className={cn(
          "p-4 cursor-pointer border-l-4",
          mood === "happy" && "border-l-yellow-400",
          mood === "calm" && "border-l-blue-400",
          mood === "sad" && "border-l-gray-400",
          mood === "angry" && "border-l-red-400",
          mood === "love" && "border-l-pink-400"
        )}
        onClick={() => onClick?.(voiceId)}
      >
        {/* Original Author Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{displayName}</p>
              {originalTimeAgo && (
                <p className="text-xs text-muted-foreground">{originalTimeAgo}</p>
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

      {/* Stats Footer */}
      <CardFooter className="p-4 pt-0 border-t border-border/50">
        <div className="flex items-center justify-between w-full text-muted-foreground">
          <div className="flex items-center gap-1.5 text-sm">
            <Heart className="h-4 w-4" />
            <span>{likesCount + supportCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <MessageCircle className="h-4 w-4" />
            <span>{commentCount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <Share2 className="h-4 w-4" />
            <span>{reshareCount}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
