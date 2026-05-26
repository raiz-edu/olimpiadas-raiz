"use client";

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return u.pathname.split("/")[2] ?? null;
      if (u.pathname.startsWith("/live/")) return u.pathname.split("/")[2] ?? null;
      return u.searchParams.get("v");
    }
  } catch {
    // not a URL
  }
  return null;
}

export function AulaPlayer({
  url,
  titulo,
  isLive = false,
}: {
  url: string;
  titulo: string;
  isLive?: boolean;
}) {
  const ytId = extractYouTubeId(url);

  if (ytId) {
    const embedUrl = `https://www.youtube.com/embed/${ytId}${isLive ? "?autoplay=1" : ""}`;
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        <div className="relative pt-[56.25%]">
          <iframe
            src={embedUrl}
            title={titulo}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    );
  }

  // URL externa (Zoom, Meet, etc.)
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <p className="mb-3 text-sm text-muted-foreground">
        Esta aula acontece em uma plataforma externa.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "rgb(91,184,193)" }}
      >
        Entrar na aula
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
