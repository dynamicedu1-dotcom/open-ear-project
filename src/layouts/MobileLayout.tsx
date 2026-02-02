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
    <div className="min-h-screen bg-background flex flex-col">
      {showHeader && <MobileHeader title={title} />}

      <main
        className={`flex-1 ${showHeader ? "pt-14" : ""} ${showBottomNav ? "pb-20" : ""}`}
      >
        {showBanner && (
          <div className="px-4 pt-4 pb-2">
            <BannerDisplay position="mobile-home" className="mb-0" />
          </div>
        )}
        {children}
      </main>

      {showBottomNav && <BottomTabBar />}
    </div>
  );
}
