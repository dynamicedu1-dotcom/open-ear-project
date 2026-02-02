import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useState } from "react";

interface BannerDisplayProps {
  position: string;
  className?: string;
}

export function BannerDisplay({ position, className = "" }: BannerDisplayProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // For mobile-home, also fallback to home-hero banners
  const positions = position === "mobile-home" ? ["mobile-home", "home-hero"] : [position];

  const { data: banners } = useQuery({
    queryKey: ["banners", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .in("position", positions)
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("display_order", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const visibleBanners = banners?.filter(b => !dismissed.has(b.id)) || [];

  if (visibleBanners.length === 0) return null;

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {visibleBanners.map((banner) => {
        const isAd = banner.banner_type === "ad";
        const isUpdate = banner.banner_type === "update";
        const isAnnouncement = banner.banner_type === "announcement";

        return (
          <div
            key={banner.id}
            className={`relative rounded-lg overflow-hidden ${
              isAd 
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20" 
                : isUpdate
                  ? "bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20"
                  : "bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20"
            }`}
          >
            {banner.external_link ? (
              <a
                href={banner.external_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <BannerContent banner={banner} />
              </a>
            ) : (
              <BannerContent banner={banner} />
            )}

            {/* Dismiss button */}
            <button
              onClick={() => handleDismiss(banner.id)}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Type badge */}
            {isAd && (
              <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                Sponsored
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BannerContent({ banner }: { banner: any }) {
  return (
    <div className="flex items-center gap-4 p-4">
      {banner.image_url && (
        <img
          src={banner.image_url}
          alt={banner.title || "Banner"}
          className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        {banner.title && (
          <h3 className="font-semibold text-sm md:text-base truncate">
            {banner.title}
          </h3>
        )}
        {banner.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {banner.description}
          </p>
        )}
      </div>
    </div>
  );
}
