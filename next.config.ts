// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.b-cdn.net',  // Bunny.net CDN
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google avatars
      },
    ],
  },

  // Sécurité headers
  async headers() {
    return [
      {
        source: '/learn/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "media-src 'self' blob: https://*.b-cdn.net",
              "img-src 'self' data: https://res.cloudinary.com",
              "connect-src 'self' https://*.b-cdn.net",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Rewrites pour domaines personnalisés (géré via middleware)
  async rewrites() {
    return []
  },
}

export default nextConfig