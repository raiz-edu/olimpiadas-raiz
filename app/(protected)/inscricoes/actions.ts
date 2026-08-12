"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { can } from "@/lib/auth/roles";

type ActionState = { error?: string; success?: string } | null;

async function makeClient() {
  return createClient();
}

// ---------------------------------------------------------------------------
// INSCREVER ALUNO (usa RPC com lock para respeitar limite de vagas)
// ---------------------------------------------------------------------------

export async function inscreverAluno(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "inscricao:create")) return { error: "Sem permissão." };

  const olimpiada_id = formData.get("olimpiada_id") as string;
  const aluno_id = formData.get("aluno_id") as string;

  if (!olimpiada_id) return { error: "Selecione uma olimpíada." };
  if (!aluno_id) return { error: "Selecione um aluno." };

  const { error } = await supabase.rpc("inscrever_com_lock", {
    p_olimpiada_id: olimpiada_id,
    p_aluno_id: aluno_id,
    p_usuario_id: user.id,
  });

  if (error) {
    if (error.message?.includes("já inscrito") || error.code === "23505") {
      return { error: "Este aluno já está inscrito nesta olimpíada." };
    }
    if (error.message?.includes("vagas")) {
      return { error: "Não há vagas disponíveis nesta olimpíada." };
    }
    return { error: "Erro ao realizar inscrição." };
  }

  revalidatePath("/inscricoes");
  redirect("/inscricoes");
}

// ---------------------------------------------------------------------------
// CONFIRMAR INSCRIÇÃO
// ---------------------------------------------------------------------------

export async function confirmarInscricao(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "inscricao:update")) return;

  const id = formData.get("id") as string;
  await supabase.from("inscricao").update({ status: "confirmada" }).eq("id", id);
  revalidatePath("/inscricoes");
}

// ---------------------------------------------------------------------------
// CANCELAR INSCRIÇÃO
// ---------------------------------------------------------------------------

export async function cancelarInscricao(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "inscricao:update")) return;

  const id = formData.get("id") as string;
  const motivo = (formData.get("motivo") as string)?.trim() || null;

  await supabase
    .from("inscricao")
    .update({
      status: "cancelada",
      cancelado_em: new Date().toISOString(),
      cancelado_motivo: motivo,
    })
    .eq("id", id);

  revalidatePath("/inscricoes");
}
