import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typedRoutes: true — desabilitado: não suporta query params em hrefs dinâmicos
  images: {
    remotePatterns: [],
  },
  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://ebdazvyyunilbkygtevn.supabase.co",
              "media-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              "connect-src 'self' https://ebdazvyyunilbkygtevn.supabase.co https://vitals.vercel-insights.com https://cdn.jsdelivr.net",
              "font-src 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
