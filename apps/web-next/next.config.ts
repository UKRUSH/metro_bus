import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Disable automatic service worker generation
    webpackBuildWorker: false,
  },
  // Turbopack configuration (Next.js 16 default bundler)
  turbopack: {
    resolveAlias: {
      // Alias unused mediapipe module to stub
      '@mediapipe/face_mesh': './lib/mediapipe-stub',
    },
  },
  // Webpack configuration (fallback bundler)
  webpack: (config) => {
    const path = require('path');
    
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@mediapipe/face_mesh'] = path.resolve(__dirname, 'lib/mediapipe-stub.ts');
    
    return config;
  },
};

export default nextConfig;
