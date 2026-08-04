"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { can, podeGerirApostilas } from "@/lib/auth/roles";
import { validarReceita, type ReceitaConfig } from "@/lib/apostilas/receita";
import { contarAcervoCore, NOME_MODULO_CHAVE, type ContagemSecao } from "@/lib/apostilas/queries";

export type ReceitaState = { error: string } | { ok: true; id: string } | null;

async function requireLeitura() {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "apostila:read")) {
    throw new Error("Não autorizado");
  }
  return session;
}

async function requireGestor() {
  const session = await getServerSession();
  if (!session || !podeGerirApostilas(session.user.role, session.user.email)) {
    throw new Error("Não autorizado a gerir apostilas");
  }
  return session;
}

function parseConfig(formData: FormData): { config: ReceitaConfig } | { error: string } {
  const bruto = formData.get("config");
  if (typeof bruto !== "string" || !bruto) return { error: "Configuração ausente." };
  let config: ReceitaConfig;
  try {
    config = JSON.parse(bruto) as ReceitaConfig;
  } catch {
    return { error: "Configuração inválida (JSON malformado)." };
  }
  const erros = validarReceita(config);
  if (erros.length) return { error: erros.join(" ") };
  return { config };
}

export async function salvarReceita(
  _prev: ReceitaState,
  formData: FormData,
): Promise<ReceitaState> {
  const session = await requireGestor();
  const parsed = parseConfig(formData);
  if ("error" in parsed) return { error: parsed.error };
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return { error: "Nome da receita é obrigatório." };
  const id = String(formData.get("id") ?? "").trim();

  const admin = createAdminClient();
  const registro = {
    nome,
    titulo: parsed.config.titulo,
    subtitulo: parsed.config.subtitulo ?? null,
    config: parsed.config,
  };
  let receitaId = id;
  if (id) {
    const { error } = await admin
      .from("apostila_receita")
      .update({ ...registro, atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data, error } = await admin
      .from("apostila_receita")
      .insert({ ...registro, criado_por: session.user.id })
      .select("id")
      .single();
    if (error || !data) return { error: error?.message ?? "Falha ao criar receita." };
    receitaId = data.id;
  }
  revalidatePath("/academico/apostilas");
  redirect(`/academico/apostilas/${receitaId}`);
}

export async function excluirReceita(formData: FormData): Promise<void> {
  await requireGestor();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const admin = createAdminClient();
  const { error } = await admin.from("apostila_receita").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/academico/apostilas");
  redirect("/academico/apostilas");
}

/** Contadores ao vivo do construtor (qualquer leitor pode consultar). */
export async function contarAcervo(config: ReceitaConfig): Promise<ContagemSecao[]> {
  await requireLeitura();
  return contarAcervoCore(config);
}

export async function salvarNomeModulo(formData: FormData): Promise<void> {
  await requireGestor();
  const valor = String(formData.get("nome_modulo") ?? "").trim();
  if (!valor) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("configuracao_sistema")
    .upsert({ chave: NOME_MODULO_CHAVE, valor, atualizado_em: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/academico/apostilas");
  revalidatePath("/", "layout");
}
