import {
  janelaAnteriorEstudo,
  taxaAcerto,
  variacaoAcerto,
  type ContagemAcertos,
  type JanelaEstudo,
} from "@/lib/engajamento/metricas";

const vazio: ContagemAcertos = { corrigidas: 0, acertos: 0, pendentes: 0 };
const taxa = (dados: ContagemAcertos) => {
  const valor = taxaAcerto(dados);
  return valor === null
    ? "Sem respostas corrigidas"
    : `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% · ${dados.acertos}/${dados.corrigidas} acertos`;
};
const variacao = (valor: number | null) =>
  valor === null
    ? "Base insuficiente para comparar"
    : `${valor > 0 ? "+" : ""}${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} p.p.`;

export function ComparacaoAluno({
  atual,
  anterior = vazio,
}: {
  atual: ContagemAcertos;
  anterior?: ContagemAcertos;
}) {
  return (
    <div className="space-y-1 rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
      <p>Período anterior: {taxa(anterior)}</p>
      <p>
        Variação do acerto:{" "}
        <strong className="font-medium text-foreground">
          {variacao(variacaoAcerto(atual, anterior))}
        </strong>
      </p>
    </div>
  );
}

export function ComparacaoPeriodo({
  atual,
  anterior,
  janela,
}: {
  atual: ContagemAcertos;
  anterior: ContagemAcertos;
  janela: JanelaEstudo;
}) {
  const previa = janelaAnteriorEstudo(janela);
  const data = (iso: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(iso));
  return (
    <section
      aria-labelledby="comparacao-periodo-titulo"
      className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5"
    >
      <h2 id="comparacao-periodo-titulo" className="text-sm font-semibold">
        Comparação com período anterior
      </h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">
            Atual · {data(janela.inicio)} a {data(janela.fim)}
          </dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums">{taxa(atual)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">
            Anterior · {data(previa.inicio)} a {data(previa.fim)}
          </dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums">{taxa(anterior)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Variação em pontos percentuais</dt>
          <dd className="mt-1 text-sm font-semibold tabular-nums">
            {variacao(variacaoAcerto(atual, anterior))}
          </dd>
        </div>
      </dl>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        O período atual inclui hoje em andamento; o anterior tem {janela.dias} dias completos. A
        variação exige pelo menos 5 respostas corrigidas em cada período. Os conjuntos de questões
        podem variar; os percentuais não são uma nota oficial.
      </p>
    </section>
  );
}
