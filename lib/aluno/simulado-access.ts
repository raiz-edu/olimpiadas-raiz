export type ProjetoAccessRow = {
  id: string;
  nome?: string | null;
  olimpiada_sigla?: string | null;
  olimpiada_id?: string | null;
  publicado?: boolean | null;
  ativo?: boolean | null;
};

export type SimuladoAccessRow = {
  projeto_id?: string | null;
  projeto_ids?: string[] | null;
  turma_ids?: string[] | null;
  series_elegiveis?: string[] | null;
};

export type AlunoSimuladoAccessContext = {
  turmaId: string | null;
  alunoSerie: string | null;
  turmaSerie: string | null;
  olimpiadaIdsConfirmadas: Set<string>;
};

export function isProjetoVisivelParaAluno(
  projeto: ProjetoAccessRow | null | undefined,
  olimpiadaIdsConfirmadas: Set<string>,
): boolean {
  if (!projeto || projeto.publicado !== true || projeto.ativo !== true) return false;
  if (!projeto.olimpiada_id) return true;
  return olimpiadaIdsConfirmadas.has(projeto.olimpiada_id);
}

export function getSimuladoProjetoIds(simulado: SimuladoAccessRow): string[] {
  return [
    simulado.projeto_id,
    ...(Array.isArray(simulado.projeto_ids) ? simulado.projeto_ids : []),
  ].filter((id): id is string => typeof id === "string" && id.trim().length > 0);
}

export function isSimuladoDisponivelParaAluno(
  simulado: SimuladoAccessRow,
  contexto: AlunoSimuladoAccessContext,
  projetosPorId: Map<string, ProjetoAccessRow>,
): boolean {
  if (
    contexto.turmaId &&
    Array.isArray(simulado.turma_ids) &&
    simulado.turma_ids.includes(contexto.turmaId)
  ) {
    return true;
  }

  const seriesAluno = [contexto.turmaSerie, contexto.alunoSerie].filter(
    (serie): serie is string => typeof serie === "string" && serie.trim().length > 0,
  );
  if (
    seriesAluno.length > 0 &&
    Array.isArray(simulado.series_elegiveis) &&
    simulado.series_elegiveis.some((serie) => seriesAluno.includes(serie))
  ) {
    return true;
  }

  return getSimuladoProjetoIds(simulado).some((projetoId) =>
    isProjetoVisivelParaAluno(projetosPorId.get(projetoId), contexto.olimpiadaIdsConfirmadas),
  );
}

export function escolherProjetoVisivelDoSimulado(
  simulado: SimuladoAccessRow,
  contexto: AlunoSimuladoAccessContext,
  projetosPorId: Map<string, ProjetoAccessRow>,
): ProjetoAccessRow | null {
  for (const projetoId of getSimuladoProjetoIds(simulado)) {
    const projeto = projetosPorId.get(projetoId);
    if (isProjetoVisivelParaAluno(projeto, contexto.olimpiadaIdsConfirmadas)) {
      return projeto ?? null;
    }
  }
  return null;
}
