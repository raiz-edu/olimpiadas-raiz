import { LoginForm } from "@/components/auth/login-form";

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
    <main className="flex min-h-screen">
      {/* ── Lado esquerdo: apresentação ───────────────────────────────── */}
      <div
        className="relative hidden overflow-hidden lg:block lg:w-1/2"
        style={{ background: "#0f172a" }}
      >
        <iframe
          src="/trilha-olimpica.html"
          className="absolute inset-0 h-full w-full"
          style={{ border: "none", pointerEvents: "none" }}
          title="A Trilha Olímpica"
        />
        {/* Gradiente de integração */}
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-32"
          style={{ background: "linear-gradient(to right, transparent, #0f172a)" }}
        />
      </div>

      {/* ── Lado direito: formulário ───────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center bg-background px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoFile ? `/marcas/${logoFile}.png` : "/logo-raiz.png"}
              alt={marcaNome ?? "Raiz Educação"}
              className="mx-auto mb-4 block max-h-40 max-w-full"
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
