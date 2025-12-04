import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Activity, Settings, LogOut, ChevronDown } from "lucide-react";
import { useIdentity } from "@/hooks/useIdentity";
import { EmailCaptureModal } from "./EmailCaptureModal";

export const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { profile, isIdentified, isLoading, getDisplayName, getUserId, clearSession, requestIdentity } = useIdentity();
  const [showEmailModal, setShowEmailModal] = useState(false);

  const displayName = getDisplayName();
  const userId = getUserId();

  const handleMyActivity = () => {
    if (!isIdentified) {
      setShowEmailModal(true);
      return;
    }
    navigate("/my-activity");
  };

  const handleLogout = () => {
    clearSession();
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <User className="h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!isIdentified) {
    return (
      <>
        <EmailCaptureModal
          open={showEmailModal}
          onOpenChange={setShowEmailModal}
          onSuccess={() => setShowEmailModal(false)}
          actionDescription="access your activity"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEmailModal(true)}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Join</span>
        </Button>
      </>
    );
  }

  return (
    <>
      <EmailCaptureModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        onSuccess={() => setShowEmailModal(false)}
        actionDescription="access your activity"
      />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 max-w-[150px]">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
            </div>
            <span className="truncate text-sm hidden sm:inline">
              {userId || displayName}
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2">
            <p className="text-sm font-medium">{displayName}</p>
            {userId && (
              <p className="text-xs text-muted-foreground">{userId}</p>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleMyActivity} className="cursor-pointer">
            <Activity className="mr-2 h-4 w-4" />
            My Activity
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
