import { redirect } from "next/navigation";
import Image from "next/image";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { UserProvider } from "@/lib/auth/context";
import { LogoutButton } from "@/components/auth/logout-button";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { getNomeModulo } from "@/lib/apostilas/queries";
import { identidadeDaMarca } from "@/lib/marcas/identidade";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { user } = session;

  // Marca do usuário para a logo do header.
  //
  // A fonte é `usuario.marca_ativa_id` — é o que as telas gravam (cadastro pela
  // interface, primeiro login pelo Google) e o que a lista de Usuários exibe na
  // coluna Marca. Antes daqui só se lia `usuario_marca`, então quem era criado
  // pela tela ficava com a marca certa na lista e a logo da Raiz no header.
  // O fallback em `usuario_marca` cobre quem entrou pelo convite antigo, onde o
  // vínculo é criado por trigger do banco.
  let marcaSlug: string | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;
    if (user.marca_ativa_id) {
      const { data } = await supabase
        .from("marca")
        .select("slug")
        .eq("id", user.marca_ativa_id)
        .maybeSingle();
      marcaSlug = data?.slug ?? null;
    }
    if (!marcaSlug) {
      const { data } = await supabase
        .from("usuario_marca")
        .select("marca:marca_id(slug)")
        .eq("usuario_id", user.id)
        .limit(1)
        .maybeSingle();
      const marca = Array.isArray(data?.marca) ? data.marca[0] : data?.marca;
      marcaSlug = marca?.slug ?? null;
    }
  } catch {
    marcaSlug = null;
  }

  const identidade = identidadeDaMarca(marcaSlug);

  // Nome do módulo Apostilas (editável em configuracao_sistema) para o menu
  let apostilasLabel = "Apostilas";
  try {
    apostilasLabel = await getNomeModulo();
  } catch {
    /* default */
  }

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen flex-col">
        {/* Top navbar */}
        <header
          className="sticky top-0 z-30 border-b"
          style={{
            background: "#1e293b",
            borderColor: "#334155",
            boxShadow: "0 1px 4px rgba(0,0,0,0.30)",
          }}
        >
          <div className="flex h-[88px] items-center justify-between pl-4 pr-6 sm:pr-10">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <MobileNav apostilasLabel={apostilasLabel} />
              {identidade.temLogoPropria ? (
                /* Só a logo da marca — sem Raiz */
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={identidade.src}
                  alt={identidade.nome}
                  className={`block object-contain ${identidade.classeHeaderSistema}`}
                />
              ) : (
                /* Sem marca: exibe logo Raiz + texto */
                <>
                  <Image
                    src="/logo-raiz.png"
                    alt="Raiz Educação"
                    width={300}
                    height={248}
                    style={{ height: 80, width: "auto" }}
                    className="object-contain"
                    priority
                  />
                  <div
                    className="hidden sm:block h-10 w-px mx-1"
                    style={{ background: "#475569" }}
                  />
                  <div className="hidden sm:block">
                    <p
                      className="font-bold leading-tight"
                      style={{ fontSize: 22, color: "rgb(91, 184, 193)" }}
                    >
                      Programa Raiz Olímpica
                    </p>
                    <p className="text-xs leading-tight" style={{ color: "#94a3b8" }}>
                      Raiz Educação
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* User info + logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium leading-tight" style={{ color: "#f1f5f9" }}>
                  {user.nome}
                </p>
                <p className="text-xs" style={{ color: "#94a3b8" }}>
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
              <LogoutButton className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-400 hover:border-slate-400 hover:text-slate-200 transition-colors" />
            </div>
          </div>
        </header>

        {/* Body: sidebar + content */}
        <div className="flex flex-1">
          {/* Sidebar (desktop) */}
          <aside className="hidden w-56 shrink-0 border-r border-border/40 bg-background lg:block">
            <Sidebar apostilasLabel={apostilasLabel} />
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
