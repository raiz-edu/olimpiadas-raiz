import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { escopoMarcasAcessos } from "./escopo";
import type { MarcaAcesso, PessoaAcesso, UnidadeAcesso } from "./metricas";

/** Exclusivo do servidor; autorização refeita junto da leitura com service_role. */
export async function carregarDadosAcessos(desde: string | null, agora: Date) {
  const session = await getServerSession();
  if (!session) throw new Error("Sessão de gestão indisponível.");
  const escopo = escopoMarcasAcessos(session.user);
  const db = createAdminClient();
  async function paginas<T>(
    consultar: (
      inicio: number,
      fim: number,
    ) => PromiseLike<{
      data: T[] | null;
      error: { message: string } | null;
    }>,
  ) {
    const linhas: T[] = [];
    for (let inicio = 0; ; inicio += 500) {
      const { data, error } = await consultar(inicio, inicio + 499);
      if (error || !data)
        throw new Error("Não foi possível carregar os dados de acessos e participação.");
      linhas.push(...data);
      if (data.length < 500) return linhas;
    }
  }
  const [pessoas, marcas, unidades] = await Promise.all([
    paginas<PessoaAcesso>((inicio, fim) =>
      db
        .rpc("gestao_acessos", {
          p_marcas: escopo,
          p_desde: desde,
          p_ate: agora.toISOString(),
        })
        .order("pessoa_id")
        .range(inicio, fim)
        .abortSignal(AbortSignal.timeout(20_000)),
    ),
    paginas<MarcaAcesso>((inicio, fim) => {
      let query = db.from("marca").select("id, nome").order("id").range(inicio, fim);
      if (escopo) query = query.in("id", escopo);
      return query.abortSignal(AbortSignal.timeout(15_000));
    }),
    paginas<UnidadeAcesso>((inicio, fim) => {
      let query = db.from("unidade").select("id, nome, marca_id").order("id").range(inicio, fim);
      if (escopo) query = query.in("marca_id", escopo);
      return query.abortSignal(AbortSignal.timeout(15_000));
    }),
  ]);
  return { pessoas, marcas, unidades, escopo };
}
