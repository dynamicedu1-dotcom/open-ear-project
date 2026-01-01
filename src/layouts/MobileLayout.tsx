import { ReactNode } from "react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { StoriesCarousel } from "@/components/mobile/StoriesCarousel";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showStories?: boolean;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function MobileLayout({
  children,
  title,
  showStories = false,
  showHeader = true,
  showBottomNav = true,
}: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <MobileHeader title={title} />}

      <main
        className={`
        ${showHeader ? "pt-14" : ""} 
        ${showBottomNav ? "pb-20" : ""}
      `}
      >
        {showStories && <StoriesCarousel />}
        {children}
      </main>

      {showBottomNav && <BottomTabBar />}
    </div>
  );
}