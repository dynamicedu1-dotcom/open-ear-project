import React from "react";
import { Heart, MessageCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

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
  onSupport: (id: string) => void;
  onClick: (id: string) => void;
}

const moodEmojis = {
  happy: "😃",
  calm: "😌",
  sad: "😞",
  angry: "😠",
  love: "❤️",
};

const moodColors = {
  happy: "border-mood-happy",
  calm: "border-mood-calm",
  sad: "border-mood-sad",
  angry: "border-mood-angry",
  love: "border-mood-love",
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
  onSupport,
  onClick,
}: VoiceCardProps) => {
  const displayContent = content.length > 150 ? content.substring(0, 150) + "..." : content;

  return (
    <Card
      className={`p-6 border-l-4 ${moodColors[mood]} hover:shadow-card transition-all duration-300 cursor-pointer group hover:scale-[1.02] bg-card/50 backdrop-blur-sm`}
      onClick={() => onClick(id)}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{moodEmojis[mood]}</span>
        <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
          {category}
        </span>
      </div>

      <p className="text-sm text-foreground/90 mb-4 line-clamp-4">{displayContent}</p>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {isAnonymous ? "Anonymous" : username || "Student"}
        </span>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground hover:text-accent"
            onClick={(e) => {
              e.stopPropagation();
              onSupport(id);
            }}
          >
            <Heart className="h-4 w-4" />
            <span className="text-xs">{supportCount}</span>
          </Button>

          <div className="flex items-center gap-1 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">{commentCount}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
