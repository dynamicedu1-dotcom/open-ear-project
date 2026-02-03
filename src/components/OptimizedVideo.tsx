import React, { useRef, useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface OptimizedVideoProps {
  src: string;
  poster?: string;
  className?: string;
  maxHeight?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  lazyLoad?: boolean;
}

export const OptimizedVideo = ({
  src,
  poster,
  className,
  maxHeight = "max-h-64",
  controls = true,
  autoPlay = false,
  muted = false,
  loop = false,
  onClick,
  lazyLoad = true,
}: OptimizedVideoProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Pre-load 100px before visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad]);

  // Handle video ready state
  const handleCanPlay = () => {
    setIsLoading(false);
    setIsReady(true);
  };

  const handleLoadedMetadata = () => {
    // Video metadata loaded - show the video immediately
    setIsLoading(false);
    setIsReady(true);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsReady(true);
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-lg overflow-hidden bg-muted", className)}
      onClick={onClick}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className={cn("w-full h-full", maxHeight)} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        </div>
      )}

      {/* Video element - only render source when visible */}
      {isVisible && (
        <video
          ref={videoRef}
          className={cn(
            "w-full object-contain bg-black rounded-lg transition-opacity duration-300",
            maxHeight,
            isReady ? "opacity-100" : "opacity-0"
          )}
          controls={controls}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          playsInline
          preload="metadata"
          poster={poster}
          onCanPlay={handleCanPlay}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
        >
          <source src={src} type="video/mp4" />
          <source src={src} type="video/webm" />
          Your browser does not support video playback.
        </video>
      )}

      {/* Placeholder when not visible yet */}
      {!isVisible && (
        <div className={cn("w-full bg-muted flex items-center justify-center", maxHeight, "min-h-[160px]")}>
          <Skeleton className="w-full h-full min-h-[160px]" />
        </div>
      )}
    </div>
  );
};
