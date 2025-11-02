import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  testimonial?: string;
}

interface PartnerCardProps {
  partner: Partner;
  showDialog?: boolean;
}

export const PartnerCard = ({ partner, showDialog = true }: PartnerCardProps) => {
  const cardContent = (
    <Card className={showDialog ? "cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105" : ""}>
        <CardContent className="p-6 flex flex-col items-center gap-4">
          {partner.logo_url ? (
            <img 
              src={partner.logo_url} 
              alt={`${partner.name} logo`}
              className="h-16 w-auto object-contain"
            />
          ) : (
            <div className="h-16 w-24 bg-muted rounded flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">{partner.name}</span>
            </div>
          )}
          <h3 className="font-semibold text-center">{partner.name}</h3>
        </CardContent>
      </Card>
  );

  if (!showDialog) {
    return cardContent;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {cardContent}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{partner.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {partner.logo_url && (
            <img 
              src={partner.logo_url} 
              alt={`${partner.name} logo`}
              className="h-20 w-auto object-contain mx-auto"
            />
          )}
          {partner.description && (
            <p className="text-muted-foreground">{partner.description}</p>
          )}
          {partner.testimonial && (
            <blockquote className="border-l-4 border-primary pl-4 italic">
              "{partner.testimonial}"
            </blockquote>
          )}
          {partner.website && (
            <a 
              href={partner.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Visit Website <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
