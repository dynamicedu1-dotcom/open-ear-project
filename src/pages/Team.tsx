import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TeamMemberCard from "@/components/TeamMemberCard";

const teamMembers = [
  {
    id: 1,
    name: "Dr. Sarah Johnson",
    role: "CEO & Founder",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    phone: "+1-555-0101",
    email: "sarah.johnson@dynamicedu.com",
    whatsapp: "15550101"
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Head of Education",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    phone: "+1-555-0102",
    email: "michael.chen@dynamicedu.com",
    whatsapp: "15550102"
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "Student Relations Manager",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    phone: "+1-555-0103",
    email: "emily.rodriguez@dynamicedu.com",
    whatsapp: "15550103"
  },
  {
    id: 4,
    name: "David Kim",
    role: "Technology Director",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    phone: "+1-555-0104",
    email: "david.kim@dynamicedu.com",
    whatsapp: "15550104"
  },
  {
    id: 5,
    name: "Aisha Patel",
    role: "Community Engagement Lead",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
    phone: "+1-555-0105",
    email: "aisha.patel@dynamicedu.com",
    whatsapp: "15550105"
  },
  {
    id: 6,
    name: "James Wilson",
    role: "Partnership Coordinator",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
    phone: "+1-555-0106",
    email: "james.wilson@dynamicedu.com",
    whatsapp: "15550106"
  },
  {
    id: 7,
    name: "Sofia Martinez",
    role: "Content Strategist",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop",
    phone: "+1-555-0107",
    email: "sofia.martinez@dynamicedu.com",
    whatsapp: "15550107"
  },
  {
    id: 8,
    name: "Robert Taylor",
    role: "Program Manager",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    phone: "+1-555-0108",
    email: "robert.taylor@dynamicedu.com",
    whatsapp: "15550108"
  },
  {
    id: 9,
    name: "Lisa Anderson",
    role: "Research Analyst",
    image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
    phone: "+1-555-0109",
    email: "lisa.anderson@dynamicedu.com",
    whatsapp: "15550109"
  },
  {
    id: 10,
    name: "Kevin Brown",
    role: "Operations Manager",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    phone: "+1-555-0110",
    email: "kevin.brown@dynamicedu.com",
    whatsapp: "15550110"
  }
];

const Team = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

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
          {teamMembers.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
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