import { LoginForm } from "@/components/auth/login-form";
import { TrilhaOlimpica } from "@/components/trilha/trilha-olimpica";

export const metadata = {
  title: "Login — Olimpíadas do Conhecimento",
};

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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;
  const logoFile = marca ? SLUG_TO_LOGO[marca] : null;
  const marcaNome = marca ? SLUG_TO_NOME[marca] : null;

  return (
    <main className="relative flex min-h-screen">
      {/* ── Divisor vertical sutil (apenas desktop, alinhado ao split 2/3-1/3) ── */}
      <div
        className="pointer-events-none absolute z-10 hidden md:block"
        style={{
          left: "66.666%",
          top: "17.5%",
          height: "65%",
          width: "1px",
          background:
            "linear-gradient(to bottom, transparent, rgba(148,163,184,0.25) 20%, rgba(148,163,184,0.25) 80%, transparent)",
        }}
      />
      {/* ── Lado esquerdo: apresentação (somente desktop — não carrega/roda no mobile) ── */}
      <div
        className="relative hidden overflow-hidden md:block md:w-2/3"
        style={{ background: "#0b1120" }}
      >
        <div
          className="absolute inset-0 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#1e293b transparent" }}
        >
          <TrilhaOlimpica />
        </div>
      </div>

      {/* ── Lado direito: formulário ───────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-background py-12 md:w-1/3">
        <div className="w-full max-w-sm px-6">
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoFile ? `/marcas/${logoFile}.png` : "/logo-raiz.png"}
              alt={marcaNome ?? "Raiz Educação"}
              className={`mx-auto mb-4 block max-w-full ${marca === "uniao" ? "max-h-32" : "max-h-40"}`}
            />
            <h1 className="text-xl font-bold text-foreground">Olimpíadas do Conhecimento</h1>
            <p className="mt-1 text-sm text-muted-foreground">{marcaNome ?? "Raiz Educação"}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-foreground">Entrar na plataforma</h2>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Acesso somente por convite.{" "}
            <a
              href="mailto:olimpiadas@raizeducacao.com.br"
              className="text-primary hover:underline"
            >
              Fale com o administrador
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
