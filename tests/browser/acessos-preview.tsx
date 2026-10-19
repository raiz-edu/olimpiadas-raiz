import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PainelAcessos } from "@/components/acessos/painel";
import { RegistrarAcesso } from "@/components/acessos/registrar-acesso";
import { inicioPeriodoAcesso, lerFiltrosAcesso, type PessoaAcesso } from "@/lib/acessos/metricas";
import { useEnderecoAcessos } from "./acessos-navigation";
import "@/app/globals.css";

const agora = new Date("2026-10-19T15:00:00Z");
const marcas = [
  { id: "m1", nome: "Marca Aurora" },
  { id: "m2", nome: "Marca Horizonte" },
];
const unidades = [
  { id: "u1", nome: "Unidade Centro", marca_id: "m1" },
  { id: "u2", nome: "Unidade Jardim", marca_id: "m2" },
];
const pessoas: PessoaAcesso[] = Array.from({ length: 16 }, (_, i) => ({
  pessoa_id: `pessoa-${i}`,
  tipo_usuario:
    i < 10
      ? "aluno"
      : i < 12
        ? "professor"
        : i === 12
          ? "colaborador"
          : i === 13
            ? "equipe"
            : "pendente",
  marca_id: i % 2 ? "m1" : "m2",
  unidade_id: i < 10 ? (i % 2 ? "u1" : "u2") : null,
  serie: i < 10 ? (i < 5 ? "6º" : "3º EM") : null,
  criado_em: i === 15 ? "2026-10-18T12:00:00Z" : "2026-09-01T10:00:00Z",
  ultimo_acesso:
    i === 2 || i === 15 ? null : i === 4 ? "2026-10-01T12:00:00Z" : "2026-10-18T12:00:00Z",
  sessoes: i === 2 || i === 15 ? 0 : 2,
  acessou_periodo: i !== 2 && i !== 15,
  estudou_periodo: i < 6 && i !== 2,
  medicao_desde: "2026-10-16T12:00:00Z",
}));

function Preview() {
  const url = new URL(useEnderecoAcessos());
  if (url.pathname.startsWith("/aluno/") || url.pathname === "/dashboard") {
    return (
      <>
        <RegistrarAcesso area={url.pathname.startsWith("/aluno/") ? "portal" : "gestao"} />
        <h1>Verificação da coleta de atividade</h1>
        <p>Dados sintéticos</p>
      </>
    );
  }
  const filtros = lerFiltrosAcesso(Object.fromEntries(url.searchParams));
  const desde = inicioPeriodoAcesso(filtros.periodo, agora);
  const restrito = url.searchParams.has("restrito");
  if (restrito) filtros.marca = "m1";
  const lista = url.searchParams.has("vazio")
    ? []
    : pessoas
        .filter((p) => !restrito || p.marca_id === "m1")
        .map((p) => {
          const noPeriodo =
            p.ultimo_acesso !== null &&
            (!desde || Date.parse(p.ultimo_acesso) >= Date.parse(desde));
          return {
            ...p,
            acessou_periodo: noPeriodo,
            estudou_periodo: p.estudou_periodo && noPeriodo,
            sessoes: noPeriodo ? p.sessoes : 0,
          };
        });
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8">
      <p className="mb-4 text-xs text-muted-foreground">Dados sintéticos · verificação local</p>
      <PainelAcessos
        pessoas={lista}
        marcas={restrito ? marcas.slice(0, 1) : marcas}
        unidades={restrito ? unidades.slice(0, 1) : unidades}
        filtros={filtros}
        agora={agora}
        restrito={restrito}
      />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Preview />
  </StrictMode>,
);
