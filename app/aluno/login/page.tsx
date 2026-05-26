import { LoginAlunoForm } from "@/components/aluno/login-form";

export const metadata = {
  title: "Acesso do Aluno — Plataforma Olímpica",
};

export default function LoginAlunoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "rgb(91,184,193)" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Plataforma Olímpica</h1>
          <p className="mt-1 text-sm text-muted-foreground">Raiz Educação — Área do Aluno</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Entrar</h2>
          <LoginAlunoForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dificuldades para acessar?{" "}
          <a
            href="mailto:olimpiadas@raizeducacao.com.br"
            className="hover:underline"
            style={{ color: "rgb(91,184,193)" }}
          >
            Fale com a coordenação
          </a>
        </p>
      </div>
    </main>
  );
}
