import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import TeamMemberCard from "@/components/TeamMemberCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Team = () => {
  const navigate = useNavigate();

  // Fetch team members from database
  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      
      // Map database fields to component props
      return data.map((member) => ({
        id: member.id,
        name: member.name,
        role: member.role,
        image: member.profile_image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
        phone: member.phone,
        email: member.email,
        whatsapp: member.whatsapp,
      }));
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Meet Our Team
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with the passionate individuals behind Dynamic Edu. We're here to listen, support, and collaborate with you.
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Loading team members...
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No team members to display. Check back soon!
            </div>
          ) : (
            teamMembers.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))
          )}
        </div>

        {/* CTA Section */}
        <div className="bg-card rounded-lg p-8 text-center border shadow-lg">
          <h2 className="text-2xl font-bold mb-3">Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            Don't hesitate to reach out to any of our team members. We're here to help!
          </p>
          <Button onClick={() => navigate("/contact")} size="lg">
            Contact Us
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Team;