import { describe, expect, it } from "vitest";
import {
  filtrarPessoasAcesso,
  inicioPeriodoAcesso,
  lerFiltrosAcesso,
  resumirPessoasAcesso,
  type PessoaAcesso,
} from "@/lib/acessos/metricas";
import { escopoMarcasAcessos } from "@/lib/acessos/escopo";

const agora = new Date("2026-10-19T15:00:00Z");
const pessoa = (valores: Partial<PessoaAcesso> = {}): PessoaAcesso => ({
  pessoa_id: "1",
  tipo_usuario: "aluno",
  marca_id: "m",
  unidade_id: "u",
  serie: "6º",
  criado_em: "2026-09-01T10:00:00Z",
  ultimo_acesso: "2026-10-18T10:00:00Z",
  sessoes: 1,
  acessou_periodo: true,
  estudou_periodo: true,
  medicao_desde: null,
  ...valores,
});
const resumir = (pessoas: PessoaAcesso[]) =>
  resumirPessoasAcesso(
    pessoas,
    inicioPeriodoAcesso("7", agora),
    agora,
    [{ id: "m", nome: "Marca" }],
    [{ id: "u", nome: "Unidade", marca_id: "m" }],
  );

describe("indicadores de adoção", () => {
  it("separa cadastros, pessoas, sessões e estudo, incluindo quem nunca acessou", () => {
    const resumo = resumir([
      pessoa(),
      pessoa({
        pessoa_id: "2",
        sessoes: 0,
        ultimo_acesso: null,
        acessou_periodo: false,
        estudou_periodo: false,
      }),
    ]);
    expect(resumo).toMatchObject({
      cadastros: 2,
      pessoas: 1,
      sessoes: 1,
      estudantes: 1,
      novosCadastros: 0,
      alunos: { cadastros: 2, pessoas: 1, estudantes: 1 },
    });
    expect(resumo.grupos[0]).toMatchObject({
      cadastros: 2,
      pessoas: 1,
      alunos: 2,
      alunosComAcesso: 1,
      estudantes: 1,
    });
  });
  it("novos cadastros incluem importados sem transformá-los em novos acessos", () => {
    const resumo = resumir([
      pessoa({
        criado_em: "2026-10-18",
        ultimo_acesso: null,
        acessou_periodo: false,
        estudou_periodo: false,
        sessoes: 0,
      }),
    ]);
    expect(resumo.novosCadastros).toBe(1);
    expect(resumo.pessoas).toBe(0);
  });
  it("ativos 7/30 dias têm janelas fixas e descartam datas futuras/inválidas", () => {
    const resumo = resumir([
      pessoa(),
      pessoa({ ultimo_acesso: "2026-10-01" }),
      pessoa({ ultimo_acesso: "2026-09-01" }),
      pessoa({ ultimo_acesso: "2026-10-20" }),
      pessoa({ ultimo_acesso: "inválida" }),
    ]);
    expect(resumo.ativos7d).toBe(1);
    expect(resumo.ativos30d).toBe(2);
  });
  it("mantém perfis profissionais e pendentes fora dos denominadores de alunos", () => {
    const resumo = resumir([
      pessoa(),
      pessoa({ tipo_usuario: "professor", serie: null }),
      pessoa({ tipo_usuario: "pendente", serie: null }),
    ]);
    expect(resumo.cadastros).toBe(3);
    expect(resumo.alunos.cadastros).toBe(1);
    expect(resumo.alunos.estudantes).toBe(1);
    expect(resumo.porPerfil.find((p) => p.perfil === "professor")?.pessoas).toBe(1);
  });
  it("inclui Fundamental, Médio e ausência de série/unidade", () => {
    const resumo = resumir([
      pessoa(),
      pessoa({ pessoa_id: "2", serie: "3º EM" }),
      pessoa({ pessoa_id: "3", serie: null, unidade_id: null, marca_id: null }),
    ]);
    expect(resumo.porSerie.map((s) => s.serie)).toContain("6º");
    expect(resumo.porSerie.map((s) => s.serie)).toContain("3º EM");
    expect(resumo.porSerie.map((s) => s.serie)).toContain("Sem série informada");
    expect(resumo.grupos.find((g) => !g.unidadeId)?.unidade).toBe("Sem unidade informada");
  });
  it("filtros combinados mantêm só o recorte solicitado", () => {
    const filtros = lerFiltrosAcesso({ marca: "m", unidade: "u", perfil: "aluno", serie: "6º" });
    const lista = filtrarPessoasAcesso(
      [pessoa(), pessoa({ serie: "3º EM" }), pessoa({ marca_id: "outra" })],
      filtros,
    );
    expect(lista).toHaveLength(1);
    expect(
      filtrarPessoasAcesso([pessoa({ unidade_id: null })], { ...filtros, unidade: "sem-unidade" }),
    ).toHaveLength(1);
  });
  it("normaliza parâmetros inválidos e séries incompatíveis com perfil profissional", () => {
    expect(
      lerFiltrosAcesso({ perfil: "admin", periodo: "-10", marca: ["m", "outra"] }),
    ).toMatchObject({ perfil: "", periodo: "30", marca: "" });
    expect(lerFiltrosAcesso({ perfil: "professor", serie: "6º" }).serie).toBe("");
    expect(inicioPeriodoAcesso("todos", agora)).toBeNull();
    expect(inicioPeriodoAcesso("7", agora)).toBe("2026-10-12T15:00:00.000Z");
  });
  it("distingue conjunto vazio de falha e não inventa início de medição", () => {
    expect(resumir([])).toMatchObject({
      cadastros: 0,
      pessoas: 0,
      sessoes: 0,
      medicao: null,
      grupos: [],
    });
    expect(resumir([pessoa({ medicao_desde: "2026-10-20" })]).medicao).toBeNull();
  });
});

describe("escopo de gestão obtido do servidor", () => {
  it("raiz consulta a rede e diretor consulta somente sua marca", () => {
    expect(escopoMarcasAcessos({ role: "raiz", marca_ativa_id: "m" })).toBeNull();
    expect(escopoMarcasAcessos({ role: "diretor_marca", marca_ativa_id: "m" })).toEqual(["m"]);
  });
  it("diretor sem vínculo e perfis sem gestão não recebem escopo", () => {
    expect(() => escopoMarcasAcessos({ role: "diretor_marca", marca_ativa_id: null })).toThrow(
      "marca vinculada",
    );
    expect(() => escopoMarcasAcessos({ role: "professor", marca_ativa_id: "m" })).toThrow(
      "não autorizado",
    );
  });
});
