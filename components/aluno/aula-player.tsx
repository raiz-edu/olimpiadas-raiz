"use client";

import { getAulaEmbedUrl } from "@/lib/aluno/aula-video";

export function AulaPlayer({
  url,
  titulo,
  isLive = false,
}: {
  url: string;
  titulo: string;
  isLive?: boolean;
}) {
  const embedUrl = getAulaEmbedUrl(url, isLive);

  if (embedUrl) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <div className="relative pt-[56.25%]">
          <iframe
            src={embedUrl}
            title={titulo}
            loading="lazy"
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // Apenas links HTTP(S) podem ser abertos como alternativa ao player.
  let externalUrl: string;
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;
    externalUrl = parsed.toString();
  } catch {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        {isLive
          ? "Esta aula ao vivo acontece em uma plataforma externa."
          : "Este link de vídeo ainda não pode ser reproduzido dentro da plataforma."}
      </p>
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "rgb(91,184,193)" }}
      >
        {isLive ? "Entrar na aula" : "Abrir vídeo"}
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </div>
  );
}
