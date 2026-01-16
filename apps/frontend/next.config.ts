import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: '.next_temp', // Temporary fix for locked .next folder
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