import type { AlunoBase, DadosEngajamento, RespostaEstudo } from "@/lib/engajamento/metricas";

export const AGORA_ENGAJAMENTO = new Date("2026-10-16T15:00:00Z");
export function alunoBase(id: string, extra: Partial<AlunoBase> = {}): AlunoBase {
  return {
    id,
    nome: `Aluno de teste ${id}`,
    marca_id: "marca-1",
    turma_id: "turma-1",
    serie: null,
    login_count: 0,
    last_login_at: null,
    ...extra,
  };
}
export function respostaBase(
  id: string,
  aluno_id: string,
  extra: Partial<RespostaEstudo> = {},
): RespostaEstudo {
  return {
    id,
    aluno_id,
    questao_id: `questao-${id}`,
    correta: true,
    contexto: "banco",
    aula_id: null,
    respondido_em: "2026-10-16T12:00:00Z",
    feedback_ia: null,
    questao: { tipo: "multipla_escolha", topico: "Geometria", assunto: null, olimpiada: "OBMEP" },
    ...extra,
  };
}
export function dadosBase(): DadosEngajamento {
  return {
    alunos: [],
    respostas: [],
    progressos: [],
    premiacoes: [],
    marcas: [
      { id: "marca-1", nome: "Matriz Educação" },
      { id: "marca-2", nome: "Apogeu" },
    ],
    unidades: [
      { id: "unidade-1", nome: "Unidade Centro", marca_id: "marca-1" },
      { id: "unidade-2", nome: "Unidade Norte", marca_id: "marca-2" },
    ],
    turmas: [
      { id: "turma-1", nome: "Turma A", serie: "9º EF", unidade_id: "unidade-1" },
      { id: "turma-2", nome: "Turma B", serie: "1º EM", unidade_id: "unidade-2" },
    ],
  };
}

/** Dados sintéticos exclusivos de testes; não são inseridos no banco. */
export function fixturePedagogico(): DadosEngajamento {
  const dados = dadosBase();
  for (let i = 0; i < 32; i++) {
    const id = String(i + 1).padStart(2, "0");
    const semAcesso = i % 8 === 3;
    dados.alunos.push(
      alunoBase(id, {
        marca_id: i < 16 ? "marca-1" : "marca-2",
        turma_id: i < 16 ? "turma-1" : "turma-2",
        login_count: semAcesso ? 0 : 3,
        last_login_at: semAcesso ? null : "2026-10-16T10:00:00Z",
      }),
    );
    if (semAcesso || i % 8 === 2) continue;
    for (let q = 0; q < 12; q++) {
      const data = new Date(AGORA_ENGAJAMENTO);
      data.setUTCDate(data.getUTCDate() - (i % 8 === 0 ? 12 + (q % 5) : q % 6));
      dados.respostas.push(
        respostaBase(`${id}-${q}`, id, {
          questao_id: `q-${q}`,
          correta: q % (i % 8 === 1 ? 4 : 3) === 0,
          respondido_em: data.toISOString(),
          contexto: q < 6 ? "banco" : q < 9 ? "aula" : "simulado",
          aula_id: q < 6 ? null : q < 9 ? "aula-1" : "simulado-1",
          questao: {
            tipo: "multipla_escolha",
            topico: q < 6 ? "Geometria" : "Álgebra",
            assunto: null,
            olimpiada: "OBMEP",
          },
        }),
      );
    }
  }
  return dados;
}
