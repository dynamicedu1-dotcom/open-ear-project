import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface CoreTeamMemberCarouselProps {
  selectedAuthor?: string | null;
  onAuthorSelect: (authorId: string | null) => void;
}

export const CoreTeamMemberCarousel = ({ selectedAuthor, onAuthorSelect }: CoreTeamMemberCarouselProps) => {
  const { data: members } = useQuery({
    queryKey: ["core-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("core_member_profiles")
        .select(`
          user_id,
          team_member:team_members(name, role, image_url)
        `);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          Our Core Team
        </h2>
        {selectedAuthor && (
          <Button variant="outline" size="sm" onClick={() => onAuthorSelect(null)}>
            Show All Posts
          </Button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {members?.map((member) => {
          const isSelected = selectedAuthor === member.user_id;
          const teamMember = member.team_member;
          
          return (
            <Card
              key={member.user_id}
              className={`flex-shrink-0 w-48 p-4 cursor-pointer transition-all hover:shadow-lg ${
                isSelected ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onAuthorSelect(isSelected ? null : member.user_id)}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={teamMember?.image_url} />
                  <AvatarFallback className="text-lg">
                    {teamMember?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{teamMember?.name}</h3>
                  <p className="text-sm text-muted-foreground">{teamMember?.role}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
