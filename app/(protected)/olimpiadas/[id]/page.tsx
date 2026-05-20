import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { can } from "@/lib/auth/roles";
import { Can } from "@/components/auth/can";
import { StatusBadge } from "@/components/ui/status-badge";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { FaseForm } from "./_fase-form";
import { vincularMarca, excluirFase } from "../actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();
  const { data } = await supabase.from("olimpiada").select("nome").eq("id", id).single();
  return { title: data ? `${data.nome} — Olimpíadas` : "Olimpíada" };
}

const TIPO_FASE_LABELS: Record<string, string> = {
  inscricao: "Inscrição",
  prova_1: "Prova 1",
  prova_2: "Prova 2",
  final: "Final",
  divulgacao: "Divulgação",
};

const CLASSIFICACAO_LABELS: Record<string, string> = {
  obrigatoria: "Obrigatória",
  facultativa: "Facultativa",
};

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value ?? "—"}</dd>
    </div>
  );
}

export default async function OlimpiadaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession();
  if (!session) return null;

  const { user } = session;
  const canUpdate = can(user.role, "olimpiada:update");

  const supabase = createAdminClient();

  const [{ data: olimpiada }, { data: fases }, { data: marcasVinculadas }, { data: todasMarcas }] =
    await Promise.all([
      supabase.from("olimpiada").select("*").eq("id", id).single(),
      supabase.from("olimpiada_fase").select("*").eq("olimpiada_id", id).order("ordem"),
      supabase
        .from("olimpiada_marca")
        .select("marca_id, marca:marca_id(id, nome, cor_primaria)")
        .eq("olimpiada_id", id),
      supabase.from("marca").select("id, nome, cor_primaria").eq("ativo", true).order("nome"),
    ]);

  if (!olimpiada) notFound();

  type MarcaRow = { id: string; nome: string; cor_primaria: string | null };
  const vinculadasIds = new Set((marcasVinculadas ?? []).map((m) => m.marca_id));
  const marcasDisponiveis = (todasMarcas ?? ([] as MarcaRow[])).filter(
    (m) => !vinculadasIds.has(m.id),
  );

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[{ label: "Olimpíadas", href: "/olimpiadas" }, { label: olimpiada.nome }]}
      />
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{olimpiada.nome}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge ativo={olimpiada.ativo} />
            <span className="text-sm text-gray-500">{olimpiada.area_conhecimento}</span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">
              {CLASSIFICACAO_LABELS[olimpiada.classificacao]}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-sm text-gray-500">{olimpiada.ano_letivo}</span>
          </div>
        </div>
        <Can role={user.role} perform="olimpiada:update">
          <Link
            href={`/olimpiadas/${id}/editar`}
            className="shrink-0 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Editar
          </Link>
        </Can>
      </div>

      {/* Info grid */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Detalhes
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <InfoItem label="Organização" value={olimpiada.organizacao_promotora} />
          <InfoItem label="Premiação" value={olimpiada.premiacao} />
          <InfoItem
            label="Faixa etária"
            value={
              olimpiada.faixa_etaria_min || olimpiada.faixa_etaria_max
                ? `${olimpiada.faixa_etaria_min ?? "?"} – ${olimpiada.faixa_etaria_max ?? "?"} anos`
                : null
            }
          />
          <InfoItem
            label="Vagas"
            value={
              olimpiada.limite_vagas_total ? String(olimpiada.limite_vagas_total) : "Ilimitadas"
            }
          />
          <InfoItem
            label="Séries elegíveis"
            value={
              olimpiada.series_elegiveis?.length ? olimpiada.series_elegiveis.join(", ") : null
            }
          />
          {olimpiada.regulamento_link_externo && (
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Regulamento
              </dt>
              <dd className="mt-0.5">
                <a
                  href={olimpiada.regulamento_link_externo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver regulamento ↗
                </a>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Marcas */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Marcas participantes
        </h2>
        <div className="space-y-3">
          {/* Vinculadas */}
          {(marcasVinculadas ?? []).length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma marca vinculada.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(marcasVinculadas ?? []).map((mv) => {
                const marca = Array.isArray(mv.marca) ? mv.marca[0] : mv.marca;
                if (!marca) return null;
                const m = marca as MarcaRow;
                return (
                  <div
                    key={mv.marca_id}
                    className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 pl-3 pr-1 py-1"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: m.cor_primaria ?? "#6b7280" }}
                      aria-hidden="true"
                    />
                    <span className="text-sm text-gray-700">{m.nome}</span>
                    {canUpdate && (
                      <form action={vincularMarca} className="ml-1">
                        <input type="hidden" name="olimpiada_id" value={id} />
                        <input type="hidden" name="marca_id" value={mv.marca_id} />
                        <input type="hidden" name="action" value="remove" />
                        <button
                          type="submit"
                          className="flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500"
                          aria-label="Remover"
                        >
                          ×
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Adicionar marca */}
          {canUpdate && marcasDisponiveis.length > 0 && (
            <form action={vincularMarca} className="flex items-center gap-2 mt-2">
              <input type="hidden" name="olimpiada_id" value={id} />
              <input type="hidden" name="action" value="add" />
              <select
                name="marca_id"
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                defaultValue=""
              >
                <option value="" disabled>
                  Vincular marca…
                </option>
                {marcasDisponiveis.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-800"
              >
                Vincular
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Fases */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-700 uppercase tracking-wide">Fases</h2>

        {!fases || fases.length === 0 ? (
          <p className="text-sm text-gray-500 mb-4">Nenhuma fase cadastrada.</p>
        ) : (
          <div className="mb-6 divide-y divide-gray-100">
            {fases.map((f) => (
              <div key={f.id} className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {f.ordem}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{f.nome}</p>
                    <p className="text-xs text-gray-500">
                      {TIPO_FASE_LABELS[f.tipo] ?? f.tipo} · {formatDate(f.data_inicio)} –{" "}
                      {formatDate(f.data_fim)}
                    </p>
                    {f.observacoes && <p className="text-xs text-gray-400">{f.observacoes}</p>}
                  </div>
                </div>
                {canUpdate && (
                  <form action={excluirFase}>
                    <input type="hidden" name="id" value={f.id} />
                    <input type="hidden" name="olimpiada_id" value={id} />
                    <ConfirmButton
                      message={`Remover a fase "${f.nome}"? Esta ação não pode ser desfeita.`}
                      className="rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                    >
                      Remover
                    </ConfirmButton>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}

        {canUpdate && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="mb-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Adicionar fase
            </h3>
            <FaseForm olimpiadaId={id} proximaOrdem={(fases?.length ?? 0) + 1} />
          </div>
        )}
      </div>
    </div>
  );
}
