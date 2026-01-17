import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /* config options here */
  // distDir: '.next_temp', // Commented out for Vercel deployment

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