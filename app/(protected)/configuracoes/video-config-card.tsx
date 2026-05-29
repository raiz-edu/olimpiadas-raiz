"use client";

import { useActionState } from "react";
import { salvarConfig, type ConfigState } from "./actions";

// ─── Helpers de embed ─────────────────────────────────────────────────────────

function resolveEmbed(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      const id =
        u.searchParams.get("v") ??
        (u.hostname === "youtu.be" ? u.pathname.slice(1) : null) ??
        u.pathname.split("/").pop() ??
        "";
      if (!id) return null;
      return `iframe:https://www.youtube.com/embed/${id}?autoplay=1&muted=1&loop=1&controls=0&rel=0&playlist=${id}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (!id) return null;
      return `iframe:https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1`;
    }
    return url; // URL direta (mp4 ou outro)
  } catch {
    return null;
  }
}

// ─── Preview do vídeo ─────────────────────────────────────────────────────────

function VideoPreview({ url }: { url: string }) {
  const embed = resolveEmbed(url);
  if (!embed) return null;

  if (embed.startsWith("iframe:")) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-border">
        <iframe
          src={embed.slice(7)}
          className="h-full w-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
      <video src={url} controls className="h-full w-full object-contain" />
    </div>
  );
}

// ─── Card principal ───────────────────────────────────────────────────────────

export function VideoConfigCard({ valorAtual }: { valorAtual: string }) {
  const [state, action, isPending] = useActionState<ConfigState, FormData>(salvarConfig, null);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">Vídeo da Tela de Login</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          URL do vídeo exibido no painel esquerdo da tela de login dos alunos. Suporta YouTube,
          Vimeo ou link direto de arquivo .mp4.
        </p>
      </div>

      <form action={action} className="space-y-4">
        <input type="hidden" name="chave" value="video_login_url" />

        <div>
          <label htmlFor="video-url" className="mb-1.5 block text-sm font-medium text-foreground">
            URL do vídeo
          </label>
          <input
            id="video-url"
            name="valor"
            type="url"
            defaultValue={valorAtual}
            placeholder="https://www.youtube.com/watch?v=...  ou  https://vimeo.com/...  ou  https://cdn.exemplo.com/video.mp4"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Deixe vazio para exibir somente o fundo escuro sem vídeo.
          </p>
        </div>

        {state && "error" in state && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </p>
        )}
        {state && "ok" in state && (
          <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            {state.message}
          </p>
        )}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Salvando…" : "Salvar"}
          </button>
          <a
            href="/aluno/login"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver tela de login ↗
          </a>
        </div>
      </form>

      {valorAtual && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Preview
          </p>
          <VideoPreview url={valorAtual} />
        </div>
      )}
    </div>
  );
}
