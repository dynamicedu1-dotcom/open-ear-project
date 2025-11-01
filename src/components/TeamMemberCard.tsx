import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MessageCircle } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  image: string;
  phone: string;
  email: string;
  whatsapp: string;
}

interface TeamMemberCardProps {
  member: TeamMember;
}

const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
  const handleWhatsApp = () => {
    const message = encodeURIComponent(
      `Hi ${member.name}, I'm reaching out from the Your Voice platform. I'd like to discuss opportunities with Dynamic Edu.`
    );
    window.open(`https://wa.me/${member.whatsapp}?text=${message}`, '_blank');
  };

  const handleEmail = () => {
    window.location.href = `mailto:${member.email}`;
  };

  const handlePhone = () => {
    window.location.href = `tel:${member.phone}`;
  };

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-lg">
          <AvatarImage src={member.image} alt={member.name} />
          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <h3 className="font-bold text-lg mb-1">{member.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{member.role}</p>
      </div>
      
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span className="truncate">{member.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Mail className="h-4 w-4" />
          <span className="truncate">{member.email}</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handlePhone}
          >
            <Phone className="h-4 w-4 mr-1" />
            Call
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleEmail}
          >
            <Mail className="h-4 w-4 mr-1" />
            Email
          </Button>
        </div>
        
        <Button
          className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
          onClick={handleWhatsApp}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>
    </Card>
  );
};

export default TeamMemberCard;