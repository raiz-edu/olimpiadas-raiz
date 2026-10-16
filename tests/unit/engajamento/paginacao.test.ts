import { describe, expect, it } from "vitest";
import { buscarPaginasEngajamento } from "@/lib/engajamento/paginacao";

describe("consultas completas de indicadores", () => {
  it("carrega mais de mil linhas, em páginas ordenadas de 500", async () => {
    const origem = Array.from({ length: 1201 }, (_, i) => ({ id: i }));
    const intervalos: number[][] = [];
    const linhas = await buscarPaginasEngajamento(async (inicio, fim) => {
      intervalos.push([inicio, fim]);
      return { data: origem.slice(inicio, fim + 1), error: null };
    });
    expect(linhas).toEqual(origem);
    expect(intervalos).toEqual([
      [0, 499],
      [500, 999],
      [1000, 1499],
    ]);
  });
  it("não retorna números parciais se uma página falhar", async () => {
    await expect(
      buscarPaginasEngajamento(
        async (inicio) =>
          inicio === 0
            ? { data: [{ id: 1 }], error: null }
            : { data: null, error: { message: "timeout" } },
        1,
      ),
    ).rejects.toThrow("todos os alunos");
  });
  it("diferencia base vazia de ausência de dados e rejeita tamanho inválido", async () => {
    await expect(
      buscarPaginasEngajamento(async () => ({ data: [], error: null })),
    ).resolves.toEqual([]);
    await expect(
      buscarPaginasEngajamento(async () => ({ data: null, error: null })),
    ).rejects.toThrow();
    await expect(
      buscarPaginasEngajamento(async () => ({ data: [], error: null }), 0),
    ).rejects.toThrow("inválido");
  });
});
