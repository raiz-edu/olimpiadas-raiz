import { createRoot } from "react-dom/client";
import { useSyncExternalStore } from "react";
import { PainelEngajamento } from "@/components/engajamento/painel";
import {
  criarJanelaEstudo,
  lerFiltrosEngajamento,
  montarAlunosEngajamento,
} from "@/lib/engajamento/metricas";
import { AGORA_ENGAJAMENTO, fixturePedagogico } from "@/tests/fixtures/engajamento";
import "@/app/globals.css";

// Mantém a árvore React entre alterações na URL, como a navegação do Next.
const assinarNavegacao = (atualizar: () => void) => {
  window.addEventListener("popstate", atualizar);
  return () => window.removeEventListener("popstate", atualizar);
};
function PreviewPedagogico() {
  const busca = useSyncExternalStore(
    assinarNavegacao,
    () => window.location.search,
    () => "",
  );
  const filtros = lerFiltrosEngajamento(Object.fromEntries(new URLSearchParams(busca)));
  const janela = criarJanelaEstudo(filtros.periodo, AGORA_ENGAJAMENTO);
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <p className="mb-5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
        Verificação visual · dados sintéticos de teste
      </p>
      <PainelEngajamento
        alunos={montarAlunosEngajamento(fixturePedagogico(), janela)}
        filtros={filtros}
        janela={janela}
      />
    </main>
  );
}
document.documentElement.style.setProperty("--font-inter", "Arial, sans-serif");
createRoot(document.getElementById("root")!).render(<PreviewPedagogico />);
