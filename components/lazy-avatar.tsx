"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface LazyAvatarProps {
  src?: string;
  alt: string;
  /** Size/shape classes for the container (e.g. "h-16 w-16 rounded-full") */
  className?: string;
}

// Renders instantly as a pulsing placeholder and fades the real photo in only
// once the browser has fully downloaded it, so a page of cards never waits on
// images. `loading="lazy"` means off-screen cards don't fetch anything until
// they're scrolled into view.
export function LazyAvatar({ src, alt, className }: LazyAvatarProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset when the source changes (e.g. after uploading a new photo). Images
  // served from the browser cache can finish before React attaches onLoad,
  // so also check the element's own state.
  useEffect(() => {
    const img = imgRef.current;
    setStatus(img?.complete && img.naturalWidth > 0 ? "loaded" : "loading");
  }, [src]);

  return (
    <div className={cn("relative overflow-hidden bg-slate-100", className)}>
      {status !== "loaded" && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-slate-200",
            status === "loading" && "animate-pulse"
          )}
        >
          <User className="h-2/5 w-2/5 text-slate-400" />
        </div>
      )}
      {src && status !== "error" && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setStatus("loaded")}
          onError={() => setStatus("error")}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            status === "loaded" ? "opacity-100" : "opacity-0"
          )}
        />
      )}
    </div>
  );
}
