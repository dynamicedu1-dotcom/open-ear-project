import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_blogs")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Increment view count
  useEffect(() => {
    if (id) {
      supabase
        .from("weekly_blogs")
        .update({ views_count: (blog?.views_count || 0) + 1 })
        .eq("id", id)
        .then(() => {});
    }
  }, [id]);

  const formattedDate = blog?.publish_date
    ? new Date(blog.publish_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <Skeleton className="h-64 w-full mb-8" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This blog post doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/blog")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/blog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>

        {/* Cover Image */}
        {blog.cover_image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>

        {/* Meta */}
        <div className="flex items-center gap-6 text-muted-foreground mb-8 flex-wrap">
          {blog.author_name && (
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" />
              {blog.author_name}
            </span>
          )}
          {formattedDate && (
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </span>
          )}
          {blog.views_count !== null && blog.views_count > 0 && (
            <span className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {blog.views_count} views
            </span>
          )}
        </div>

        {/* Summary */}
        {blog.summary && (
          <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary pl-4">
            {blog.summary}
          </p>
        )}

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {blog.content.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </div>
  );
}
