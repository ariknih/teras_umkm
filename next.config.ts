import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  compress: true,
  allowedDevOrigins: [
    "saloka.varro.my.id",
    "*.varro.my.id"
  ],
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  async headers() {
    const customHeaders = [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];

    if (process.env.NODE_ENV === 'development') {
      customHeaders.push({
        source: '/_next/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, force-revalidate',
          },
        ],
      });
    }

    return customHeaders;
  }
};

export default nextConfig;
