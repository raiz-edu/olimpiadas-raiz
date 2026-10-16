import { LoginForm } from "@/components/auth/login-form";
import { TrilhaOlimpica } from "@/components/trilha/trilha-olimpica";
import { identidadeDaMarca } from "@/lib/marcas/identidade";
import Link from "next/link";

export const metadata = {
  title: "Login — Olimpíadas do Conhecimento",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string }>;
}) {
  const { marca } = await searchParams;
  const identidade = identidadeDaMarca(marca);

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
              src={identidade.src}
              alt={identidade.nome}
              className={`mx-auto mb-4 block max-w-full ${identidade.classeLogin}`}
            />
            <h1 className="text-xl font-bold text-foreground">Olimpíadas do Conhecimento</h1>
            <p className="mt-1 text-sm text-muted-foreground">{identidade.nome}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <Link
              href={`/aluno/login${marca ? `?marca=${encodeURIComponent(marca)}` : ""}`}
              className="mb-6 block rounded-xl border border-primary/30 bg-primary/8 p-4 text-sm font-semibold text-primary"
            >
              Sou aluno{" "}
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                Entrar na área de estudos →
              </span>
            </Link>
            <h2 className="text-lg font-semibold text-foreground">Professores e equipe</h2>
            <p className="mb-6 mt-2 text-xs leading-relaxed text-muted-foreground">
              Acesso à gestão pedagógica com as permissões da sua conta.
            </p>
            <LoginForm />
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Use seu e-mail institucional ou o acesso recebido por convite.{" "}
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
