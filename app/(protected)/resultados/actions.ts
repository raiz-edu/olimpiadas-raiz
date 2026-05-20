"use server";

import { revalidatePath } from "next/cache";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { can } from "@/lib/auth/roles";

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
// REGISTRAR OU ATUALIZAR RESULTADO (upsert por inscricao_id + fase_id)
// ---------------------------------------------------------------------------

export async function salvarResultado(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "resultado:create")) return;

  const resultado_id = (formData.get("resultado_id") as string) || null;
  const inscricao_id = formData.get("inscricao_id") as string;
  const fase_id = formData.get("fase_id") as string;
  const tipo = formData.get("tipo") as Database["public"]["Enums"]["tipo_resultado"];
  const pontuacao_str = (formData.get("pontuacao") as string)?.trim();
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;
  const pontuacao = pontuacao_str ? parseFloat(pontuacao_str) : null;

  if (!inscricao_id || !fase_id || !tipo) return;

  if (resultado_id) {
    // Atualizar existente
    await supabase
      .from("resultado")
      .update({ tipo, pontuacao, observacoes, registrado_por: user.id })
      .eq("id", resultado_id);
  } else {
    // Inserir novo
    await supabase
      .from("resultado")
      .insert({ inscricao_id, fase_id, tipo, pontuacao, observacoes, registrado_por: user.id });
  }

  revalidatePath("/resultados");
}

// ---------------------------------------------------------------------------
// REMOVER RESULTADO
// ---------------------------------------------------------------------------

export async function removerResultado(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "resultado:delete")) return;

  const id = formData.get("id") as string;
  await supabase.from("resultado").delete().eq("id", id);
  revalidatePath("/resultados");
}
