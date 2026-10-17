import Link from "next/link";
import { ChevronLeft, ChevronRight, UserRoundSearch } from "lucide-react";
import type { PerfilNaoConfirmado } from "@/lib/engajamento/metricas";

type Paginacao = {
  pagina: number;
  paginas: number;
  total: number;
  anterior: string | null;
  proxima: string | null;
};

function ultimoAcesso(iso: string | null) {
  if (!iso || !Number.isFinite(Date.parse(iso))) return "Sem acesso registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(iso));
}

export function PerfisNaoConfirmados({
  perfis,
  paginacao,
  abrirLista,
}: {
  perfis: PerfilNaoConfirmado[];
  paginacao: Paginacao;
  abrirLista: boolean;
}) {
  return (
    <section
      id="perfis-nao-confirmados"
      aria-labelledby="perfis-nao-confirmados-titulo"
      className="min-w-0 scroll-mt-6 rounded-2xl border border-amber-400/25 bg-card p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="perfis-nao-confirmados-titulo"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <UserRoundSearch className="h-4 w-4 text-amber-300" aria-hidden="true" />
          Perfil não confirmado
        </h2>
        <span className="rounded-lg bg-amber-400/10 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-200">
          {paginacao.total.toLocaleString("pt-BR")} cadastro(s) no recorte
        </span>
      </div>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Estes cadastros ainda precisam confirmar se são alunos ou profissionais. A confirmação será
        solicitada no próximo acesso à área de estudos. Até lá, ficam fora dos indicadores de
        alunos.
      </p>
      {paginacao.total === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nenhum perfil aguarda confirmação neste recorte.
        </p>
      ) : (
        <details open={abrirLista} className="mt-4 min-w-0">
          <summary className="w-fit cursor-pointer rounded py-1 text-xs font-semibold text-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
            Consultar cadastros com perfil não confirmado
          </summary>
          <p className="mb-3 mt-2 text-xs leading-relaxed text-muted-foreground">
            Marca, unidade, série e busca seguem os filtros acima. A pendência cadastral independe
            do período, da situação de estudo e dos filtros de questões.
          </p>
          <div
            className="overflow-x-auto rounded-xl border border-border"
            tabIndex={0}
            role="region"
            aria-label="Cadastros com perfil não confirmado"
          >
            <table className="w-full min-w-[600px] text-left text-sm">
              <caption className="sr-only">
                Lista de cadastros aguardando confirmação de perfil
              </caption>
              <thead className="border-b border-border bg-background/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Nome
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Vínculo informado
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Último acesso
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {perfis.map((perfil) => (
                  <tr key={perfil.id}>
                    <th scope="row" className="px-4 py-3 font-medium text-foreground">
                      {perfil.nome}
                    </th>
                    <td className="px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                      <p className="font-medium text-foreground">{perfil.marca}</p>
                      <p>{perfil.unidade}</p>
                      {perfil.serie && <p>{perfil.serie}</p>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                      {ultimoAcesso(perfil.last_login_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav
            aria-label="Paginação de perfis não confirmados"
            className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
          >
            <p>
              Página {paginacao.pagina} de {paginacao.paginas} ·{" "}
              {paginacao.total.toLocaleString("pt-BR")} cadastro(s)
            </p>
            <div className="flex gap-2">
              {paginacao.anterior && (
                <Link
                  href={paginacao.anterior}
                  className="flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 font-medium text-foreground hover:bg-muted"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Perfis anteriores
                </Link>
              )}
              {paginacao.proxima && (
                <Link
                  href={paginacao.proxima}
                  className="flex min-h-10 items-center gap-1 rounded-lg border border-border px-3 font-medium text-foreground hover:bg-muted"
                >
                  Próximos perfis
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </nav>
        </details>
      )}
    </section>
  );
}
