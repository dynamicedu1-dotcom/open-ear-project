import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { BlogCard } from "@/components/BlogCard";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function Blog() {
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["allBlogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_blogs")
        .select("*")
        .eq("is_published", true)
        .order("publish_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="relative overflow-hidden gradient-warm py-16 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-48 h-48 bg-primary rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold">Weekly Blog</h1>
          </div>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Insights, updates, and stories from Dynamic Edu. Stay informed about education trends and community highlights.
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-72 rounded-lg" />
            ))}
          </div>
        ) : !blogs || blogs.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h2 className="text-2xl font-semibold mb-2">No Blog Posts Yet</h2>
            <p className="text-muted-foreground mb-6">
              Check back soon for new content from Dynamic Edu.
            </p>
            <Button onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}
      </section>
    </div>
  );
}
