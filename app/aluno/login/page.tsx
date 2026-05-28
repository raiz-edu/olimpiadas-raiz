import { LoginAlunoForm } from "@/components/aluno/login-form";
import { getConfigValue } from "@/app/(protected)/configuracoes/actions";

export const metadata = {
  title: "Acesso do Aluno — Plataforma Olímpica",
};

// ─── Vídeo de fundo ───────────────────────────────────────────────────────────

function resolveVideoEmbed(url: string): { type: "iframe" | "video"; src: string } | null {
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
      return {
        type: "iframe",
        src: `https://www.youtube.com/embed/${id}?autoplay=1&muted=1&loop=1&controls=0&rel=0&showinfo=0&playlist=${id}`,
      };
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      if (!id) return null;
      return {
        type: "iframe",
        src: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1`,
      };
    }
    return { type: "video", src: url };
  } catch {
    return null;
  }
}

function VideoBackground({ src }: { src: string }) {
  const embed = resolveVideoEmbed(src);
  if (!embed) return null;

  const cls = "absolute inset-0 h-full w-full object-cover";

  if (embed.type === "iframe") {
    return (
      <iframe
        src={embed.src}
        className={cls}
        style={{ border: "none", pointerEvents: "none" }}
        allow="autoplay; fullscreen"
        title="background video"
      />
    );
  }

  return (
    <video autoPlay muted loop playsInline className={cls}>
      <source src={embed.src} type="video/mp4" />
    </video>
  );
}

const SLUG_TO_LOGO: Record<string, string> = {
  americano: "americano",
  apogeu: "apogeu",
  "matriz-educacao": "matriz",
  "qi-bilingue": "qi",
  uniao: "uniao",
  unificado: "unificado",
};

const SLUG_TO_NOME: Record<string, string> = {
  americano: "Americano",
  apogeu: "Apogeu",
  "matriz-educacao": "Matriz Educação",
  "qi-bilingue": "QI Bilíngue",
  uniao: "União",
  unificado: "Unificado",
};

const TEAL = "rgb(91,184,193)";

export default async function LoginAlunoPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;
  const logoFile = marca ? SLUG_TO_LOGO[marca] : null;
  const marcaNome = marca ? SLUG_TO_NOME[marca] : null;
  const videoSrc = await getConfigValue("video_login_url");

  return (
    <main className="flex min-h-screen">
      {/* ── Lado esquerdo: vídeo ───────────────────────────────────────── */}
      <div
        className="relative hidden overflow-hidden lg:block lg:w-1/2"
        style={{ background: "#09090b" }}
      >
        {videoSrc ? (
          <VideoBackground src={videoSrc} />
        ) : (
          <iframe
            src="/trilha-olimpica.html"
            className="absolute inset-0 h-full w-full"
            style={{ border: "none", pointerEvents: "none" }}
            title="A Trilha Olímpica"
          />
        )}
      </div>

      {/* ── Lado direito: formulário ───────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Header com logo da marca */}
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoFile ? `/marcas/${logoFile}.png` : "/logo-raiz.png"}
              alt={marcaNome ?? "Raiz Educação"}
              className="mx-auto mb-4 block max-h-40 max-w-full"
            />
            <h1 className="text-xl font-bold text-foreground">Plataforma Olímpica</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {marcaNome ? `${marcaNome} — Área do Aluno` : "Raiz Educação — Área do Aluno"}
            </p>
          </div>

          {/* Card de login */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Entrar</h2>
            <LoginAlunoForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Dificuldades para acessar?{" "}
            <a
              href="mailto:olimpiadas@raizeducacao.com.br"
              className="hover:underline"
              style={{ color: TEAL }}
            >
              Fale com a coordenação
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
