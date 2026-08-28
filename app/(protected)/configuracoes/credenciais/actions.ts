"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirCredenciais } from "@/lib/auth/roles";
import { registrarAuditoria } from "@/lib/audit";
import { getDefinicao, type CredencialChave } from "@/lib/credenciais/catalogo";
import { cifrar, ultimos4 as sufixo } from "@/lib/credenciais/crypto";
import { getCredencial, invalidarCacheCredencial } from "@/lib/credenciais/queries";
import { testarChave } from "@/lib/credenciais/testar";

export type CredencialState = { error: string } | { ok: true; message: string } | null;

const ROTA = "/configuracoes/credenciais";
const TAMANHO_MINIMO = 8;

async function exigirGestor() {
  const session = await getServerSession();
  if (!session || !podeGerirCredenciais(session.user.role, session.user.email)) return null;
  return session;
}

function chaveGerenciavel(formData: FormData) {
  const chave = String(formData.get("chave") ?? "");
  const def = getDefinicao(chave);
  return def?.gerenciavel ? { chave: chave as CredencialChave, def } : null;
}

export async function salvarCredencial(
  _prev: CredencialState,
  formData: FormData,
): Promise<CredencialState> {
  const session = await exigirGestor();
  if (!session) return { error: "Não autorizado" };

  const alvo = chaveGerenciavel(formData);
  if (!alvo) return { error: "Integração desconhecida." };

  const valor = String(formData.get("valor") ?? "").trim();
  if (valor.length < TAMANHO_MINIMO) return { error: "Cole a chave completa antes de salvar." };

  let valorCifrado: string;
  try {
    valorCifrado = cifrar(valor);
  } catch (e) {
    return { error: (e as Error).message };
  }

  const admin = createAdminClient();
  const { data: anterior } = await admin
    .from("credencial")
    .select("id, ultimos4")
    .eq("chave", alvo.chave)
    .maybeSingle();

  const { data: salvo, error } = await admin
    .from("credencial")
    .upsert(
      {
        chave: alvo.chave,
        valor_cifrado: valorCifrado,
        ultimos4: sufixo(valor),
        atualizado_em: new Date().toISOString(),
        atualizado_por: session.user.id,
      },
      { onConflict: "chave" },
    )
    .select("id")
    .single();
  if (error || !salvo) return { error: error?.message ?? "Não foi possível salvar." };

  invalidarCacheCredencial(alvo.chave);
  await registrarAuditoria({
    usuarioId: session.user.id,
    entidade: "credencial",
    entidadeId: salvo.id,
    acao: anterior ? "update" : "create",
    antes: anterior ? { chave: alvo.chave, ultimos4: anterior.ultimos4 } : null,
    depois: { chave: alvo.chave, ultimos4: sufixo(valor) },
  });

  revalidatePath(ROTA);
  return { ok: true, message: `Chave da ${alvo.def.rotulo} salva (····${sufixo(valor)}).` };
}

export async function testarCredencial(
  _prev: CredencialState,
  formData: FormData,
): Promise<CredencialState> {
  const session = await exigirGestor();
  if (!session) return { error: "Não autorizado" };

  const alvo = chaveGerenciavel(formData);
  if (!alvo?.def.teste) return { error: "Esta integração não tem teste automático." };

  const valor = await getCredencial(alvo.chave, { semCache: true });
  if (!valor) return { error: `Nenhuma chave configurada para ${alvo.def.rotulo}.` };

  const resultado = await testarChave(alvo.def.teste, valor);
  return resultado.ok ? { ok: true, message: resultado.detalhe } : { error: resultado.erro };
}

/** Action de argumento simples (como cancelarInscricao) — usada direto em <form action>. */
export async function removerCredencial(formData: FormData): Promise<void> {
  const session = await exigirGestor();
  if (!session) return;

  const alvo = chaveGerenciavel(formData);
  if (!alvo) return;

  const admin = createAdminClient();
  const { data: anterior } = await admin
    .from("credencial")
    .select("id, ultimos4")
    .eq("chave", alvo.chave)
    .maybeSingle();
  if (!anterior) return;

  const { error } = await admin.from("credencial").delete().eq("id", anterior.id);
  if (error) {
    console.error("[credenciais] remover falhou:", alvo.chave, error.message);
    return;
  }

  invalidarCacheCredencial(alvo.chave);
  await registrarAuditoria({
    usuarioId: session.user.id,
    entidade: "credencial",
    entidadeId: anterior.id,
    acao: "delete",
    antes: { chave: alvo.chave, ultimos4: anterior.ultimos4 },
    depois: null,
  });
  revalidatePath(ROTA);
}
