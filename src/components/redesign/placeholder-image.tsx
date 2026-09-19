import Image from "next/image";
import { cn } from "cn";

interface PlaceholderImageProps {
  src?: string | null;
  alt: string;
  /** Which diagonal-stripe pattern to fall back to when there's no src. */
  tone?: "light" | "dark";
  className?: string;
  sizes?: string;
}

/**
 * Image slot that renders the real photo when there's a src (vehicles.image_url,
 * a receipt file, …) or the handoff's diagonal-stripe placeholder otherwise.
 * Caller controls size/radius via className (this only fills that box).
 */
function PlaceholderImage({ src, alt, tone = "light", className, sizes = "100vw" }: PlaceholderImageProps) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      data-slot="rd-placeholder-image"
      role="img"
      aria-label={alt}
      className={cn("overflow-hidden", className)}
      style={{
        backgroundImage: `var(${tone === "dark" ? "--rd-placeholder-dark" : "--rd-placeholder-light"})`,
      }}
    />
  );
}

export { PlaceholderImage };
export type { PlaceholderImageProps };
