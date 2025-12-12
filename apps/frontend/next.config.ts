import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/vocabulary/search',
        destination: '/vocabulary?openSearch=true',
      },
    ];
  },
};

export default nextConfig;