"use client";

import { useState, useTransition, useActionState } from "react";
import {
  atualizarUsuario,
  convidarUsuario,
  cancelarConvite,
  criarUsuarioDireto,
  type UsuarioState,
} from "@/app/(protected)/usuarios/actions";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/auth/roles";
import type { RoleUsuario } from "@/lib/types/database";

const TEAL = "rgb(91,184,193)";
const NIVEIS_ROLE: RoleUsuario[] = [
  "diretor_marca",
  "gestor_conteudo",
  "professor",
  "coordenador",
  "diretor",
];

// ─── Tipos ────────────────────────────────────────────────────────────────────

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  role: RoleUsuario;
  marca_ativa_id: string | null;
  ativo: boolean;
  marca?: { id: string; nome: string } | null;
};

type ConviteRow = {
  id: string;
  email: string;
  role: RoleUsuario;
  expires_at: string;
  aceito_em: string | null;
  marca?: { id: string; nome: string } | null;
};

type MarcaRow = { id: string; nome: string };

type Props = {
  usuarios: UsuarioRow[];
  convites: ConviteRow[];
  marcas: MarcaRow[];
  isRaiz: boolean;
  isDiretor: boolean;
  currentUserId: string;
};

// ─── Badge helpers ────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: RoleUsuario }) {
  const colors: Record<RoleUsuario, string> = {
    raiz: "bg-[rgb(91,184,193)]/10 text-[rgb(91,184,193)]",
    diretor_marca: "bg-blue-400/10 text-blue-400",
    gestor_conteudo: "bg-amber-400/10 text-amber-400",
    professor: "bg-indigo-400/10 text-indigo-400",
    coordenador: "bg-violet-400/10 text-violet-400",
    diretor: "bg-purple-400/10 text-purple-400",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

// ─── Formulário de edição de usuário ─────────────────────────────────────────

function EditarUsuarioForm({
  usuario,
  marcas: _marcas,
  isRaiz,
  onClose,
}: {
  usuario: UsuarioRow;
  marcas: MarcaRow[];
  isRaiz: boolean;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<UsuarioState, FormData>(
    atualizarUsuario,
    null,
  );
  const [ativo, setAtivo] = useState(usuario.ativo);

  if (state && "ok" in state) onClose();

  return (
    <form
      action={formAction}
      className="mt-2 rounded-xl border border-border bg-background p-4 space-y-4"
    >
      <input type="hidden" name="id" value={usuario.id} />
      <input type="hidden" name="ativo" value={String(ativo)} />

      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Editar — {usuario.nome}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Role — somente Raiz pode alterar */}
        {isRaiz && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Nível de acesso</label>
            <select
              name="role"
              defaultValue={usuario.role}
              className="mt-1 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            >
              {NIVEIS_ROLE.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {ROLE_DESCRIPTIONS[usuario.role as RoleUsuario]}
            </p>
          </div>
        )}

        {/* Status */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) => setAtivo(e.target.checked)}
              className="accent-[rgb(91,184,193)]"
            />
            <span className="text-sm text-foreground">Usuário ativo</span>
          </label>
        </div>
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: TEAL }}
        >
          {isPending ? "Salvando…" : "Salvar"}
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

// ─── Formulário de convite ────────────────────────────────────────────────────

