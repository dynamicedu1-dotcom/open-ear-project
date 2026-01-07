import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu, X, Home, MessageSquare, Lightbulb, Users, UserSquare, MessageCircle, Shield, BookOpen, Heart, Search } from "lucide-react";
import { GlobalSearch } from "@/components/GlobalSearch";
import { supabase } from "@/integrations/supabase/client";
import { ProfileDropdown } from "./ProfileDropdown";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: Home },
    { path: "/wall", label: "Opinion Wall", icon: MessageSquare },
    { path: "/blog", label: "Blog", icon: BookOpen },
    { path: "/actions", label: "Actions", icon: Lightbulb },
    { path: "/collaborate", label: "Collaborate", icon: Users },
    { path: "/team", label: "Team", icon: UserSquare },
    { path: "/donate", label: "Donate", icon: Heart },
    { path: "/feedback", label: "Feedback", icon: MessageCircle },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="font-bold text-lg hover:text-primary"
              onClick={() => handleNavigate("/")}
            >
              Your Voice
            </Button>
          </div>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.path}
                variant={isActive(link.path) ? "default" : "ghost"}
                size="sm"
                onClick={() => handleNavigate(link.path)}
                className="gap-2"
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchOpen(true)}
              title="Search (⌘K)"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ProfileDropdown />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleNavigate("/team-panel")}
              className="gap-2"
            >
              <Shield className="h-4 w-4" />
              Team Panel
            </Button>
            {user && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleNavigate("/admin")}
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between h-14">
          <Button
            variant="ghost"
            className="font-bold text-base"
            onClick={() => handleNavigate("/")}
          >
            Your Voice
          </Button>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <span className="font-bold text-lg">Menu</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 overflow-y-auto py-4">
                  {navLinks.map((link) => (
                    <Button
                      key={link.path}
                      variant={isActive(link.path) ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 h-12 px-6"
                      onClick={() => handleNavigate(link.path)}
                    >
                      <link.icon className="h-5 w-5" />
                      <span className="text-base">{link.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Profile & Auth Section */}
                <div className="p-4 border-t border-border space-y-2">
                  <ProfileDropdown />
                  <Button
                    variant="outline"
                    className="w-full gap-2 h-12"
                    onClick={() => handleNavigate("/team-panel")}
                  >
                    <Shield className="h-5 w-5" />
                    Team Panel
                  </Button>
                  {user && (
                    <Button
                      variant="default"
                      className="w-full gap-2 h-12"
                      onClick={() => handleNavigate("/admin")}
                    >
                      <Shield className="h-5 w-5" />
                      Admin Panel
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </nav>
  );
};
