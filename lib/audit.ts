/**
 * Trilha de auditoria em `audit_log` (issue #159 — primeiro escritor da tabela).
 *
 * Nunca lança: uma falha de auditoria vira console.error, não derruba a ação.
 * Quem chama decide o que vai em `antes`/`depois` — segredos NÃO entram aqui.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/types/database";

export type EventoAuditoria = {
  usuarioId: string | null;
  entidade: string;
  /** uuid do registro afetado (coluna entidade_id é uuid not null). */
  entidadeId: string;
  acao: "create" | "update" | "delete";
  antes?: Json | null;
  depois?: Json | null;
};

export async function registrarAuditoria(evento: EventoAuditoria): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("audit_log").insert({
      usuario_id: evento.usuarioId,
      entidade: evento.entidade,
      entidade_id: evento.entidadeId,
      acao: evento.acao,
      dados_antes: evento.antes ?? null,
      dados_depois: evento.depois ?? null,
    });
    if (error) console.error("[audit]", evento.entidade, evento.acao, "falhou:", error.message);
  } catch (e) {
    console.error("[audit]", evento.entidade, evento.acao, "falhou:", (e as Error).message);
  }
}
