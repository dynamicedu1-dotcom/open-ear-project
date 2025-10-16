import { formatDistanceToNow } from "date-fns";
import { Card } from "@/components/ui/card";
import { User } from "lucide-react";

interface CommentCardProps {
  authorName: string | null;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
}

export const CommentCard = ({ 
  authorName, 
  isAnonymous, 
  content, 
  createdAt 
}: CommentCardProps) => {
  const displayName = isAnonymous ? "Anonymous" : (authorName || "Anonymous");
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
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
        </div>
      </div>
    </Card>
  );
};
