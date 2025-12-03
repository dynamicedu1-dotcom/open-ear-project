import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BlogCard } from "./BlogCard";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export function WeeklyBlogSection() {
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["weeklyBlogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_blogs")
        .select("*")
        .eq("is_published", true)
        .order("publish_date", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Weekly Blog
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (!blogs || blogs.length === 0) {
    return (
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            Weekly Blog
          </h2>
        </div>
        <div className="text-center py-12 bg-card/30 rounded-2xl border border-border/50">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No blog posts yet. Check back soon!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Weekly Blog
        </h2>
        <Button
          variant="ghost"
          className="group"
          onClick={() => navigate("/blog")}
        >
          View All
          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{blogs.map((blog) => (
          <BlogCard
            {...{ key: blog.id }}
            id={blog.id}
            title={blog.title}
            summary={blog.summary}
            cover_image_url={blog.cover_image_url}
            author_name={blog.author_name}
            publish_date={blog.publish_date}
            views_count={blog.views_count}
            variant="featured"
          />
        ))}
      </div>
    </section>
  );
}
