import { getServerSession } from "@/lib/auth/session";
import { CATALOGO } from "@/lib/olimpiadas/catalogo";
import { listPlanilhas } from "./actions";
import { OlimpiadasCatalogo } from "@/components/academico/olimpiadas-catalogo";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Olimpíadas — Acadêmico" };

export default async function AcademicoOlimpiadasPage() {
  const session = await getServerSession();
  if (!session) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = session.user as any;
  const isAdmin = user.role === "raiz";

  const planilhasMap: Record<
    string,
    Array<{ name: string; created_at: string; fullPath: string }>
  > = {};

  const supabase = createAdminClient();

  const [, marcaResult, todasMarcasResult] = await Promise.all([
    Promise.all(
      CATALOGO.map(async (o) => {
        planilhasMap[o.sigla] = await listPlanilhas(o.sigla);
      }),
    ),
    isAdmin || !user.marca_ativa_id
      ? Promise.resolve(null)
      : supabase.from("marca").select("slug").eq("id", user.marca_ativa_id).single(),
    isAdmin
      ? supabase.from("marca").select("nome, slug").eq("ativo", true).order("nome")
      : Promise.resolve(null),
  ]);

  const marcaSlug: string | null = isAdmin
    ? null
    : ((marcaResult as { data: { slug: string } | null } | null)?.data?.slug ?? null);
  const todasMarcas: Array<{ nome: string; slug: string }> = isAdmin
    ? ((todasMarcasResult as { data: Array<{ nome: string; slug: string }> | null } | null)?.data ??
      [])
    : [];

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Olimpíadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Informações das principais olimpíadas do conhecimento
        </p>
      </div>
      <OlimpiadasCatalogo
        catalogo={CATALOGO}
        planilhasMap={planilhasMap}
        isAdmin={isAdmin}
        marcaSlug={marcaSlug}
        todasMarcas={todasMarcas}
      />
    </div>
  );
}
