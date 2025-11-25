import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  showWordmark?: boolean;
  tagline?: string;
  size?: "sm" | "md" | "lg";
};

const iconSizeMap: Record<NonNullable<LogoProps["size"]>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/**
 * Simple GoodFork wordmark with a small leaf monogram that works for both
 * icon-only and text+tagline contexts.
 */
export function Logo({ className, showWordmark = true, tagline = "Nourish smarter", size = "md" }: LogoProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-3 text-slate-900", showWordmark && "min-w-0", className)}
      aria-label='GoodFork'
    >
      <Image src='/logo.png' alt='' width={100} height={100} priority />
    </span>
  );
}
