import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserProvider } from "@/lib/auth/context";
import { LogoutButton } from "@/components/auth/logout-button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ROLE_LABELS } from "@/lib/auth/roles";

const SLUG_TO_LOGO: Record<string, string> = {
  americano: "americano",
  apogeu: "apogeu",
  "matriz-educacao": "matriz",
  "qi-bilingue": "qi",
  uniao: "uniao",
  unificado: "unificado",
};

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { user } = session;

  // Busca a marca do usuário
  let marcaSlug: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    const { data } = await supabase
      .from("usuario_marca")
      .select("marca:marca_id(slug)")
      .eq("usuario_id", user.id)
      .limit(1)
      .single();
    const marca = Array.isArray(data?.marca) ? data.marca[0] : data?.marca;
    marcaSlug = marca?.slug ?? null;
  } catch {
    marcaSlug = null;
  }

  const logoFile = marcaSlug ? SLUG_TO_LOGO[marcaSlug] : null;

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 border-b border-border bg-card">
          <div className="flex h-[88px] items-center justify-between px-4">
            {/* Logo + hamburger mobile */}
            <div className="flex items-center gap-3">
              <MobileNav />
              <Image
                src="/logo-raiz.png"
                alt="Raiz Educação"
                width={300}
                height={248}
                style={{ height: 80, width: "auto" }}
                className="object-contain"
                priority
              />
              {/* Separador vertical */}
              <div className="hidden sm:block h-10 w-px bg-border/60 mx-1" />
              {logoFile ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={`/marcas/${logoFile}.png`}
                  alt={marcaSlug ?? ""}
                  className="hidden sm:block max-h-16 max-w-[160px] object-contain"
                />
              ) : (
                <div className="hidden sm:block">
                  <p
                    className="font-bold leading-tight"
                    style={{ fontSize: 22, color: "rgb(91, 184, 193)" }}
                  >
                    Programa Raiz Olímpica
                  </p>
                  <p className="text-xs text-muted-foreground leading-tight">Raiz Educação</p>
                </div>
              )}
            </div>

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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
