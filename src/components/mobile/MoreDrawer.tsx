import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Users,
  Handshake,
  MessageCircle,
  Phone,
  Lightbulb,
  BarChart3,
  UserSquare,
  BookOpen,
  Shield,
  Settings,
  HelpCircle,
  FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface MoreDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  { path: "/blog", icon: BookOpen, label: "Blog" },
  { path: "/actions", icon: Lightbulb, label: "Action Hub" },
  { path: "/collaborate", icon: Handshake, label: "Collaborate" },
  { path: "/team", icon: UserSquare, label: "Our Team" },
  { path: "/feedback", icon: MessageCircle, label: "Feedback" },
  { path: "/contact", icon: Phone, label: "Contact Us" },
  { path: "/insights", icon: BarChart3, label: "Insights" },
];

const secondaryItems = [
  { path: "/team-panel", icon: Shield, label: "Team Panel" },
];

export function MoreDrawer({ open, onOpenChange }: MoreDrawerProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-center">More Options</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-20">
          {/* Main Menu Items */}
          <div className="grid grid-cols-3 gap-3">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="flex flex-col items-center justify-center h-24 gap-2 bg-muted/50 hover:bg-muted rounded-xl"
                onClick={() => handleNavigate(item.path)}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Secondary Items */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-2">
              Quick Access
            </p>
            {secondaryItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigate(item.path)}
              >
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span>{item.label}</span>
              </Button>
            ))}
            {user && (
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigate("/admin")}
              >
                <Shield className="h-5 w-5 text-muted-foreground" />
                <span>Admin Panel</span>
              </Button>
            )}
          </div>

          {/* Footer Links */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <button className="hover:text-foreground transition-colors">
                Terms
              </button>
              <button className="hover:text-foreground transition-colors">
                Privacy
              </button>
              <button className="hover:text-foreground transition-colors">
                About
              </button>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              © 2025 Dynamic Edu
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}