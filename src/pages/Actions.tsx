import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ActionCard } from "@/components/ActionCard";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Action {
  id: string;
  title: string;
  description: string;
  status: string;
  views: number;
  related_voices: string[] | null;
  image_url: string | null;
  created_at: string;
}

const Actions = () => {
  const navigate = useNavigate();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      let query = supabase
        .from("actions")
        .select("*");

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const orderColumn = sortBy === "views" ? "views" : "created_at";
      query = query.order(orderColumn, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setActions((data || []) as Action[]);
    } catch (error) {
      console.error("Error fetching actions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-accent py-16 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            You Said, We Did 💡
          </h1>
          <p className="text-lg text-foreground/80 max-w-2xl mx-auto">
            Dynamic Edu doesn't just listen — we act. Here's how your voices are
            shaping real change in education.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Ongoing">Ongoing</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="views">Most Viewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Actions Grid */}
      <section className="py-8 px-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-card/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : actions.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-accent animate-pulse" />
            <h3 className="text-2xl font-bold mb-4">
              We're Listening & Preparing to Act
            </h3>
            <p className="text-foreground/70 mb-8 max-w-md mx-auto">
              Your voices are being heard. Dynamic Edu is working on initiatives
              based on your feedback. Check back soon to see real change in action!
            </p>
            <Button
              onClick={() => navigate("/collaborate")}
              className="gradient-accent"
            >
              Want to Collaborate?
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                id={action.id}
                title={action.title}
                description={action.description}
                status={action.status}
                views={action.views}
                relatedVoices={action.related_voices || undefined}
                imageUrl={action.image_url}
                createdAt={action.created_at}
              />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-card/30 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Want to Collaborate on Solutions?
          </h2>
          <p className="text-foreground/80 mb-8">
            Join us in creating meaningful change. Partner with Dynamic Edu to
            build a better future for students.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/collaborate")}
            className="gradient-accent shadow-accent-glow"
          >
            Let's Collaborate
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Actions;
