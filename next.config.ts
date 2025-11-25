import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Tree-shake large “barrel” packages like icon libs
    // so only the icons you use are bundled.
    optimizePackageImports: ["@phosphor-icons/react"],
  },
  // If you later serve remote images, add Images config here.
  // images: { remotePatterns: [{ protocol: "https", hostname: "..." }] },
};

export default nextConfig;
