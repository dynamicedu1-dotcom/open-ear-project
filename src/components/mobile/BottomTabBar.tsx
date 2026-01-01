import { useNavigate, useLocation } from "react-router-dom";
import { Home, MessageSquare, Plus, Activity, User, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { MoreDrawer } from "./MoreDrawer";

interface TabItem {
  path: string;
  icon: typeof Home;
  label: string;
  isAction?: boolean;
}

const tabs: TabItem[] = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/wall", icon: MessageSquare, label: "Wall" },
  { path: "/share", icon: Plus, label: "Post", isAction: true },
  { path: "/my-activity", icon: Activity, label: "Activity" },
  { path: "more", icon: Menu, label: "More" },
];

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTabClick = (tab: TabItem) => {
    if (tab.path === "more") {
      setMoreOpen(true);
    } else {
      navigate(tab.path);
    }
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = tab.path !== "more" && location.pathname === tab.path;
            const Icon = tab.icon;

            return (
              <button
                key={tab.path}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors",
                  tab.isAction && "relative"
                )}
              >
                {tab.isAction ? (
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center -mt-6 shadow-lg">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : (
                  <>
                    <Icon
                      className={cn(
                        "h-5 w-5 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {tab.label}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <MoreDrawer open={moreOpen} onOpenChange={setMoreOpen} />
    </>
  );
}