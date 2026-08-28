import type { NextConfig } from "next";

/**
 * Origens externas liberadas no CSP (img-src e connect-src).
 *
 * O host do Supabase vem de NEXT_PUBLIC_SUPABASE_URL: o projeto que o app consulta
 * é o que o navegador precisa alcançar (Storage público das questões, Auth no
 * login do staff). Era hardcoded no projeto pessoal (ebdazvyyunilbkygtevn) e, na
 * migração para o Supabase da Raiz (ago/2026), o header em produção ficou sem
 * host nenhum: imagens de questão bloqueadas e fetch ao Supabase recusado.
 *
 * NEXT_PUBLIC_CSP_EXTRA_ORIGINS (separadas por vírgula) cobre a transição:
 * enquanto as imagem_url gravadas no banco apontarem para o Storage antigo, o host
 * antigo continua liberado. Runbook: docs/ops/migracao-supabase-raiz.md
 */
const SUPABASE_ORIGIN = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "https://ebdazvyyunilbkygtevn.supabase.co";
  }
})();
const EXTRA_ORIGINS = (process.env.NEXT_PUBLIC_CSP_EXTRA_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const REMOTE_ORIGINS = [...new Set([SUPABASE_ORIGIN, ...EXTRA_ORIGINS])].join(" ");

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
