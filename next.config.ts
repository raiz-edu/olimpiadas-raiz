import type { NextConfig } from "next";

/**
 * Origens externas liberadas no CSP (img-src e connect-src).
 *
 * - AWS (produção): as imagens são servidas por /api/storage/…, que redireciona
 *   para uma URL assinada do S3. O CSP é verificado também no destino do redirect,
 *   então o host do S3 da região precisa estar liberado — sem isso, nenhuma
 *   imagem de questão aparece.
 * - Supabase (dev/Vercel): o host do projeto vem de NEXT_PUBLIC_SUPABASE_URL;
 *   sem a env, nenhum host do Supabase entra (na AWS ela não existe).
 * - NEXT_PUBLIC_CSP_EXTRA_ORIGINS (lista separada por vírgula, avaliada no BUILD)
 *   cobre transições — ex.: o Storage do projeto antigo enquanto as URLs no
 *   banco não forem reescritas (migration 055).
 */
const AWS_REGION = process.env.AWS_REGION ?? "sa-east-1";
const S3_ORIGINS = [
  `https://*.s3.${AWS_REGION}.amazonaws.com`,
  `https://s3.${AWS_REGION}.amazonaws.com`,
];
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();
const EXTRA_ORIGINS = (process.env.NEXT_PUBLIC_CSP_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const REMOTE_ORIGINS = [
  ...new Set([...S3_ORIGINS, ...(SUPABASE_ORIGIN ? [SUPABASE_ORIGIN] : []), ...EXTRA_ORIGINS]),
].join(" ");

const nextConfig: NextConfig = {
  output: "standalone",
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
              `img-src 'self' data: blob: ${REMOTE_ORIGINS}`,
              "media-src 'self' https:",
              "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
              `connect-src 'self' ${REMOTE_ORIGINS} https://vitals.vercel-insights.com`,
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
