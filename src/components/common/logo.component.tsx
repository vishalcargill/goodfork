import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Simple GoodFork wordmark with a small leaf monogram that works for both
 * icon-only and text+tagline contexts.
 */
export function Logo() {
  return (
    <span className={cn("inline-flex items-center gap-3 text-slate-900")} aria-label='GoodFork'>
      <Image src='/logo.png' alt='' width={100} height={100} priority />
    </span>
  );
}
