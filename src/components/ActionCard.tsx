import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Users, CheckCircle2, Sparkles } from "lucide-react";

interface ActionCardProps {
  id: string;
  title: string;
  description: string;
  status: string;
  views: number;
  relatedVoices?: string[];
  imageUrl?: string | null;
  createdAt: string;
  isInProgress?: boolean;
}

export const ActionCard = ({
  title,
  description,
  status,
  views,
  relatedVoices,
  imageUrl,
  createdAt,
  isInProgress,
}: ActionCardProps) => {
  const isCompleted = status.toLowerCase() === "completed";
  
  return (
    <Card className={`hover:shadow-accent-glow transition-all hover:scale-[1.02] overflow-hidden ${
      isInProgress ? 'border-accent border-2 animate-pulse-border' : ''
    }`}>
      {imageUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl flex items-center gap-2">
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-mood-happy" />}
            {isInProgress && <Sparkles className="h-5 w-5 text-accent animate-pulse" />}
            {title}
          </CardTitle>
          <Badge
            variant={isCompleted ? "default" : "secondary"}
            className={`${isCompleted ? "bg-mood-happy" : isInProgress ? "bg-accent animate-pulse" : "bg-secondary"}`}
          >
            {status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80 mb-4">{description}</p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{views}</span>
          </div>
          {relatedVoices && relatedVoices.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{relatedVoices.length} voices</span>
            </div>
          )}
          <span className="ml-auto text-xs">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
