import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    "saloka.varro.my.id",
    "*.varro.my.id"
  ],
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/_next/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, force-revalidate',
            },
          ],
        },
      ];
    }
    return [];
  }
};

export default nextConfig;
