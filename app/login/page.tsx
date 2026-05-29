import { readFileSync } from "fs";
import { join } from "path";
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
  const presentationHtml = readFileSync(
    join(process.cwd(), "public", "trilha-olimpica.html"),
    "utf-8",
  );

  return (
    <main className="flex min-h-screen">
      {/* ── Lado esquerdo: apresentação ───────────────────────────────── */}
      <div className="relative w-2/3 overflow-hidden" style={{ background: "#0f172a" }}>
        <iframe
          srcDoc={presentationHtml}
          className="absolute inset-0 h-full w-full"
          style={{ border: "none", pointerEvents: "none" }}
          title="A Trilha Olímpica"
        />
        {/* Vinheta — fades em todas as bordas */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              "linear-gradient(to right,  #0f172a 0%, transparent 15%, transparent 80%, #0f172a 100%)",
              "linear-gradient(to bottom, #0f172a 0%, transparent 12%, transparent 88%, #0f172a 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* ── Lado direito: formulário ───────────────────────────────────── */}
      <div className="flex w-1/3 flex-col items-center justify-center bg-background px-10 py-12">
        <div className="w-full max-w-sm">
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
