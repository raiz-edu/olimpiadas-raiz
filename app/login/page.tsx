import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Login — Olimpíadas do Conhecimento",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-foreground">Olimpíadas do Conhecimento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Raiz Educação</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Entrar na plataforma</h2>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Acesso somente por convite.{" "}
          <a href="mailto:olimpiadas@raizeducacao.com.br" className="text-primary hover:underline">
            Fale com o administrador
          </a>
        </p>
      </div>
    </main>
  );
}
