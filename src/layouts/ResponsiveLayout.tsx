import { ReactNode } from "react";
import { useIsMobile } from "@/hooks/useDeviceType";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";

interface ResponsiveLayoutProps {
  children: ReactNode;
  mobileTitle?: string;
  showBanner?: boolean;
  /** Set to true for pages that handle their own layout */
  noLayout?: boolean;
}

export function ResponsiveLayout({
  children,
  mobileTitle,
  showBanner = false,
  noLayout = false,
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  if (noLayout) {
    return <>{children}</>;
  }

  if (isMobile) {
    return (
      <MobileLayout title={mobileTitle} showBanner={showBanner}>
        {children}
      </MobileLayout>
    );
  }

  return <DesktopLayout>{children}</DesktopLayout>;
}
