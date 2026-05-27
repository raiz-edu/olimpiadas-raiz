"use client";

import { useState, useRef, useTransition, useActionState, useEffect } from "react";
import {
  criarProjeto,
  atualizarProjeto,
  excluirProjeto,
  criarAula,
  atualizarAula,
  excluirAula,
  uploadMaterial,
  excluirMaterial,
  getMaterialUrl,
  publicarProjeto,
  despublicarProjeto,
  publicarAula,
  despublicarAula,
  type Projeto,
  type Aula,
  type Material,
} from "@/app/(protected)/academico/preparacao/actions";
import { CATALOGO } from "@/lib/olimpiadas/catalogo";

// ─── Séries por segmento ──────────────────────────────────────────────────────

const SERIES_POR_SEGMENTO: Record<string, string[]> = {
  EFAI: ["1º", "2º", "3º", "4º", "5º"],
  EFAF: ["6º", "7º", "8º", "9º"],
  EM: ["1º EM", "2º EM", "3º EM"],
};

const SEG_LABELS: Record<string, string> = {
  EFAI: "EFAI (1º–5º)",
  EFAF: "EFAF (6º–9º)",
  EM: "Ensino Médio",
};

function getSeriesParaOlimpiada(sigla: string): string[] {
  const ol = CATALOGO.find((o) => o.sigla === sigla);
  if (!ol) return [];
  return ol.segmentos.flatMap((seg) => SERIES_POR_SEGMENTO[seg] ?? []);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayFileName(name: string) {
  return name.replace(/^\d{13}-/, "");
}

const TEAL = "rgb(91,184,193)";

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// ─── Ícone lápis ─────────────────────────────────────────────────────────────

function PencilIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
      <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
    </svg>
  );
}

// ─── Checkbox estilizado ──────────────────────────────────────────────────────

// ─── Badge tipo aula ─────────────────────────────────────────────────────────

function TipoBadge({ tipo }: { tipo: string }) {
  if (tipo === "online")
    return (
      <span className="rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] font-medium text-sky-400">
        Online
      </span>
    );
  if (tipo === "presencial")
    return (
      <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[11px] font-medium text-violet-400">
        Presencial
      </span>
    );
  return (
    <span className="rounded-full bg-indigo-400/10 px-2 py-0.5 text-[11px] font-medium text-indigo-400">
      Simulado
    </span>
  );
}

// ─── Upload de material ───────────────────────────────────────────────────────

function MaterialUpload({ aulaId, materiais }: { aulaId: string; materiais: Material[] }) {
  const bound = uploadMaterial.bind(null, aulaId);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [deleting, startDelete] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const prevOk = state && "ok" in state;
  useEffect(() => {
    if (prevOk && formRef.current) formRef.current.reset();
  }, [prevOk]);

  async function handleDownload(path: string, nome: string) {
    const url = await getMaterialUrl(path);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = nome;
      a.click();
    }
  }

  function handleDelete(id: string, path: string) {
    if (!confirm("Remover este material?")) return;
    startDelete(async () => {
      await excluirMaterial(id, path);
    });
  }

  return (
    <div className="mt-3 space-y-2">
      {materiais.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
          <span className="flex-1 truncate text-xs text-foreground">{displayFileName(m.nome)}</span>
          <button
            onClick={() => handleDownload(m.arquivo_path, m.nome)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
            title="Baixar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
          </button>
          <button
            onClick={() => handleDelete(m.id, m.arquivo_path)}
            disabled={deleting}
            className="rounded p-0.5 text-muted-foreground hover:text-red-400 disabled:opacity-40"
            title="Remover"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}

      <form ref={formRef} action={formAction} className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground hover:border-ring hover:text-foreground transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-3.5 w-3.5 shrink-0"
          >
            <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
            <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
          </svg>
          Adicionar material
          <input type="file" name="file" className="sr-only" />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-2.5 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
          style={{ backgroundColor: TEAL, color: "white" }}
        >
          {isPending ? "…" : "Enviar"}
        </button>
        {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}
      </form>
    </div>
  );
}

// ─── Formulário de nova aula ──────────────────────────────────────────────────

