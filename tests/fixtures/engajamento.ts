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
    tipo_usuario: "aluno",
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
    questao: {
      tipo: "multipla_escolha",
      topico: "Geometria",
      assunto: null,
      olimpiada: "obmep",
      nivel: "nivel_2",
      fase: 1,
    },
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
            olimpiada: q >= 6 && q < 9 ? "canguru" : "obmep",
            nivel: q < 6 ? "nivel_2" : q < 9 ? "C" : "nivel_3",
            fase: q < 9 ? 1 : 2,
          },
        }),
      );
    }
  }
  for (let i = 0; i < 8; i++)
    dados.respostas.push(
      respostaBase(`anterior-${i}`, "01", {
        questao_id: `anterior-q-${i}`,
        correta: i < 4,
        respondido_em: "2026-09-12T12:00:00Z",
      }),
    );
  return dados;
}

/** Inclui perfis de todos os tipos para verificar a separação no painel real. */
export function fixturePerfisNaoConfirmados(): DadosEngajamento {
  const dados = fixturePedagogico();
  dados.marcas.push({ id: "marca-3", nome: "Marca só com pendentes" });
  dados.unidades.push({ id: "unidade-3", nome: "Unidade Jardim", marca_id: "marca-3" });
  for (let i = 0; i < 28; i++) {
    const numero = String(i + 1).padStart(2, "0");
    dados.alunos.push(
      alunoBase(`pendente-${numero}`, {
        nome: `Perfil aguardando ${numero}`,
        tipo_usuario: i % 3 === 0 ? null : i % 3 === 1 ? "pendente" : undefined,
        turma_id: null,
        marca_id: i === 27 ? null : "marca-3",
        unidade_id: i === 27 ? null : "unidade-3",
        serie_cadastro: i === 27 ? null : "2º EM",
        last_login_at: i % 2 === 0 ? "2026-10-16T10:00:00Z" : null,
      }),
    );
  }
  for (const tipo of ["professor", "colaborador"] as const) {
    dados.alunos.push(alunoBase(tipo, { nome: `Profissional ${tipo}`, tipo_usuario: tipo }));
    dados.respostas.push(respostaBase(`resposta-${tipo}`, tipo));
  }
  dados.respostas.push(respostaBase("resposta-pendente", "pendente-01"));
  return dados;
}

export function fixtureRankingOlimpico(): DadosEngajamento {
  const dados = dadosBase();
  dados.marcas.push({ id: "marca-vazia", nome: "Marca sem alunos confirmados" });
  dados.unidades.push({
    id: "ranking-unidade-2",
    nome: "Unidade Olímpica Sul",
    marca_id: "marca-1",
  });
  for (let i = 0; i < 36; i++) {
    const id = `olimpico-${String(i + 1).padStart(2, "0")}`;
    const acertos = i >= 30 ? (i >= 32 ? 5 : 0) : 10 - Math.floor(i / 3);
    dados.alunos.push(
      alunoBase(id, {
        nome: `Aluno olímpico ${String(i + 1).padStart(2, "0")}`,
        marca_id: i < 32 ? "marca-1" : "marca-2",
        turma_id: null,
        unidade_id:
          i < 10 || (i >= 21 && i < 32) ? "unidade-1" : i < 32 ? "ranking-unidade-2" : "unidade-2",
        serie_cadastro: "9º EF",
      }),
    );
    for (let q = 0; q < 12; q++)
      dados.respostas.push(
        respostaBase(`${id}-${q}`, id, {
          questao_id: `ranking-q-${q}`,
          correta: q < acertos,
        }),
      );
    dados.respostas.push(
      respostaBase(`${id}-repetida`, id, {
        questao_id: "ranking-q-0",
        correta: acertos > 0,
        contexto: "aula",
        aula_id: "ranking-aula",
      }),
    );
    dados.respostas.push(
      respostaBase(`${id}-outra`, id, {
        questao: {
          tipo: "multipla_escolha",
          topico: "Álgebra",
          assunto: null,
          olimpiada: "canguru",
          nivel: "C",
          fase: 1,
        },
      }),
    );
  }
  for (const tipo of [null, "pendente", "professor", "colaborador"] as const) {
    const id = `fora-${tipo ?? "legado"}`;
    dados.alunos.push(
      alunoBase(id, { nome: `Perfil excluído ${tipo ?? "legado"}`, tipo_usuario: tipo }),
    );
    dados.respostas.push(respostaBase(`${id}-resposta`, id));
  }
  return dados;
}
