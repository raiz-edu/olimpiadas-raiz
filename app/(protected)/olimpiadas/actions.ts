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

function int(v: string | null): number | null {
  if (!v || v.trim() === "") return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

// ---------------------------------------------------------------------------
// OLIMPÍADA — CREATE
// ---------------------------------------------------------------------------

export async function criarOlimpiada(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:create")) return { error: "Sem permissão." };

  const nome = (formData.get("nome") as string)?.trim();
  const area_conhecimento = (formData.get("area_conhecimento") as string)?.trim();
  const classificacao = formData.get("classificacao") as "obrigatoria" | "facultativa";
  const ano_letivo_str = formData.get("ano_letivo") as string;
  const organizacao_promotora = (formData.get("organizacao_promotora") as string)?.trim() || null;
  const premiacao = (formData.get("premiacao") as string)?.trim() || null;
  const regulamento_link_externo =
    (formData.get("regulamento_link_externo") as string)?.trim() || null;
  const faixa_etaria_min = int(formData.get("faixa_etaria_min") as string);
  const faixa_etaria_max = int(formData.get("faixa_etaria_max") as string);
  const limite_vagas_total = int(formData.get("limite_vagas_total") as string);
  const series_elegiveis = (formData.getAll("series_elegiveis") as string[]).filter(Boolean);

  if (!nome) return { error: "Nome é obrigatório." };
  if (!area_conhecimento) return { error: "Área do conhecimento é obrigatória." };
  if (!classificacao) return { error: "Classificação é obrigatória." };
  if (!ano_letivo_str) return { error: "Ano letivo é obrigatório." };

  const ano_letivo = parseInt(ano_letivo_str, 10);

  if (
    faixa_etaria_min !== null &&
    faixa_etaria_max !== null &&
    faixa_etaria_max < faixa_etaria_min
  ) {
    return { error: "Faixa etária máxima deve ser maior ou igual à mínima." };
  }

  const { data: olimpiada, error } = await supabase
    .from("olimpiada")
    .insert({
      nome,
      area_conhecimento,
      classificacao,
      ano_letivo,
      organizacao_promotora,
      premiacao,
      regulamento_link_externo,
      faixa_etaria_min,
      faixa_etaria_max,
      limite_vagas_total,
      series_elegiveis,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Erro ao criar olimpíada." };

  revalidatePath("/olimpiadas");
  redirect(`/olimpiadas/${olimpiada.id}`);
}

// ---------------------------------------------------------------------------
// OLIMPÍADA — UPDATE
// ---------------------------------------------------------------------------

export async function atualizarOlimpiada(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:update")) return { error: "Sem permissão." };

  const id = formData.get("id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const area_conhecimento = (formData.get("area_conhecimento") as string)?.trim();
  const classificacao = formData.get("classificacao") as "obrigatoria" | "facultativa";
  const ano_letivo_str = formData.get("ano_letivo") as string;
  const organizacao_promotora = (formData.get("organizacao_promotora") as string)?.trim() || null;
  const premiacao = (formData.get("premiacao") as string)?.trim() || null;
  const regulamento_link_externo =
    (formData.get("regulamento_link_externo") as string)?.trim() || null;
  const faixa_etaria_min = int(formData.get("faixa_etaria_min") as string);
  const faixa_etaria_max = int(formData.get("faixa_etaria_max") as string);
  const limite_vagas_total = int(formData.get("limite_vagas_total") as string);
  const series_elegiveis = (formData.getAll("series_elegiveis") as string[]).filter(Boolean);
  const ativo = formData.get("ativo") === "true";

  if (!nome) return { error: "Nome é obrigatório." };
  if (!area_conhecimento) return { error: "Área do conhecimento é obrigatória." };

  if (
    faixa_etaria_min !== null &&
    faixa_etaria_max !== null &&
    faixa_etaria_max < faixa_etaria_min
  ) {
    return { error: "Faixa etária máxima deve ser maior ou igual à mínima." };
  }

  const ano_letivo = ano_letivo_str ? parseInt(ano_letivo_str, 10) : undefined;

  const { error } = await supabase
    .from("olimpiada")
    .update({
      nome,
      area_conhecimento,
      classificacao,
      ...(ano_letivo !== undefined ? { ano_letivo } : {}),
      organizacao_promotora,
      premiacao,
      regulamento_link_externo,
      faixa_etaria_min,
      faixa_etaria_max,
      limite_vagas_total,
      series_elegiveis,
      ativo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { error: "Erro ao atualizar olimpíada." };

  revalidatePath("/olimpiadas");
  revalidatePath(`/olimpiadas/${id}`);
  redirect(`/olimpiadas/${id}`);
}

// ---------------------------------------------------------------------------
// OLIMPÍADA — TOGGLE ATIVO
// ---------------------------------------------------------------------------

export async function toggleOlimpiadaAtivo(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:update")) return;

  const id = formData.get("id") as string;
  const ativo = formData.get("ativo") === "true";

  await supabase.from("olimpiada").update({ ativo: !ativo }).eq("id", id);
  revalidatePath("/olimpiadas");
}

// ---------------------------------------------------------------------------
// OLIMPÍADA_MARCA — vincular / desvincular marcas
// ---------------------------------------------------------------------------

export async function vincularMarca(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:update")) return;

  const olimpiada_id = formData.get("olimpiada_id") as string;
  const marca_id = formData.get("marca_id") as string;
  const action = formData.get("action") as string;

  if (action === "add") {
    await supabase.from("olimpiada_marca").insert({ olimpiada_id, marca_id });
  } else {
    await supabase
      .from("olimpiada_marca")
      .delete()
      .eq("olimpiada_id", olimpiada_id)
      .eq("marca_id", marca_id);
  }
  revalidatePath(`/olimpiadas/${olimpiada_id}`);
}

// ---------------------------------------------------------------------------
// OLIMPÍADA_FASE — criar fase
// ---------------------------------------------------------------------------

export async function criarFase(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Não autenticado." };

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:update")) return { error: "Sem permissão." };

  const olimpiada_id = formData.get("olimpiada_id") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const tipo = formData.get("tipo") as Database["public"]["Enums"]["tipo_fase"];
  const data_inicio = formData.get("data_inicio") as string;
  const data_fim = formData.get("data_fim") as string;
  const ordem_str = formData.get("ordem") as string;
  const observacoes = (formData.get("observacoes") as string)?.trim() || null;

  if (!nome) return { error: "Nome da fase é obrigatório." };
  if (!tipo) return { error: "Tipo é obrigatório." };
  if (!data_inicio || !data_fim) return { error: "Datas de início e fim são obrigatórias." };
  if (data_fim < data_inicio) return { error: "Data de fim deve ser posterior à data de início." };

  const ordem = ordem_str ? parseInt(ordem_str, 10) : 1;

  const { error } = await supabase
    .from("olimpiada_fase")
    .insert({ olimpiada_id, nome, tipo, data_inicio, data_fim, ordem, observacoes });

  if (error) return { error: "Erro ao criar fase." };

  revalidatePath(`/olimpiadas/${olimpiada_id}`);
  return null;
}

// ---------------------------------------------------------------------------
// OLIMPÍADA_FASE — excluir fase
// ---------------------------------------------------------------------------

export async function excluirFase(formData: FormData) {
  const supabase = await makeClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: me } = await supabase.from("usuario").select("role").eq("id", user.id).single();
  if (!me || !can(me.role, "olimpiada:update")) return;

  const id = formData.get("id") as string;
  const olimpiada_id = formData.get("olimpiada_id") as string;

  await supabase.from("olimpiada_fase").delete().eq("id", id);
  revalidatePath(`/olimpiadas/${olimpiada_id}`);
}
