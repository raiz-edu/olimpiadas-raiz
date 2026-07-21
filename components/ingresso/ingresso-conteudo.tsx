import {
  INSTITUICOES,
  PL_3943,
  VERIFICADO_EM,
  type CategoriaIngresso,
  type InstituicaoIngresso,
} from "@/lib/ingresso/regras-ingresso";

/**
 * Conteúdo de "Ingresso via Olimpíadas" — fonte ÚNICA de dados, renderizada tanto no
 * acadêmico (staff) quanto na Plataforma Olímpica (aluno). `linksClicaveis` diferencia:
 * staff = links externos clicáveis; aluno = fonte como TEXTO (sem sair da plataforma),
 * conforme a diretriz de não expor links externos em conteúdo de aluno.
 */

const SECOES: { categoria: CategoriaIngresso; titulo: string; descricao: string }[] = [
  {
    categoria: "publica",
    titulo: "Públicas — ingresso direto",
    descricao:
      "Vagas reservadas ou adicionais para medalhistas, sem vestibular ou com processo próprio.",
  },
  {
    categoria: "privada",
    titulo: "Privadas — ingresso e bolsas",
    descricao: "Vias de admissão diferenciadas e bolsas de mérito para medalhistas.",
  },
  {
    categoria: "internacional",
    titulo: "Exterior",
    descricao:
      "Como o resultado olímpico pesa em cada sistema — do processo holístico dos EUA às regras explícitas de Singapura e Canadá.",
  },
  {
    categoria: "apoio",
    titulo: "Apoio pós-ingresso",
    descricao: "Programas que apoiam medalhistas já aprovados.",
  },
];

const CATEGORIA_BADGE: Record<CategoriaIngresso, string> = {
  publica: "bg-emerald-500/10 text-emerald-500",
  privada: "bg-violet-500/10 text-violet-400",
  internacional: "bg-sky-500/10 text-sky-400",
  apoio: "bg-amber-500/10 text-amber-500",
};

function CardInstituicao({
  inst,
  linksClicaveis,
}: {
  inst: InstituicaoIngresso;
  linksClicaveis: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-card p-5">
      <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <h3 className="text-lg font-bold text-foreground">{inst.sigla}</h3>
        <span className="text-xs text-muted-foreground">{inst.local}</span>
        {inst.destaque && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CATEGORIA_BADGE[inst.categoria]}`}
          >
            {inst.destaque}
          </span>
        )}
      </div>
      {inst.nome !== inst.sigla && <p className="text-xs text-muted-foreground">{inst.nome}</p>}
      <p className="mt-2 text-sm font-medium text-foreground">{inst.programa}</p>
      <p className="mt-1.5 text-sm text-muted-foreground">{inst.beneficio}</p>

      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        Olimpíadas
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{inst.olimpiadas}</p>

      {inst.regras.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Regras
          </p>
          <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-sm text-muted-foreground">
            {inst.regras.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </>
      )}

      {inst.inscricao && (
        <p className="mt-3 text-sm">
          <span className="font-medium text-foreground">Inscrição:</span>{" "}
          <span className="text-muted-foreground">{inst.inscricao}</span>
        </p>
      )}

      {inst.pendencia && (
        <p className="mt-2 rounded-lg bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-600 dark:text-amber-400">
          ⚠ {inst.pendencia}
        </p>
      )}

      {inst.links.length > 0 &&
        (linksClicaveis ? (
          <div className="mt-auto flex flex-wrap gap-3 pt-3">
            {inst.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {l.label} ↗
              </a>
            ))}
          </div>
        ) : (
          <p className="mt-auto pt-3 text-xs text-muted-foreground">
            Onde confirmar (site oficial): {inst.links.map((l) => l.label).join(" · ")}
          </p>
        ))}
    </div>
  );
}

export function IngressoConteudo({ linksClicaveis }: { linksClicaveis: boolean }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ingresso via Olimpíadas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Regras de ingresso em universidades públicas e privadas, no Brasil e no mundo, a partir do
          resultado em olimpíadas científicas.
        </p>
        <p className="mt-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Conteúdo curado a partir de editais e páginas oficiais, verificado em{" "}
          <span className="font-semibold text-foreground">{VERIFICADO_EM}</span>. Editais mudam a
          cada ciclo (geralmente entre outubro e janeiro) — confirme sempre no site oficial antes de
          decidir.
        </p>
      </div>

      {SECOES.map((secao) => {
        const itens = INSTITUICOES.filter((i) => i.categoria === secao.categoria);
        if (itens.length === 0) return null;
        return (
          <section key={secao.categoria}>
            <h2 className="text-lg font-bold text-foreground">{secao.titulo}</h2>
            <p className="mb-3 mt-0.5 text-sm text-muted-foreground">{secao.descricao}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {itens.map((inst) => (
                <CardInstituicao key={inst.sigla} inst={inst} linksClicaveis={linksClicaveis} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <h2 className="text-lg font-bold text-foreground">{PL_3943.titulo}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{PL_3943.resumo}</p>
        <p className="mt-2 text-sm">
          <span className="font-medium text-foreground">Status:</span>{" "}
          <span className="text-muted-foreground">{PL_3943.status}</span>
        </p>
        {linksClicaveis ? (
          <a
            href={PL_3943.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Tramitação na Câmara ↗
          </a>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            Acompanhe pela tramitação oficial na Câmara dos Deputados.
          </p>
        )}
      </section>
    </div>
  );
}
