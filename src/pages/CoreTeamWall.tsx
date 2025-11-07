import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CoreTeamMemberCarousel } from "@/components/core-team/CoreTeamMemberCarousel";
import { PublicPostCard } from "@/components/core-team/PublicPostCard";
import { TrendingPostsSidebar } from "@/components/core-team/TrendingPostsSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Loader2 } from "lucide-react";

const CoreTeamWall = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [postTypeFilter, setPostTypeFilter] = useState(searchParams.get("type") || "all");
  const [sortBy, setSortBy] = useState("latest");
  const authorFilter = searchParams.get("author");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["public-posts", postTypeFilter, authorFilter, sortBy, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("core_team_posts")
        .select(`
          *,
          author:core_member_profiles!inner(
            team_member:team_members(name, role, image_url)
          )
        `)
        .eq("visibility", "public")
        .eq("status", "published");

      if (postTypeFilter !== "all") {
        query = query.eq("post_type", postTypeFilter);
      }

      if (authorFilter) {
        query = query.eq("author_id", authorFilter);
      }

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
      }

      switch (sortBy) {
        case "popular":
          query = query.order("trending_score", { ascending: false });
          break;
        case "liked":
          query = query.order("likes_count", { ascending: false });
          break;
        case "commented":
          query = query.order("comment_count", { ascending: false });
          break;
        case "pinned":
          query = query.order("is_pinned", { ascending: false }).order("created_at", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <div className="gradient-warm py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-glow to-accent-glow bg-clip-text text-transparent">
            Dynamic Core Team
          </h1>
          <p className="text-lg text-foreground/80">
            Voices, Ideas & Updates from Our Team
          </p>
        </div>
      </div>

      {/* Team Members Carousel */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <CoreTeamMemberCarousel
          selectedAuthor={authorFilter}
          onAuthorSelect={(authorId) => {
            if (authorId) {
              setSearchParams({ author: authorId });
            } else {
              setSearchParams({});
            }
          }}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={postTypeFilter} onValueChange={setPostTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="update">💡 Updates</SelectItem>
                  <SelectItem value="idea">🚀 Ideas</SelectItem>
                  <SelectItem value="task">✅ Tasks</SelectItem>
                  <SelectItem value="announcement">📢 Announcements</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="liked">Most Liked</SelectItem>
                  <SelectItem value="commented">Most Commented</SelectItem>
                  <SelectItem value="pinned">Pinned First</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Posts Feed */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : posts?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg">
                  No posts found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {posts?.map((post: any) => (
                  <PublicPostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Trending Sidebar */}
          <div className="lg:col-span-1">
            <TrendingPostsSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreTeamWall;
