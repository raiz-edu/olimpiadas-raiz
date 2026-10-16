/** A consulta deve ordenar por chave única e usar uma janela estável de dados. */
export async function buscarPaginasEngajamento<T>(
  consultar: (
    inicio: number,
    fim: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  tamanho = 500,
): Promise<T[]> {
  if (!Number.isSafeInteger(tamanho) || tamanho < 1) throw new Error("Tamanho de página inválido.");
  const linhas: T[] = [];
  for (let inicio = 0; ; inicio += tamanho) {
    const { data, error } = await consultar(inicio, inicio + tamanho - 1);
    if (error || !data)
      throw new Error("Não foi possível carregar os indicadores de todos os alunos.");
    linhas.push(...data);
    if (data.length < tamanho) return linhas;
  }
}
