import { ReactNode } from "react";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";
import { BannerDisplay } from "@/components/BannerDisplay";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBanner?: boolean;
  showHeader?: boolean;
  showBottomNav?: boolean;
}

export function MobileLayout({
  children,
  title,
  showBanner = false,
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
        {showBanner && (
          <div className="px-4 py-3">
            <BannerDisplay position="mobile-home" />
          </div>
        )}
        {children}
      </main>

      {showBottomNav && <BottomTabBar />}
    </div>
  );
}
