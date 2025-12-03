import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BlogCardProps {
  id: string;
  title: string;
  summary: string | null;
  cover_image_url: string | null;
  author_name: string | null;
  publish_date: string | null;
  views_count: number | null;
  variant?: "default" | "featured";
}

export function BlogCard({
  id,
  title,
  summary,
  cover_image_url,
  author_name,
  publish_date,
  views_count,
  variant = "default",
}: BlogCardProps) {
  const navigate = useNavigate();

  const formattedDate = publish_date
    ? new Date(publish_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (variant === "featured") {
    return (
      <Card
        className="group cursor-pointer overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
        onClick={() => navigate(`/blog/${id}`)}
      >
        {cover_image_url && (
          <div className="relative h-48 overflow-hidden">
            <img
              src={cover_image_url}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          {summary && (
            <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
              {summary}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formattedDate}
                </span>
              )}
              {views_count !== null && views_count > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {views_count}
                </span>
              )}
            </div>
            <span className="text-primary flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Read <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer border-border/50 bg-card/60 hover:bg-card/80 transition-all duration-300"
      onClick={() => navigate(`/blog/${id}`)}
    >
      <CardContent className="p-4 flex gap-4">
        {cover_image_url && (
          <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden">
            <img
              src={cover_image_url}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h4>
          {summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {summary}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formattedDate}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
