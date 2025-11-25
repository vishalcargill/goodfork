"use client";

import type { MouseEvent, ReactNode } from "react";

type SmoothScrollLinkProps = {
  targetId: string;
  children: ReactNode;
  className?: string;
  offset?: number;
};

const DEFAULT_OFFSET = 110;

export function SmoothScrollLink({
  targetId,
  children,
  className,
  offset = DEFAULT_OFFSET,
}: SmoothScrollLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    const elementTop = element.getBoundingClientRect().top + window.scrollY;
    const finalPosition = Math.max(elementTop - offset, 0);

    window.scrollTo({ top: finalPosition, behavior: "smooth" });
    window.history.replaceState(null, "", `#${targetId}`);
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
