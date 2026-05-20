"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { can } from "@/lib/auth/roles";

type ActionState = { error?: string } | null;

async function makeClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: Array<{ name: string; value: string; options: CookieOptions }>) =>
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  );
}

// ---------------------------------------------------------------------------
// CREATE
// ---------------------------------------------------------------------------

export async function criarAluno(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "aluno:create")) return { error: "Sem permissão." };

  const nome = (formData.get("nome") as string)?.trim();
  const turma_id = formData.get("turma_id") as string;
  const data_nascimento = (formData.get("data_nascimento") as string)?.trim();
  const cpf = (formData.get("cpf") as string)?.trim() || null;

  if (!nome) return { error: "Nome é obrigatório." };
  if (!turma_id) return { error: "Selecione uma turma." };
  if (!data_nascimento) return { error: "Data de nascimento é obrigatória." };

  const { error } = await supabase.from("aluno").insert({ nome, turma_id, data_nascimento, cpf });

  if (error) {
    return { error: "Erro ao cadastrar aluno." };
  }

  revalidatePath("/alunos");
  redirect("/alunos");
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function atualizarAluno(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "aluno:update")) return { error: "Sem permissão." };

  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const data_nascimento = (formData.get("data_nascimento") as string)?.trim() || undefined;
  const cpf = (formData.get("cpf") as string)?.trim() || null;
  const ativo = formData.get("ativo") === "true";

  if (!nome) return { error: "Nome é obrigatório." };

  const { error } = await supabase
    .from("aluno")
    .update({ nome, ...(data_nascimento ? { data_nascimento } : {}), cpf, ativo })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar aluno." };

  revalidatePath("/alunos");
  redirect("/alunos");
}

// ---------------------------------------------------------------------------
// TOGGLE ATIVO
// ---------------------------------------------------------------------------

export async function toggleAlunoAtivo(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "aluno:update")) return;

  const id = formData.get("id") as string;
  const ativo = formData.get("ativo") === "true";

  await supabase.from("aluno").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/alunos");
}
