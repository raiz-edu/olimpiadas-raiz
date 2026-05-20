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

export async function criarTurma(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "turma:create")) return { error: "Sem permissão." };

  const nome = (formData.get("nome") as string)?.trim();
  const unidade_id = formData.get("unidade_id") as string;
  const serie = (formData.get("serie") as string)?.trim();
  const ano_letivo_str = formData.get("ano_letivo") as string;

  if (!nome) return { error: "Nome é obrigatório." };
  if (!unidade_id) return { error: "Selecione uma unidade." };
  if (!serie) return { error: "Série / Nível é obrigatório." };
  if (!ano_letivo_str) return { error: "Ano letivo é obrigatório." };

  const ano_letivo = parseInt(ano_letivo_str, 10);

  const { error } = await supabase.from("turma").insert({ nome, unidade_id, serie, ano_letivo });

  if (error) {
    if (error.code === "23505")
      return { error: "Já existe uma turma com este nome nesta unidade neste ano." };
    return { error: "Erro ao criar turma." };
  }

  revalidatePath("/turmas");
  redirect("/turmas");
}

// ---------------------------------------------------------------------------
// UPDATE
// ---------------------------------------------------------------------------

export async function atualizarTurma(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "turma:update")) return { error: "Sem permissão." };

  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const serie = (formData.get("serie") as string)?.trim();
  const ano_letivo_str = formData.get("ano_letivo") as string;
  const ativo = formData.get("ativo") === "true";

  if (!nome) return { error: "Nome é obrigatório." };
  if (!serie) return { error: "Série / Nível é obrigatório." };

  const ano_letivo = ano_letivo_str ? parseInt(ano_letivo_str, 10) : undefined;

  const { error } = await supabase
    .from("turma")
    .update({ nome, serie, ...(ano_letivo !== undefined ? { ano_letivo } : {}), ativo })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar turma." };

  revalidatePath("/turmas");
  redirect("/turmas");
}

// ---------------------------------------------------------------------------
// TOGGLE ATIVO
// ---------------------------------------------------------------------------

export async function toggleTurmaAtivo(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "turma:update")) return;

  const id = formData.get("id") as string;
  const ativo = formData.get("ativo") === "true";

  await supabase.from("turma").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/turmas");
}
