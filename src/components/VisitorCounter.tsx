import { Users } from "lucide-react";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

const VisitorCounter = () => {
  const visitorCount = useVisitorTracking();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Users className="h-4 w-4 animate-pulse" />
      <span>
        <strong className="text-foreground">{visitorCount}</strong> visitor{visitorCount !== 1 ? 's' : ''} online
      </span>
    </div>
  );
};

export default VisitorCounter;