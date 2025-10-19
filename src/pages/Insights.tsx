import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, MessageSquare, Heart, Star, Users } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

interface InsightsData {
  totalVoices: number;
  totalActions: number;
  totalSupports: number;
  avgRating: number;
  moodBreakdown: { name: string; value: number; emoji: string }[];
  categoryBreakdown: { name: string; value: number }[];
  topLocations: { location: string; count: number }[];
  recentTrends: { date: string; count: number }[];
}

const MOOD_COLORS = {
  happy: "#10b981",
  sad: "#3b82f6",
  angry: "#ef4444",
  worried: "#f59e0b",
  excited: "#8b5cf6",
};

const MOOD_EMOJIS = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  worried: "😟",
  excited: "🤩",
};

const Insights = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InsightsData>({
    totalVoices: 0,
    totalActions: 0,
    totalSupports: 0,
    avgRating: 0,
    moodBreakdown: [],
    categoryBreakdown: [],
    topLocations: [],
    recentTrends: [],
  });

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);

      // Fetch voices
      const { data: voices, error: voicesError } = await supabase
        .from("voices")
        .select("*");

      if (voicesError) throw voicesError;

      // Fetch actions
      const { data: actions, error: actionsError } = await supabase
        .from("actions")
        .select("*");

      if (actionsError) throw actionsError;

      // Fetch feedback
      const { data: feedback, error: feedbackError } = await supabase
        .from("feedback")
        .select("rating");

      if (feedbackError) throw feedbackError;

      // Calculate metrics
      const totalVoices = voices?.length || 0;
      const totalActions = actions?.length || 0;
      const totalSupports = voices?.reduce((sum, v) => sum + (v.support_count || 0), 0) || 0;
      
      const ratings = feedback?.filter(f => f.rating !== null).map(f => f.rating!) || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      // Mood breakdown
      const moodCounts: Record<string, number> = {};
      voices?.forEach(v => {
        moodCounts[v.mood] = (moodCounts[v.mood] || 0) + 1;
      });
      const moodBreakdown = Object.entries(moodCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        emoji: MOOD_EMOJIS[name as keyof typeof MOOD_EMOJIS] || "😐",
      }));

      // Category breakdown
      const categoryCounts: Record<string, number> = {};
      voices?.forEach(v => {
        categoryCounts[v.category] = (categoryCounts[v.category] || 0) + 1;
      });
      const categoryBreakdown = Object.entries(categoryCounts).map(([name, value]) => ({
        name,
        value,
      }));

      // Top locations
      const locationCounts: Record<string, number> = {};
      voices?.forEach(v => {
        if (v.location) {
          locationCounts[v.location] = (locationCounts[v.location] || 0) + 1;
        }
      });
      const topLocations = Object.entries(locationCounts)
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setData({
        totalVoices,
        totalActions,
        totalSupports,
        avgRating: Math.round(avgRating * 10) / 10,
        moodBreakdown,
        categoryBreakdown,
        topLocations,
        recentTrends: [],
      });
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>

        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Platform Insights
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the impact we're making together through data and trends
          </p>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 animate-slide-up">
              <Card className="border-primary/20 shadow-card hover:shadow-lg transition-all">
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Total Voices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-4xl font-bold text-primary">{data.totalVoices}</p>
                </CardContent>
              </Card>

              <Card className="border-accent/20 shadow-card hover:shadow-lg transition-all">
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Actions Taken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-4xl font-bold text-accent">{data.totalActions}</p>
                </CardContent>
              </Card>

              <Card className="border-mood-happy/20 shadow-card hover:shadow-lg transition-all">
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Total Supports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-4xl font-bold text-mood-happy">{data.totalSupports}</p>
                </CardContent>
              </Card>

              <Card className="border-mood-excited/20 shadow-card hover:shadow-lg transition-all">
                <CardHeader className="pb-2 md:pb-3">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Avg Rating
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-4xl font-bold text-mood-excited">
                    {data.avgRating > 0 ? data.avgRating.toFixed(1) : "N/A"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 md:mb-12">
              {/* Mood Breakdown */}
              <Card className="shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle>Mood Distribution</CardTitle>
                  <CardDescription>How students are feeling</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.moodBreakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                      <ResponsiveContainer width="100%" height={300} minWidth={300}>
                        <PieChart>
                        <Pie
                          data={data.moodBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, emoji }) => `${emoji} ${name}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {data.moodBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={MOOD_COLORS[entry.name.toLowerCase() as keyof typeof MOOD_COLORS] || "#888"}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No mood data available yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card className="shadow-card animate-fade-in">
                <CardHeader>
                  <CardTitle>Topic Categories</CardTitle>
                  <CardDescription>What students are talking about</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.categoryBreakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                      <ResponsiveContainer width="100%" height={300} minWidth={300}>
                        <BarChart data={data.categoryBreakdown}>
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No category data available yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Locations */}
            {data.topLocations.length > 0 && (
              <Card className="shadow-card mb-12 animate-slide-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Locations
                  </CardTitle>
                  <CardDescription>Where voices are coming from</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.topLocations.map((loc, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <span className="font-medium">{loc.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-gradient-primary rounded-full" style={{ width: `${(loc.count / data.topLocations[0].count) * 200}px` }} />
                          <span className="text-muted-foreground font-medium min-w-[3ch]">{loc.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA Section */}
            <div className="text-center py-12 px-6 rounded-2xl bg-gradient-accent shadow-xl animate-fade-in">
              <h2 className="text-3xl font-bold mb-4">Join the Movement</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Every voice matters. Share yours and help us create positive change.
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button size="lg" onClick={() => navigate("/share")} className="gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Share Your Voice
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/wall")}>
                  View All Voices
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Insights;
