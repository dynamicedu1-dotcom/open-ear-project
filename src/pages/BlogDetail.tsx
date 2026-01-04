import { useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Eye, MapPin, Clock, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EventRegistrationForm } from "@/components/EventRegistrationForm";
import { format } from "date-fns";

export default function BlogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const viewCountedRef = useRef(false);

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

  useEffect(() => {
    const incrementView = async () => {
      if (id && !viewCountedRef.current) {
        viewCountedRef.current = true;
        try {
          await supabase.rpc('increment_blog_views', { blog_uuid: id });
        } catch (err) {
          console.error('Failed to increment view count:', err);
        }
      }
    };
    incrementView();
  }, [id]);

  const formattedDate = blog?.publish_date
    ? new Date(blog.publish_date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const isEventOrRegistration = blog?.blog_type === "event" || blog?.blog_type === "registration";

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
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/blog")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Button>

        {blog.cover_image_url && (
          <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden mb-8">
            <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          {blog.blog_type && blog.blog_type !== "article" && (
            <Badge variant="secondary" className="capitalize">{blog.blog_type}</Badge>
          )}
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4">{blog.title}</h1>

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

        {/* Event Info Banner */}
        {isEventOrRegistration && blog.event_date && (
          <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl mb-8">
            <h3 className="font-semibold text-lg mb-4">Event Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{format(new Date(blog.event_date), "EEEE, MMMM d, yyyy")}</div>
                  <div className="text-sm text-muted-foreground">{format(new Date(blog.event_date), "h:mm a")}</div>
                </div>
              </div>
              {blog.event_location && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span>{blog.event_location}</span>
                </div>
              )}
              {blog.is_paid && blog.price && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="font-semibold">₹{blog.price}</span>
                </div>
              )}
              {blog.event_slots && blog.event_slots > 0 && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{blog.event_slots} slots available</span>
                </div>
              )}
            </div>
          </div>
        )}

        {blog.summary && (
          <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary pl-4">
            {blog.summary}
          </p>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          {blog.content.split("\n").map((paragraph: string, index: number) => (
            <p key={index} className="mb-4">{paragraph}</p>
          ))}
        </div>

        {/* Registration Form */}
        {isEventOrRegistration && blog.registration_fields && (
          <EventRegistrationForm
            blogId={blog.id}
            blogTitle={blog.title}
            eventDate={blog.event_date}
            eventEndDate={blog.event_end_date}
            eventLocation={blog.event_location}
            eventSlots={blog.event_slots}
            registrationFields={Array.isArray(blog.registration_fields) ? blog.registration_fields as Array<{ name: string; label: string; type: string; required: boolean }> : []}
            isPaid={blog.is_paid || false}
            price={blog.price}
            registrationDeadline={blog.registration_deadline}
            requiresApproval={blog.requires_approval || false}
            maxRegistrations={blog.max_registrations}
          />
        )}
      </article>
    </div>
  );
}