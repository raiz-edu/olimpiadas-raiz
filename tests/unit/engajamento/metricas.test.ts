import { describe, expect, it } from "vitest";
import {
  agruparEngajamento,
  criarJanelaEstudo,
  filtrarCoorte,
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
  montarPerfisNaoConfirmados,
  resumirEngajamento,
  selecionarAlunos,
  taxaAcerto,
  topicosParaRevisar,
} from "@/lib/engajamento/metricas";
import {
  AGORA_ENGAJAMENTO,
  alunoBase,
  dadosBase,
  respostaBase,
} from "@/tests/fixtures/engajamento";

const janela = criarJanelaEstudo(30, AGORA_ENGAJAMENTO);

describe("identificação escolar no acompanhamento", () => {
  it("somente alunos confirmados compõem os indicadores", () => {
    const dados = dadosBase();
    dados.alunos = [
      alunoBase("aluno", { tipo_usuario: "aluno" }),
      alunoBase("legado", { tipo_usuario: null }),
      alunoBase("prof", { tipo_usuario: "professor" }),
      alunoBase("colab", { tipo_usuario: "colaborador" }),
      alunoBase("pendente", { tipo_usuario: "pendente" }),
    ];
    dados.respostas = [
      respostaBase("certa", "aluno"),
      respostaBase("legado-erro", "legado", { correta: false }),
      respostaBase("pendente-erro", "pendente", { correta: false }),
      respostaBase("prof-erro", "prof", { correta: false }),
    ];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(alunos.map((a) => a.id)).toEqual(["aluno"]);
    expect(resumirEngajamento(alunos, janela)).toMatchObject({
      total: 1,
      ativos: 1,
      tentativas: 1,
      desempenho: { corrigidas: 1, acertos: 1, pendentes: 0 },
    });
  });
  it("identifica unidade do aluno novo sem turma pelo cadastro oficial", () => {
    const dados = dadosBase();
    const unidade = dados.unidades[0]!;
    dados.alunos = [
      alunoBase("novo", {
        turma_id: null,
        unidade_id: unidade.id,
        tipo_usuario: "aluno",
        serie: null,
        serie_cadastro: "6º",
      }),
    ];
    const aluno = montarAlunosEngajamento(dados, janela)[0];
    expect(aluno?.unidadeId).toBe(unidade.id);
    expect(aluno?.unidade).toBe(unidade.nome);
    expect(aluno?.serie).toBe("6º");
  });
  it("apresenta legados e pendentes sem lhes atribuir desempenho de aluno", () => {
    const dados = dadosBase();
    dados.alunos = [
      alunoBase("legado", {
        tipo_usuario: null,
        nome: "Beatriz",
        last_login_at: "2026-10-15T12:00:00Z",
      }),
      alunoBase("novo", {
        tipo_usuario: "pendente",
        nome: "Álvaro",
        turma_id: null,
        marca_id: null,
      }),
      alunoBase("prof", { tipo_usuario: "professor" }),
      alunoBase("colab", { tipo_usuario: "colaborador" }),
      alunoBase("aluno"),
    ];
    const pendentes = montarPerfisNaoConfirmados(dados);
    expect(pendentes.map((p) => p.id)).toEqual(["novo", "legado"]);
    expect(pendentes[0]).toMatchObject({ marcaId: null, unidadeId: null, serie: null });
    expect(pendentes[1]).toMatchObject({
      marca: "Matriz Educação",
      unidade: "Unidade Centro",
      last_login_at: "2026-10-15T12:00:00Z",
    });
    expect(pendentes[1]).not.toHaveProperty("desempenho");
    expect(pendentes[1]).not.toHaveProperty("situacao");
    expect(
      filtrarCoorte(
        pendentes,
        lerFiltrosEngajamento({ busca: "alvaro", marca: "sem-vinculo" }),
      ).map((p) => p.id),
    ).toEqual(["novo"]);
  });
  it("reclassifica na leitura seguinte sem perder identidade ou histórico", () => {
    const dados = dadosBase();
    const pessoa = alunoBase("mesma-identidade", { tipo_usuario: null });
    dados.alunos = [pessoa];
    dados.respostas = [respostaBase("historico", pessoa.id)];
    expect(montarAlunosEngajamento(dados, janela)).toHaveLength(0);
    expect(montarPerfisNaoConfirmados(dados)).toHaveLength(1);
    pessoa.tipo_usuario = "aluno";
    expect(montarPerfisNaoConfirmados(dados)).toHaveLength(0);
    expect(montarAlunosEngajamento(dados, janela)[0]).toMatchObject({
      id: pessoa.id,
      tentativas: 1,
    });
    pessoa.tipo_usuario = "professor";
    expect(montarPerfisNaoConfirmados(dados)).toHaveLength(0);
    expect(montarAlunosEngajamento(dados, janela)).toHaveLength(0);
    expect(dados.respostas).toHaveLength(1);
  });
});

