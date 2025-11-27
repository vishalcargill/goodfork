"use client";

import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function HeroIllustration() {
  return (
    <div className="relative w-full max-w-md">
      <div className="relative aspect-square overflow-hidden rounded-[40px] border border-emerald-100 bg-gradient-to-br from-white via-emerald-50 to-lime-50 p-6 shadow-[0_30px_120px_rgba(22,163,74,0.18)]">
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
