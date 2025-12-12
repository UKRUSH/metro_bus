import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable automatic service worker generation
    webpackBuildWorker: false,
  },
};

export default nextConfig;