describe("calendário de estudo", () => {
  it("inclui hoje em São Paulo, sem incluir o dia UTC seguinte", () => {
    const recorte = criarJanelaEstudo(7, new Date("2026-10-16T02:30:00Z"));
    expect(recorte.hoje).toBe("2026-10-15");
    expect(recorte.inicio).toBe("2026-10-09T00:00:00-03:00");
    expect(recorte.calendario).toHaveLength(7);
    expect(recorte.calendario.at(-1)).toBe("2026-10-15");
    expect(criarJanelaEstudo(90, AGORA_ENGAJAMENTO).calendario).toHaveLength(90);
  });

  it("conta dias locais distintos, não respostas nem datas UTC", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1")];
    dados.respostas = [
      respostaBase("1", "1", { respondido_em: "2026-10-16T02:58:00Z" }),
      respostaBase("2", "1", { respondido_em: "2026-10-16T02:59:00Z" }),
      respostaBase("3", "1", { respondido_em: "2026-10-16T03:00:00Z" }),
    ];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(alunos[0]!.diasPratica).toEqual(["2026-10-15", "2026-10-16"]);
    const diario = resumirEngajamento(alunos, janela).diario;
    expect(diario.at(-2)!.alunos).toBe(1);
    expect(diario.at(-1)!.alunos).toBe(1);
  });

  it("usa o mesmo período para atividade e desempenho, preservando a última evidência antiga", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1"), alunoBase("2")];
    dados.respostas = [
      respostaBase("antes", "1", { respondido_em: "2026-09-17T02:59:59Z" }),
      respostaBase("inicio", "1", { respondido_em: "2026-09-17T03:00:00Z" }),
      respostaBase("antiga", "2", { respondido_em: "2026-01-01T12:00:00Z" }),
    ];
    const [primeiro, antigo] = montarAlunosEngajamento(dados, janela);
    expect(primeiro!.tentativas).toBe(1);
    expect(primeiro!.desempenho.corrigidas).toBe(1);
    expect(antigo!.tentativas).toBe(0);
    expect(antigo!.ultimaAtividade).toBe("2026-01-01T12:00:00Z");
    expect(antigo!.situacao).toBe("retomar");
  });

  it("ignora evidências futuras, inválidas e de alunos fora da coorte", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1", { last_login_at: "inválida" })];
    dados.respostas = [
      respostaBase("1", "1", { respondido_em: "2099-01-01" }),
      respostaBase("2", "1", { respondido_em: "inválida" }),
      respostaBase("3", "outro"),
    ];
    expect(montarAlunosEngajamento(dados, janela)[0]).toMatchObject({
      tentativas: 0,
      ultimaAtividade: null,
      situacao: "nunca_acessou",
    });
  });
});