function NovaAulaForm({ projetoId, onClose }: { projetoId: string; onClose: () => void }) {
  const bound = criarAula.bind(null, projetoId);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [tipo, setTipo] = useState<"online" | "presencial">("online");

  if (state && "ok" in state) onClose();

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-border bg-background p-4 space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Nova aula
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input
            name="titulo"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="Ex: Aula 1 — Aritmética"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
          <div className="mt-1 flex gap-3">
            {(["online", "presencial"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={tipo === t}
                  onChange={() => setTipo(t)}
                  className="accent-[rgb(91,184,193)]"
                />
                <span className="text-sm text-foreground capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Data e hora</label>
          <input
            name="data_hora"
            type="datetime-local"
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
          <input
            name="duracao_minutos"
            type="number"
            min={15}
            step={15}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            placeholder="90"
          />
        </div>
      </div>

      {tipo === "online" ? (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Link da aula</label>
          <input
            name="link_aula"
            type="url"
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="https://meet.google.com/..."
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Polo(s) de realização</label>
          <textarea
            name="polos"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Ex: Centro Raiz SP — Rua X, nº 10&#10;Unidade Tijuca — Av. Y, nº 20"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground">Descrição / observações</label>
        <textarea
          name="descricao"
          rows={2}
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
          placeholder="Conteúdo abordado, pré-requisitos…"
        />
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: TEAL, color: "white" }}
        >
          {isPending ? "Salvando…" : "Salvar aula"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Formulários de simulado ─────────────────────────────────────────────────

function NovoSimuladoForm({ projetoId, onClose }: { projetoId: string; onClose: () => void }) {
  const bound = criarAula.bind(null, projetoId);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [modalidade, setModalidade] = useState<"online" | "presencial">("online");
  if (state && "ok" in state) onClose();

  return (
    <form
      action={formAction}
      className="mt-3 rounded-xl border border-indigo-400/20 bg-background p-4 space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
        Novo simulado
      </p>
      <input type="hidden" name="tipo" value="simulado" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input
            name="titulo"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="Ex: Simulado OBMEP — Nível 2"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Modalidade *</label>
          <div className="mt-1 flex gap-3">
            {(["online", "presencial"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="_modalidade"
                  value={m}
                  checked={modalidade === m}
                  onChange={() => setModalidade(m)}
                  className="accent-indigo-400"
                />
                <span className="text-sm text-foreground capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Data e hora</label>
          <input
            name="data_hora"
            type="datetime-local"
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
          <input
            name="duracao_minutos"
            type="number"
            min={15}
            step={15}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            placeholder="120"
          />
        </div>
        {modalidade === "online" ? (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Link do simulado</label>
            <input
              name="link_aula"
              type="url"
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              placeholder="https://..."
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Polo(s) de realização
            </label>
            <textarea
              name="polos"
              rows={2}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
              placeholder="Ex: Centro Raiz SP — Rua X, nº 10"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Descrição / instruções
          </label>
          <textarea
            name="descricao"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Conteúdo cobrado, materiais permitidos…"
          />
        </div>
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 bg-indigo-400 text-white"
        >
          {isPending ? "Salvando…" : "Salvar simulado"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function EditarSimuladoForm({ aula, onClose }: { aula: Aula; onClose: () => void }) {
  const bound = atualizarAula.bind(null, aula.id);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [modalidade, setModalidade] = useState<"online" | "presencial">(
    aula.polos ? "presencial" : "online",
  );
  if (state && "ok" in state) onClose();

  return (
    <form
      action={formAction}
      className="rounded-lg border border-indigo-400/20 bg-background p-4 space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
        Editar simulado
      </p>
      <input type="hidden" name="tipo" value="simulado" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input
            name="titulo"
            required
            defaultValue={aula.titulo}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Modalidade *</label>
          <div className="mt-1 flex gap-3">
            {(["online", "presencial"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="_modalidade"
                  value={m}
                  checked={modalidade === m}
                  onChange={() => setModalidade(m)}
                  className="accent-indigo-400"
                />
                <span className="text-sm text-foreground capitalize">{m}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Data e hora</label>
          <input
            name="data_hora"
            type="datetime-local"
            defaultValue={toDatetimeLocal(aula.data_hora)}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
          <input
            name="duracao_minutos"
            type="number"
            min={15}
            step={15}
            defaultValue={aula.duracao_minutos ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            placeholder="120"
          />
        </div>
        {modalidade === "online" ? (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Link do simulado</label>
            <input
              name="link_aula"
              type="url"
              defaultValue={aula.link_aula ?? ""}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
              placeholder="https://..."
            />
          </div>
        ) : (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">
              Polo(s) de realização
            </label>
            <textarea
              name="polos"
              rows={2}
              defaultValue={aula.polos ?? ""}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
              placeholder="Ex: Centro Raiz SP — Rua X, nº 10"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">
            Descrição / instruções
          </label>
          <textarea
            name="descricao"
            rows={2}
            defaultValue={aula.descricao ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Conteúdo cobrado, materiais permitidos…"
          />
        </div>
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 bg-indigo-400 text-white"
        >
          {isPending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Formulário de edição de aula ────────────────────────────────────────────

function EditarAulaForm({ aula, onClose }: { aula: Aula; onClose: () => void }) {
  const bound = atualizarAula.bind(null, aula.id);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [tipo, setTipo] = useState<"online" | "presencial">(aula.tipo as "online" | "presencial");

  if (state && "ok" in state) onClose();

  return (
    <form
      action={formAction}
      className="rounded-lg border border-border bg-background p-4 space-y-3"
    >
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Editar aula
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Título *</label>
          <input
            name="titulo"
            required
            defaultValue={aula.titulo}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo *</label>
          <div className="mt-1 flex gap-3">
            {(["online", "presencial"] as const).map((t) => (
              <label key={t} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tipo"
                  value={t}
                  checked={tipo === t}
                  onChange={() => setTipo(t)}
                  className="accent-[rgb(91,184,193)]"
                />
                <span className="text-sm text-foreground capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Data e hora</label>
          <input
            name="data_hora"
            type="datetime-local"
            defaultValue={toDatetimeLocal(aula.data_hora)}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Duração (min)</label>
          <input
            name="duracao_minutos"
            type="number"
            min={15}
            step={15}
            defaultValue={aula.duracao_minutos ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            placeholder="90"
          />
        </div>
      </div>

      {tipo === "online" ? (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Link da aula</label>
          <input
            name="link_aula"
            type="url"
            defaultValue={aula.link_aula ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="https://meet.google.com/..."
          />
        </div>
      ) : (
        <div>
          <label className="text-xs font-medium text-muted-foreground">Polo(s) de realização</label>
          <textarea
            name="polos"
            rows={2}
            defaultValue={aula.polos ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Ex: Centro Raiz SP — Rua X, nº 10&#10;Unidade Tijuca — Av. Y, nº 20"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-muted-foreground">Descrição / observações</label>
        <textarea
          name="descricao"
          rows={2}
          defaultValue={aula.descricao ?? ""}
          className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
          placeholder="Conteúdo abordado, pré-requisitos…"
        />
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          style={{ backgroundColor: TEAL, color: "white" }}
        >
          {isPending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Card de aula ─────────────────────────────────────────────────────────────

function AulaCard({ aula }: { aula: Aula }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [publishing, startPublish] = useTransition();

  function handleTogglePublish() {
    startPublish(async () => {
      if (aula.publicada) await despublicarAula(aula.id);
      else await publicarAula(aula.id);
    });
  }

  function handleDelete() {
    if (!confirm(`Excluir "${aula.titulo}" e todos os seus materiais?`)) return;
    startDelete(async () => {
      await excluirAula(aula.id);
    });
  }

  if (editing) {
    return aula.tipo === "simulado" ? (
      <EditarSimuladoForm aula={aula} onClose={() => setEditing(false)} />
    ) : (
      <EditarAulaForm aula={aula} onClose={() => setEditing(false)} />
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <TipoBadge tipo={aula.tipo} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{aula.titulo}</p>
          <p className="text-xs text-muted-foreground">
            {fmtDateTime(aula.data_hora)}
            {aula.duracao_minutos ? ` · ${aula.duracao_minutos} min` : ""}
            {(aula.tipo === "online" || aula.tipo === "simulado") && aula.link_aula && (
              <>
                {" · "}
                <a
                  href={aula.link_aula}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  style={{ color: TEAL }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {aula.tipo === "simulado" ? "Acessar simulado" : "Acessar aula"}
                </a>
              </>
            )}
            {(aula.tipo === "presencial" || aula.tipo === "simulado") && aula.polos && (
              <>
                {" "}
                ·{" "}
                <span className="text-violet-400">
                  {aula.polos.split("\n")[0]}
                  {aula.polos.split("\n").length > 1 ? " …" : ""}
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50 ${
            aula.publicada
              ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
              : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
          }`}
          title={aula.publicada ? "Despublicar aula" : "Publicar aula"}
        >
          {aula.publicada ? "Publicada" : "Rascunho"}
        </button>

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded p-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          title={expanded ? "Recolher" : "Materiais"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
          title="Editar aula"
        >
          <PencilIcon />
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors"
          title="Excluir aula"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4">
          {aula.tipo === "presencial" && aula.polos && (
            <div className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/5 px-3 py-2">
              <p className="text-xs font-medium text-violet-400">Polo(s) de realização</p>
              <p className="mt-0.5 whitespace-pre-line text-xs text-violet-400/80">{aula.polos}</p>
            </div>
          )}
          {aula.descricao && <p className="mt-3 text-xs text-muted-foreground">{aula.descricao}</p>}
          <MaterialUpload aulaId={aula.id} materiais={aula.materiais} />
        </div>
      )}
    </div>
  );
}

// ─── Card de projeto ──────────────────────────────────────────────────────────

function ProjetoCard({ projeto }: { projeto: Projeto }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showAulaForm, setShowAulaForm] = useState(false);
  const [showSimuladoForm, setShowSimuladoForm] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [publishing, startPublish] = useTransition();

  function handleTogglePublish(e: React.MouseEvent) {
    e.stopPropagation();
    startPublish(async () => {
      if (projeto.publicado) await despublicarProjeto(projeto.id);
      else await publicarProjeto(projeto.id);
    });
  }

  const aulasSorted = [...projeto.aulas].sort((a, b) => {
    if (a.data_hora && b.data_hora) return a.data_hora.localeCompare(b.data_hora);
    return a.ordem - b.ordem;
  });

  function handleDelete() {
    if (!confirm(`Excluir o projeto "${projeto.nome}" e todas as suas aulas?`)) return;
    startDelete(async () => {
      await excluirProjeto(projeto.id);
    });
  }

  if (editing) {
    return <EditarProjetoForm projeto={projeto} onClose={() => setEditing(false)} />;
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="w-24 shrink-0 text-center text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {projeto.olimpiada_sigla}
        </span>
        <div className="mx-3 h-8 w-px shrink-0 bg-border" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{projeto.nome}</p>
          <p className="text-[11px] text-muted-foreground/70">
            {projeto.ano_letivo} · {projeto.aulas.length} aula
            {projeto.aulas.length !== 1 ? "s" : ""}
            {(projeto.series_elegiveis ?? []).length > 0 && (
              <span className="ml-1">· {(projeto.series_elegiveis ?? []).join(", ")}</span>
            )}
          </p>
        </div>
        <button
          onClick={handleTogglePublish}
          disabled={publishing}
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold transition-colors disabled:opacity-50 ${
            projeto.publicado
              ? "bg-emerald-500/10 text-emerald-400 hover:bg-red-500/10 hover:text-red-400"
              : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-400"
          }`}
          title={projeto.publicado ? "Despublicar" : "Publicar no portal do aluno"}
        >
          {projeto.publicado ? "Publicado" : "Rascunho"}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          title="Editar projeto"
        >
          <PencilIcon />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          disabled={deleting}
          className="shrink-0 rounded p-1.5 text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors"
          title="Excluir projeto"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-3">
          {projeto.descricao && (
            <p className="text-sm text-muted-foreground">{projeto.descricao}</p>
          )}

          {aulasSorted.length === 0 && !showAulaForm && (
            <p className="text-xs text-muted-foreground/60 italic">Nenhuma aula cadastrada.</p>
          )}

          {aulasSorted.map((aula) => (
            <AulaCard key={aula.id} aula={aula} />
          ))}

          {showAulaForm ? (
            <NovaAulaForm projetoId={projeto.id} onClose={() => setShowAulaForm(false)} />
          ) : showSimuladoForm ? (
            <NovoSimuladoForm projetoId={projeto.id} onClose={() => setShowSimuladoForm(false)} />
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAulaForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground hover:border-ring hover:text-foreground transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Adicionar aula
              </button>
              <button
                type="button"
                onClick={() => setShowSimuladoForm(true)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-indigo-400/30 px-3 py-2 text-xs text-indigo-400/70 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Adicionar simulado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Seleção de séries elegíveis ─────────────────────────────────────────────

function SeriesCheckboxes({
  sigla,
  defaultSelected,
}: {
  sigla: string;
  defaultSelected?: string[];
}) {
  const allSeries = getSeriesParaOlimpiada(sigla);
  const [selected, setSelected] = useState<Set<string>>(() => {
    if (!allSeries.length) return new Set();
    if (!defaultSelected || defaultSelected.length === 0) return new Set(allSeries);
    return new Set(defaultSelected);
  });

  if (!allSeries.length) return null;

  const allChecked = allSeries.every((s) => selected.has(s));

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(allSeries));
  }

  function toggle(s: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  const grupos = Object.entries(SERIES_POR_SEGMENTO).filter(([, ss]) =>
    ss.some((s) => allSeries.includes(s)),
  );

  return (
    <div className="sm:col-span-2 rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Séries elegíveis</label>
        <button
          type="button"
          onClick={toggleAll}
          className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {allChecked ? "Desmarcar todas" : "Selecionar todas"}
        </button>
      </div>
      {grupos.map(([seg, ss]) => {
        const available = ss.filter((s) => allSeries.includes(s));
        if (!available.length) return null;
        return (
          <div key={seg}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
              {SEG_LABELS[seg]}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {available.map((s) => (
                <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="series_elegiveis"
                    value={s}
                    checked={selected.has(s)}
                    onChange={() => toggle(s)}
                    className="accent-[rgb(91,184,193)]"
                  />
                  <span className="text-sm text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Formulário de edição de projeto ─────────────────────────────────────────

function EditarProjetoForm({ projeto, onClose }: { projeto: Projeto; onClose: () => void }) {
  const bound = atualizarProjeto.bind(null, projeto.id);
  const [state, formAction, isPending] = useActionState(bound, null);
  const [siglaSelected, setSiglaSelected] = useState(projeto.olimpiada_sigla);

  if (state && "ok" in state) onClose();

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Editar projeto
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Olimpíada *</label>
          <select
            name="olimpiada_sigla"
            required
            value={siglaSelected}
            onChange={(e) => setSiglaSelected(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value="">Selecione…</option>
            {CATALOGO.map((o) => (
              <option key={o.sigla} value={o.sigla}>
                {o.sigla} — {o.area}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ano letivo *</label>
          <input
            name="ano_letivo"
            type="number"
            defaultValue={projeto.ano_letivo}
            min={2020}
            max={2030}
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Nome do projeto *</label>
          <input
            name="nome"
            required
            defaultValue={projeto.nome}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea
            name="descricao"
            rows={2}
            defaultValue={projeto.descricao ?? ""}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Objetivo, público-alvo, série…"
          />
        </div>
        <SeriesCheckboxes sigla={siglaSelected} defaultSelected={projeto.series_elegiveis} />
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: TEAL, color: "white" }}
        >
          {isPending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Formulário de novo projeto ───────────────────────────────────────────────

function NovoProjetoForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(criarProjeto, null);
  const [siglaSelected, setSiglaSelected] = useState("");
  if (state && "ok" in state) onClose();

  const anoAtual = new Date().getFullYear();

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Novo projeto de preparação
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Olimpíada *</label>
          <select
            name="olimpiada_sigla"
            required
            value={siglaSelected}
            onChange={(e) => setSiglaSelected(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value="">Selecione…</option>
            {CATALOGO.map((o) => (
              <option key={o.sigla} value={o.sigla}>
                {o.sigla} — {o.area}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Ano letivo *</label>
          <input
            name="ano_letivo"
            type="number"
            defaultValue={anoAtual}
            min={2020}
            max={2030}
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Nome do projeto *</label>
          <input
            name="nome"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="Ex: Nivelamento OBMEP 2026 — Módulo 1"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">Descrição</label>
          <textarea
            name="descricao"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none resize-none"
            placeholder="Objetivo, público-alvo, série…"
          />
        </div>
        <SeriesCheckboxes sigla={siglaSelected} />
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: TEAL, color: "white" }}
        >
          {isPending ? "Criando…" : "Criar projeto"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export function PreparacaoPage({ projetos }: { projetos: Projeto[] }) {
  const [showNovoForm, setShowNovoForm] = useState(false);

  return (
    <div className="space-y-4">
      {showNovoForm ? (
        <NovoProjetoForm onClose={() => setShowNovoForm(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setShowNovoForm(true)}
          className="flex items-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:border-ring hover:text-foreground transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Novo projeto
        </button>
      )}

      {projetos.length === 0 && !showNovoForm && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum projeto cadastrado ainda.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Clique em &quot;Novo projeto&quot; para começar.
          </p>
        </div>
      )}

      {projetos.map((p) => (
        <ProjetoCard key={p.id} projeto={p} />
      ))}
    </div>
  );
}
