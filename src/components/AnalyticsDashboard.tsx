import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Users, Eye, MessageCircle, TrendingUp, Globe, Activity } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<"7" | "30" | "90">("7");
  
  const daysAgo = subDays(new Date(), parseInt(timeRange));

  // Fetch basic stats
  const { data: stats } = useQuery({
    queryKey: ["analyticsStats", timeRange],
    queryFn: async () => {
      const [voices, comments, users, visitors] = await Promise.all([
        supabase
          .from("voices")
          .select("id", { count: "exact", head: true })
          .gte("created_at", daysAgo.toISOString()),
        supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .gte("created_at", daysAgo.toISOString()),
        supabase
          .from("user_profiles")
          .select("id", { count: "exact", head: true })
          .gte("created_at", daysAgo.toISOString()),
        supabase
          .from("active_visitors")
          .select("id", { count: "exact", head: true }),
      ]);

      return {
        newVoices: voices.count || 0,
        newComments: comments.count || 0,
        newUsers: users.count || 0,
        activeVisitors: visitors.count || 0,
      };
    },
  });

  // Fetch daily activity
  const { data: dailyActivity } = useQuery({
    queryKey: ["dailyActivity", timeRange],
    queryFn: async () => {
      const { data: voices } = await supabase
        .from("voices")
        .select("created_at")
        .gte("created_at", daysAgo.toISOString());

      const { data: comments } = await supabase
        .from("comments")
        .select("created_at")
        .gte("created_at", daysAgo.toISOString());

      // Group by date
      const dateMap = new Map<string, { voices: number; comments: number }>();
      
      for (let i = 0; i < parseInt(timeRange); i++) {
        const date = format(subDays(new Date(), i), "MMM d");
        dateMap.set(date, { voices: 0, comments: 0 });
      }

      voices?.forEach((v) => {
        const date = format(new Date(v.created_at), "MMM d");
        if (dateMap.has(date)) {
          dateMap.get(date)!.voices++;
        }
      });

      comments?.forEach((c) => {
        const date = format(new Date(c.created_at), "MMM d");
        if (dateMap.has(date)) {
          dateMap.get(date)!.comments++;
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .reverse();
    },
  });

  // Fetch category distribution
  const { data: categoryData } = useQuery({
    queryKey: ["categoryDistribution", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("voices")
        .select("category")
        .gte("created_at", daysAgo.toISOString());

      const counts = new Map<string, number>();
      data?.forEach((v) => {
        counts.set(v.category, (counts.get(v.category) || 0) + 1);
      });

      return Array.from(counts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    },
  });

  // Fetch top content
  const { data: topContent } = useQuery({
    queryKey: ["topContent", timeRange],
    queryFn: async () => {
      const { data } = await supabase
        .from("voices")
        .select("id, content, support_count, comment_count, likes_count, category")
        .gte("created_at", daysAgo.toISOString())
        .order("support_count", { ascending: false })
        .limit(5);

      return data || [];
    },
  });

  // Fetch visitor countries (if available)
  const { data: visitorLocations } = useQuery({
    queryKey: ["visitorLocations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("active_visitors")
        .select("country")
        .not("country", "is", null);

      const counts = new Map<string, number>();
      data?.forEach((v) => {
        if (v.country) {
          counts.set(v.country, (counts.get(v.country) || 0) + 1);
        }
      });

      return Array.from(counts.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
    },
  });

  const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Platform insights and metrics</CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v: "7" | "30" | "90") => setTimeRange(v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Active Now</span>
            </div>
            <p className="text-2xl font-bold">{stats?.activeVisitors || 0}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">New Voices</span>
            </div>
            <p className="text-2xl font-bold">{stats?.newVoices || 0}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-blue-500/10">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">Comments</span>
            </div>
            <p className="text-2xl font-bold">{stats?.newComments || 0}</p>
          </div>
          
          <div className="p-4 rounded-lg bg-purple-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">New Users</span>
            </div>
            <p className="text-2xl font-bold">{stats?.newUsers || 0}</p>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="space-y-4">
          <h3 className="font-semibold">Daily Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyActivity || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="voices" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  name="Voices"
                />
                <Line 
                  type="monotone" 
                  dataKey="comments" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Comments"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          <div className="space-y-4">
            <h3 className="font-semibold">Categories</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryData?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Visitor Locations */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Visitor Locations
            </h3>
            {visitorLocations && visitorLocations.length > 0 ? (
              <div className="space-y-2">
                {visitorLocations.map((loc, index) => (
                  <div key={loc.name} className="flex items-center justify-between">
                    <span className="text-sm">{loc.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ 
                            width: `${(loc.value / visitorLocations[0].value) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{loc.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Location data not available yet
              </p>
            )}
          </div>
        </div>

        {/* Top Content */}
        <div className="space-y-4">
          <h3 className="font-semibold">Top Content</h3>
          <div className="space-y-3">
            {topContent?.map((voice, index) => (
              <div key={voice.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <span className="font-bold text-lg text-muted-foreground w-6">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{voice.content}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 bg-primary/10 rounded">{voice.category}</span>
                    <span>❤️ {voice.support_count + voice.likes_count}</span>
                    <span>💬 {voice.comment_count}</span>
                  </div>
                </div>
              </div>
            ))}

            {(!topContent || topContent.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No content in this time period
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