describe("participação e retomada", () => {
  it("inclui alunos sem acesso e distingue login de estudo, mesmo com login ausente", () => {
    const dados = dadosBase();
    dados.alunos = [
      alunoBase("nunca"),
      alunoBase("login", { login_count: 10 }),
      alunoBase("estudo"),
    ];
    dados.respostas = [respostaBase("r", "estudo")];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(alunos.map((a) => a.situacao)).toEqual(["nunca_acessou", "sem_estudo", "em_estudo"]);
    expect(resumirEngajamento(alunos, janela)).toMatchObject({
      total: 3,
      ativos: 1,
      semEstudo: 1,
      semAcesso: 1,
    });
  });

  it("reconhece estudo em aula sem inventar dias de prática ou usar progresso zero", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1"), alunoBase("2"), alunoBase("3")];
    dados.progressos = [
      {
        aluno_id: "1",
        aula_id: "a",
        assistido: false,
        progresso_segundos: 0,
        updated_at: janela.fim,
      },
      {
        aluno_id: "2",
        aula_id: "a",
        assistido: false,
        progresso_segundos: 90,
        updated_at: janela.fim,
      },
      {
        aluno_id: "3",
        aula_id: "b",
        assistido: true,
        progresso_segundos: 0,
        updated_at: janela.fim,
      },
    ];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(alunos.map((a) => a.estudouPeriodo)).toEqual([false, true, true]);
    expect(alunos.map((a) => a.diasPratica.length)).toEqual([0, 0, 0]);
    expect(resumirEngajamento(alunos, janela).aulasAssistidas).toBe(1);
  });

  it("mantém a janela de retomada de 7 dias ao selecionar 30 ou 90 dias", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("limite"), alunoBase("fora")];
    dados.respostas = [
      respostaBase("1", "limite", { respondido_em: "2026-10-10T03:00:00Z" }),
      respostaBase("2", "fora", { respondido_em: "2026-10-10T02:59:00Z" }),
    ];
    for (const periodo of [30, 90] as const)
      expect(
        montarAlunosEngajamento(dados, criarJanelaEstudo(periodo, AGORA_ENGAJAMENTO)).map(
          (a) => a.situacao,
        ),
      ).toEqual(["em_estudo", "retomar"]);
  });
});

describe("desempenho com evidência", () => {
  it("mantém todas as tentativas no volume e usa a última por questão/contexto/aula nos acertos", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1")];
    dados.respostas = [
      respostaBase("recente", "1", { questao_id: "q", correta: true, contexto: "banco" }),
      respostaBase("antiga", "1", {
        questao_id: "q",
        correta: false,
        contexto: null,
        respondido_em: "2026-10-15T12:00:00Z",
      }),
      respostaBase("aula", "1", {
        questao_id: "q",
        correta: false,
        contexto: "aula",
        aula_id: "a",
      }),
      respostaBase("simulado", "1", {
        questao_id: "q",
        correta: true,
        contexto: "simulado",
        aula_id: "s",
      }),
    ];
    const aluno = montarAlunosEngajamento(dados, janela)[0]!;
    expect(aluno).toMatchObject({
      tentativas: 4,
      questoesUnicas: 1,
      desempenho: { corrigidas: 3, acertos: 2 },
    });
    expect(aluno.porContexto.banco).toMatchObject({ corrigidas: 1, acertos: 1 });
    expect(aluno.porContexto.aula).toMatchObject({ corrigidas: 1, acertos: 0 });
    expect(aluno.porContexto.simulado).toMatchObject({ corrigidas: 1, acertos: 1 });
    expect(
      montarAlunosEngajamento({ ...dados, respostas: [...dados.respostas].reverse() }, janela)[0]!
        .desempenho,
    ).toEqual(aluno.desempenho);
  });

  it("não transforma respostas abertas sem avaliação em erros", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1")];
    dados.respostas = [
      respostaBase("aberta", "1", {
        correta: false,
        questao: { tipo: "aberta", topico: "Geometria", assunto: null, olimpiada: "OBMEP" },
      }),
    ];
    let aluno = montarAlunosEngajamento(dados, janela)[0]!;
    expect(aluno.desempenho).toEqual({ corrigidas: 0, acertos: 0, pendentes: 1 });
    expect(aluno.estudouPeriodo).toBe(true);
    expect(taxaAcerto(aluno.desempenho)).toBeNull();
    dados.respostas[0]!.feedback_ia = [{ status: "incorreto" }];
    aluno = montarAlunosEngajamento(dados, janela)[0]!;
    expect(taxaAcerto(aluno.desempenho)).toBe(0);
    expect(aluno.desempenho.pendentes).toBe(0);
  });

  it("usa média ponderada e exige cinco respostas antes de sinalizar apoio", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1"), alunoBase("2"), alunoBase("3")];
    dados.respostas = [
      respostaBase("1", "1"),
      ...Array.from({ length: 9 }, (_, i) => respostaBase(`b${i}`, "2", { correta: false })),
      respostaBase("erro-isolado", "3", { correta: false }),
    ];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(taxaAcerto(resumirEngajamento(alunos.slice(0, 2), janela).desempenho)).toBe(10);
    expect(alunos.map((a) => a.precisaApoio)).toEqual([false, true, false]);
    expect(topicosParaRevisar(alunos)[0]).toMatchObject({
      nome: "Geometria",
      corrigidas: 11,
      acertos: 1,
      alunos: 3,
    });
  });

  it("não sugere revisão de tópico com amostra insuficiente", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1")];
    dados.respostas = Array.from({ length: 4 }, (_, i) =>
      respostaBase(String(i), "1", { correta: false }),
    );
    expect(topicosParaRevisar(montarAlunosEngajamento(dados, janela))).toEqual([]);
  });
});

