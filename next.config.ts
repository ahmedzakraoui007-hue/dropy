import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/forgot',
        destination: '/forgot-password',
        permanent: true,
      },
      {
        source: '/seller/ugc',
        destination: '/seller/content/briefs',
        permanent: true,
      },
      {
        source: '/seller/ugc/create',
        destination: '/seller/content/create-brief',
        permanent: true,
      },
      {
        source: '/seller/ugc/:id*',
        destination: '/seller/content/briefs/:id*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
