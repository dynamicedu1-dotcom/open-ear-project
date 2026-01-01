import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileHeaderProps {
  title?: string;
  showNotification?: boolean;
  notificationCount?: number;
}

export function MobileHeader({
  title = "Your Voice",
  showNotification = true,
  notificationCount = 0,
}: MobileHeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <button
          onClick={() => navigate("/")}
          className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
        >
          {title}
        </button>

        {showNotification && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {notificationCount > 99 ? "99+" : notificationCount}
              </Badge>
            )}
          </Button>
        )}
      </div>
    </header>
  );
}