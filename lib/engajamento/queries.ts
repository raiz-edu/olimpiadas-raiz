import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { buscarPaginasEngajamento } from "./paginacao";
import { compoeIndicadoresAluno } from "@/lib/auth/portal-profile";
import type { DadosEngajamento, RespostaEstudo } from "./metricas";

const TIPOS_PREMIADOS = new Set(["ouro", "prata", "bronze", "mencao_honrosa"]);

/** Mesmo gate e escopo da página acadêmica existente; nunca importar no cliente. */
export async function carregarDadosEngajamento(agora: Date): Promise<DadosEngajamento> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "aluno:read")) throw new Error("Não autorizado.");
  const db = createAdminClient();
  const fim = agora.toISOString();
  const [alunos, marcas, unidades, turmas] = await Promise.all([
    buscarPaginasEngajamento((inicio, final) =>
      db
        .from("aluno")
        .select(
          "id, nome, marca_id, unidade_id, tipo_usuario, turma_id, serie, serie_cadastro, login_count, last_login_at",
        )
        .eq("ativo", true)
        .or("tipo_usuario.is.null,tipo_usuario.eq.pendente,tipo_usuario.eq.aluno")
        .order("id")
        .range(inicio, final)
        .abortSignal(AbortSignal.timeout(15_000)),
    ),
    buscarPaginasEngajamento((inicio, final) =>
      db
        .from("marca")
        .select("id, nome")
        .order("id")
        .range(inicio, final)
        .abortSignal(AbortSignal.timeout(15_000)),
    ),
    buscarPaginasEngajamento((inicio, final) =>
      db
        .from("unidade")
        .select("id, nome, marca_id")
        .order("id")
        .range(inicio, final)
        .abortSignal(AbortSignal.timeout(15_000)),
    ),
    buscarPaginasEngajamento((inicio, final) =>
      db
        .from("turma")
        .select("id, nome, serie, unidade_id")
        .order("id")
        .range(inicio, final)
        .abortSignal(AbortSignal.timeout(15_000)),
    ),
  ]);
  const respostas: RespostaEstudo[] = [];
  const progressos: DadosEngajamento["progressos"] = [];
  const inscricoes: { id: string; aluno_id: string }[] = [];
  // Lotes de IDs evitam URLs excessivas; range evita truncamento de respostas.
  const confirmados = alunos.filter((a) => compoeIndicadoresAluno(a.tipo_usuario));
  for (let i = 0; i < confirmados.length; i += 100) {
    const ids = confirmados.slice(i, i + 100).map((a) => a.id);
    const [respostasLote, progressosLote, inscricoesLote] = await Promise.all([
      buscarPaginasEngajamento((inicio, final) =>
        db
          .from("resposta_aluno")
          .select(
            "id, aluno_id, questao_id, correta, contexto, aula_id, respondido_em, feedback_ia:feedback_ia->itens, questao:questao_id(tipo, topico, assunto, olimpiada, nivel, fase)",
          )
          .in("aluno_id", ids)
          .lte("respondido_em", fim)
          .order("id")
          .range(inicio, final)
          .abortSignal(AbortSignal.timeout(15_000))
          .overrideTypes<RespostaEstudo[], { merge: false }>(),
      ),
      buscarPaginasEngajamento((inicio, final) =>
        db
          .from("aluno_progresso")
          .select("aluno_id, aula_id, assistido, progresso_segundos, updated_at")
          .in("aluno_id", ids)
          .lte("updated_at", fim)
          .order("id")
          .range(inicio, final)
          .abortSignal(AbortSignal.timeout(15_000)),
      ),
      buscarPaginasEngajamento((inicio, final) =>
        db
          .from("inscricao")
          .select("id, aluno_id")
          .in("aluno_id", ids)
          .order("id")
          .range(inicio, final)
          .abortSignal(AbortSignal.timeout(15_000)),
      ),
    ]);
    respostas.push(...respostasLote);
    progressos.push(...progressosLote);
    inscricoes.push(...inscricoesLote);
  }
  const alunoDaInscricao = new Map(inscricoes.map((i) => [i.id, i.aluno_id]));
  const premios = new Map<string, number>();
  for (let i = 0; i < inscricoes.length; i += 100) {
    const ids = inscricoes.slice(i, i + 100).map((inscricao) => inscricao.id);
    const resultados = await buscarPaginasEngajamento((inicio, final) =>
      db
        .from("resultado")
        .select("inscricao_id, tipo")
        .in("inscricao_id", ids)
        .order("id")
        .range(inicio, final)
        .abortSignal(AbortSignal.timeout(15_000)),
    );
    for (const resultado of resultados) {
      const alunoId = alunoDaInscricao.get(resultado.inscricao_id);
      if (alunoId && TIPOS_PREMIADOS.has(resultado.tipo))
        premios.set(alunoId, (premios.get(alunoId) ?? 0) + 1);
    }
  }
  return {
    alunos,
    marcas,
    unidades,
    turmas,
    respostas,
    progressos,
    premiacoes: [...premios].map(([aluno_id, total]) => ({ aluno_id, total })),
  };
}