function ConvidarForm({
  marcas,
  isRaiz,
  isDiretor,
  marcaAtualId,
  onClose,
}: {
  marcas: MarcaRow[];
  isRaiz: boolean;
  isDiretor: boolean;
  marcaAtualId: string | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<UsuarioState, FormData>(
    convidarUsuario,
    null,
  );

  // Quando o convite foi criado, mostra o link antes de fechar
  if (state && "ok" in state && state.link) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Convite criado
        </p>
        {state.warning && (
          <p className="rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-400">
            {state.warning}
          </p>
        )}
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Link de acesso</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={state.link}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none"
              onFocus={(e) => e.target.select()}
            />
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(state.link!)}
              className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Copiar
            </button>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Compartilhe este link com o usuário. Expira em 7 dias.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Convidar novo usuário
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground">E-mail *</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="usuario@exemplo.com.br"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground">Nível de acesso *</label>
          <select
            name="role"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value="">Selecione…</option>
            {(isRaiz
              ? NIVEIS_ROLE
              : isDiretor
                ? NIVEIS_ROLE.filter((r) => ["professor", "coordenador", "diretor"].includes(r))
                : NIVEIS_ROLE
            ).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>

        {isRaiz && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Marca</label>
            <select
              name="marca_id"
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            >
              <option value="">— nenhuma —</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {!isRaiz && marcaAtualId && <input type="hidden" name="marca_id" value={marcaAtualId} />}
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: TEAL }}
        >
          {isPending ? "Enviando…" : "Enviar convite"}
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

// ─── Criar usuário diretamente ────────────────────────────────────────────────

function CriarUsuarioForm({
  marcas,
  isRaiz,
  marcaAtualId,
  onClose,
}: {
  marcas: MarcaRow[];
  isRaiz: boolean;
  marcaAtualId: string | null;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState<UsuarioState, FormData>(
    criarUsuarioDireto,
    null,
  );

  if (state && "ok" in state && state.tempPassword) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
          Usuário criado com sucesso
        </p>
        <p className="text-sm text-muted-foreground">
          Compartilhe as credenciais abaixo pelo WhatsApp ou outro canal seguro. O usuário poderá
          alterar a senha após o primeiro acesso.
        </p>

        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              E-mail
            </p>
            <p className="text-sm font-medium text-foreground">{state.email}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Senha temporária
            </p>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 rounded bg-secondary px-3 py-1.5 text-base font-bold tracking-widest text-foreground">
                {state.tempPassword}
              </code>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(state.tempPassword!)}
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: TEAL }}
        >
          Fechar
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-border bg-card p-5 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: TEAL }}>
        Adicionar usuário
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome *</label>
          <input
            name="nome"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="Nome completo"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">E-mail *</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
            placeholder="usuario@exemplo.com.br"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nível de acesso *</label>
          <select
            name="role"
            required
            className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
          >
            <option value="">Selecione…</option>
            {(isRaiz ? NIVEIS_ROLE : NIVEIS_ROLE.filter((r) => r !== "raiz")).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        {isRaiz && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Marca</label>
            <select
              name="marca_id"
              className="mt-1 block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            >
              <option value="">— nenhuma —</option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>
        )}
        {!isRaiz && marcaAtualId && <input type="hidden" name="marca_id" value={marcaAtualId} />}
      </div>

      {state && "error" in state && <p className="text-xs text-destructive">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: TEAL }}
        >
          {isPending ? "Criando…" : "Criar usuário"}
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

// ─── Componente principal ─────────────────────────────────────────────────────

export function UsuariosPage({
  usuarios,
  convites,
  marcas,
  isRaiz,
  isDiretor,
  currentUserId,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConvite, setShowConvite] = useState(false);
  const [showCriar, setShowCriar] = useState(false);
  const [cancelando, startCancelar] = useTransition();

  const pendentes = convites.filter((c) => !c.aceito_em);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestão de acesso e permissões do sistema
          </p>
        </div>
        {!showCriar && !showConvite && (
          <div className="flex gap-2">
            {isDiretor ? (
              <button
                type="button"
                onClick={() => setShowConvite(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: TEAL }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Convidar usuário
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowCriar(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: TEAL }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
                Adicionar usuário
              </button>
            )}
          </div>
        )}
      </div>

      {/* Formulário de convite (diretor) */}
      {showConvite && (
        <ConvidarForm
          marcas={marcas}
          isRaiz={isRaiz}
          isDiretor={isDiretor}
          marcaAtualId={usuarios.find((u) => u.id === currentUserId)?.marca_ativa_id ?? null}
          onClose={() => setShowConvite(false)}
        />
      )}

      {/* Formulário de criação direta (raiz / diretor_marca) */}
      {showCriar && (
        <CriarUsuarioForm
          marcas={marcas}
          isRaiz={isRaiz}
          marcaAtualId={usuarios.find((u) => u.id === currentUserId)?.marca_ativa_id ?? null}
          onClose={() => setShowCriar(false)}
        />
      )}

      {/* Lista de usuários */}
      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-5 py-3 text-left font-semibold text-muted-foreground">Usuário</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Nível</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Marca</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usuarios.map((u) => (
                <>
                  <tr key={u.id} className="hover:bg-background/50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{u.nome}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <RoleBadge role={u.role} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {u.marca?.nome ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          u.ativo
                            ? "bg-emerald-400/10 text-emerald-400"
                            : "bg-red-400/10 text-red-400"
                        }`}
                      >
                        {u.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.id !== currentUserId && u.role !== "raiz" && (
                        <button
                          type="button"
                          onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                          className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-4 w-4"
                          >
                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" />
                            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                  {editingId === u.id && (
                    <tr key={`${u.id}-edit`}>
                      <td colSpan={5} className="px-5 pb-4">
                        <EditarUsuarioForm
                          usuario={u}
                          marcas={marcas}
                          isRaiz={isRaiz}
                          onClose={() => setEditingId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Convites pendentes */}
      {pendentes.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: TEAL }}
          >
            Convites pendentes ({pendentes.length})
          </p>
          <div className="space-y-2">
            {pendentes.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{c.email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[c.role]}
                    {c.marca?.nome ? ` · ${c.marca.nome}` : ""}
                    {" · expira "}
                    {new Date(c.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={cancelando}
                  onClick={() =>
                    startCancelar(async () => {
                      await cancelarConvite(c.id);
                    })
                  }
                  className="shrink-0 text-xs text-muted-foreground hover:text-red-400 disabled:opacity-40 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
