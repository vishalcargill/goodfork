"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-md">
        <DotLottieReact
          src="https://lottie.host/53a55d62-10d7-47d8-8524-1fb01b3adab3/qjqYOaa3Qy.lottie"
          loop
          autoplay
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
