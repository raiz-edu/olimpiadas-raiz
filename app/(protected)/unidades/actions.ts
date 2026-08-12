"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/auth/roles";

type ActionState = { error?: string } | null;

async function makeClient() {
  return createClient();
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function criarUnidade(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "unidade:create")) return { error: "Sem permissão." };

  const nome = (formData.get("nome") as string)?.trim();
  const marca_id = formData.get("marca_id") as string;
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };
  if (!marca_id) return { error: "Selecione uma marca." };

  const { error } = await supabase.from("unidade").insert({ nome, marca_id, cidade, estado });
  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma unidade com este nome nesta marca." };
    return { error: "Erro ao criar unidade." };
  }

  revalidatePath("/unidades");
  redirect("/unidades");
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function atualizarUnidade(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "unidade:update")) return { error: "Sem permissão." };

  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const cidade = (formData.get("cidade") as string)?.trim() || null;
  const estado = (formData.get("estado") as string)?.trim() || null;
  const ativo = formData.get("ativo") === "true";

  if (!nome) return { error: "Nome é obrigatório." };

  const { error } = await supabase
    .from("unidade")
    .update({ nome, cidade, estado, ativo })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar unidade." };

  revalidatePath("/unidades");
  redirect("/unidades");
}

// ---------------------------------------------------------------------------
// TOGGLE ATIVO (ação inline na lista)
// ---------------------------------------------------------------------------

export async function toggleUnidadeAtivo(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "unidade:update")) return;

  const id = formData.get("id") as string;
  const ativo = formData.get("ativo") === "true";

  await supabase.from("unidade").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/unidades");
}