describe("recortes da equipe pedagógica", () => {
  it("recupera marca e série da turma e busca nomes sem depender de acentos", () => {
    const dados = dadosBase();
    dados.alunos = [
      alunoBase("1", { nome: "João de Teste", marca_id: null }),
      alunoBase("2", { turma_id: null, marca_id: null }),
    ];
    const alunos = montarAlunosEngajamento(dados, janela);
    expect(alunos[0]).toMatchObject({ marcaId: "marca-1", unidadeId: "unidade-1", serie: "9º EF" });
    expect(
      filtrarCoorte(
        alunos,
        lerFiltrosEngajamento({
          marca: "marca-1",
          unidade: "unidade-1",
          serie: "9º EF",
          busca: "joao",
        }),
      ).map((a) => a.id),
    ).toEqual(["1"]);
    expect(
      filtrarCoorte(alunos, lerFiltrosEngajamento({ unidade: "sem-vinculo" })).map((a) => a.id),
    ).toEqual(["2"]);
  });

  it("refina a lista sem alterar os denominadores do recorte ou perder alunos sem estudo", () => {
    const dados = dadosBase();
    dados.alunos = [alunoBase("1"), alunoBase("2", { login_count: 3 })];
    const alunos = montarAlunosEngajamento(dados, janela);
    const filtros = lerFiltrosEngajamento({ situacao: "sem_estudo" });
    const coorte = filtrarCoorte(alunos, filtros);
    expect(selecionarAlunos(coorte, filtros).map((a) => a.id)).toEqual(["2"]);
    expect(agruparEngajamento(coorte, "marca", janela)[0]!.resumo.total).toBe(2);
    expect(resumirEngajamento(coorte, janela).total).toBe(2);
  });

  it("normaliza períodos, paginação e situações vindas da URL", () => {
    expect(
      lerFiltrosEngajamento({
        periodo: "999",
        pagina: "-1",
        pagina_perfis: "1e309",
        situacao: "__proto__",
        ordenar: ["nome"],
      }),
    ).toMatchObject({
      periodo: 30,
      pagina: 1,
      pagina_perfis: null,
      situacao: "",
      ordenar: "atencao",
    });
    expect(lerFiltrosEngajamento({ periodo: "7", pagina: "2", situacao: "apoio" })).toMatchObject({
      periodo: 7,
      pagina: 2,
      situacao: "apoio",
    });
    expect(lerFiltrosEngajamento({ pagina_perfis: "2" }).pagina_perfis).toBe(2);
    expect(lerFiltrosEngajamento({ pagina_perfis: "1" }).pagina_perfis).toBe(1);
    expect(lerFiltrosEngajamento({}).pagina_perfis).toBeNull();
  });
});
