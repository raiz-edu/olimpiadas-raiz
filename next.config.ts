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
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://ebdazvyyunilbkygtevn.supabase.co",
              "media-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              "connect-src 'self' https://ebdazvyyunilbkygtevn.supabase.co https://vitals.vercel-insights.com",
              "font-src 'self'",
              "frame-ancestors 'self' https://painel-pedagogico-raiz-rho.vercel.app",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
