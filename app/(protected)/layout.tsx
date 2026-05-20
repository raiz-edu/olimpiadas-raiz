import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { UserProvider } from "@/lib/auth/context";
import { LogoutButton } from "@/components/auth/logout-button";
import { Sidebar } from "@/components/layout/sidebar";
import { YearSelector } from "@/components/layout/year-selector";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getAnoAnalise } from "@/lib/auth/ano-analise";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { user } = session;

  // Anos disponíveis para seleção (distinct anos das turmas + ano atual)
  const supabase = createAdminClient();
  const { data: anoRows } = await supabase
    .from("turma")
    .select("ano_letivo")
    .not("ano_letivo", "is", null)
    .order("ano_letivo", { ascending: false });

  const anoAtual = new Date().getFullYear();
  const anosSet = new Set<number>([anoAtual]);
  (anoRows ?? []).forEach((r) => {
    if (r.ano_letivo) anosSet.add(r.ano_letivo);
  });
  const anos = [...anosSet].sort((a, b) => b - a);
  const anoSelecionado = await getAnoAnalise();

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-14 items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 text-white"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="6" />
                  <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-foreground">Olimpíadas</span>
            </div>

            {/* Seletor de ano */}
            <YearSelector anos={anos} anoAtual={anoSelecionado} />

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground leading-tight">{user.nome}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
              <LogoutButton className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-background hover:text-foreground transition-colors" />
            </div>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex flex-1">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-56 shrink-0 border-r border-border/40 bg-background lg:block">
            <Sidebar />
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-background">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
