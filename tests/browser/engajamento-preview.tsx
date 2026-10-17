import { createRoot } from "react-dom/client";
import { useSyncExternalStore } from "react";
import { PainelEngajamento } from "@/components/engajamento/painel";
import {
  criarJanelaEstudo,
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
  montarPerfisNaoConfirmados,
  janelaAnteriorEstudo,
} from "@/lib/engajamento/metricas";
import { catalogoRecortes } from "@/lib/engajamento/recortes";
import { lerFiltrosRanking } from "@/lib/engajamento/ranking";
import { PainelRanking } from "@/components/engajamento/ranking";
import {
  AGORA_ENGAJAMENTO,
  fixturePerfisNaoConfirmados,
  fixtureRankingOlimpico,
} from "@/tests/fixtures/engajamento";
import "@/app/globals.css";

// Mantém a árvore React entre alterações na URL, como a navegação do Next.
const assinarNavegacao = (atualizar: () => void) => {
  window.addEventListener("popstate", atualizar);
  return () => window.removeEventListener("popstate", atualizar);
};
function PreviewPedagogico() {
  const endereco = useSyncExternalStore(
    assinarNavegacao,
    () => window.location.href,
    () => "",
  );
  const url = new URL(endereco, window.location.origin);
  const params = Object.fromEntries(url.searchParams);
  const filtros = lerFiltrosEngajamento(params);
  const janela = criarJanelaEstudo(filtros.periodo, AGORA_ENGAJAMENTO);
  const ranking = url.pathname === "/academico/ranking";
  const dados = ranking ? fixtureRankingOlimpico() : fixturePerfisNaoConfirmados();
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <p className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
        Verificação visual · dados sintéticos de teste
      </p>
      {ranking ? (
        <PainelRanking dados={dados} filtros={lerFiltrosRanking(params)} janela={janela} />
      ) : (
        <PainelEngajamento
          alunos={montarAlunosEngajamento(dados, janela, filtros)}
          anteriores={montarAlunosEngajamento(dados, janelaAnteriorEstudo(janela), filtros)}
          catalogo={catalogoRecortes(dados)}
          naoConfirmados={montarPerfisNaoConfirmados(dados)}
          filtros={filtros}
          janela={janela}
        />
      )}
    </main>
  );
}
document.documentElement.style.setProperty("--font-inter", "Arial, sans-serif");
createRoot(document.getElementById("root")!).render(<PreviewPedagogico />);
