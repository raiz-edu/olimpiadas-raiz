"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";

const BUCKET = "preparacao-materiais";
const PATH = "/academico/preparacao";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

export type ProjetoState = { error: string } | { ok: true } | null;
export type AulaState = { error: string } | { ok: true } | null;
export type MaterialState = { error: string } | { ok: true } | null;

// ─── Projetos ─────────────────────────────────────────────────────────────────

export async function criarProjeto(_prev: ProjetoState, formData: FormData): Promise<ProjetoState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const sigla = (formData.get("olimpiada_sigla") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ano = Number(formData.get("ano_letivo")) || new Date().getFullYear();

  if (!sigla || !nome) return { error: "Olimpíada e nome são obrigatórios" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_projeto")
    .insert({ olimpiada_sigla: sigla, nome, descricao, ano_letivo: ano });

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function atualizarProjeto(
  id: string,
  _prev: ProjetoState,
  formData: FormData,
): Promise<ProjetoState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const sigla = (formData.get("olimpiada_sigla") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ano = Number(formData.get("ano_letivo")) || new Date().getFullYear();

  if (!sigla || !nome) return { error: "Olimpíada e nome são obrigatórios" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_projeto")
    .update({ olimpiada_sigla: sigla, nome, descricao, ano_letivo: ano })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function excluirProjeto(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_projeto").delete().eq("id", id);
  revalidatePath(PATH);
}

// ─── Aulas ────────────────────────────────────────────────────────────────────

export async function criarAula(
  projetoId: string,
  _prev: AulaState,
  formData: FormData,
): Promise<AulaState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const titulo = (formData.get("titulo") as string)?.trim();
  const tipoRaw = formData.get("tipo") as string;
  const dataHora = (formData.get("data_hora") as string) || null;
  const duracao = Number(formData.get("duracao_minutos")) || null;
  const link = (formData.get("link_aula") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  if (!titulo) return { error: "Título é obrigatório" };
  if (!["online", "presencial", "simulado"].includes(tipoRaw)) return { error: "Tipo inválido" };
  const tipo = tipoRaw as "online" | "presencial" | "simulado";

  const supabase = createAdminClient();

  // Próxima ordem
  const { count } = await supabase
    .from("preparacao_aula")
    .select("id", { count: "exact", head: true })
    .eq("projeto_id", projetoId);

  const { error } = await supabase.from("preparacao_aula").insert({
    projeto_id: projetoId,
    titulo,
    tipo,
    data_hora: dataHora,
    duracao_minutos: duracao,
    link_aula: link,
    polos,
    descricao,
    ordem: (count ?? 0) + 1,
  });

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function atualizarAula(
  id: string,
  _prev: AulaState,
  formData: FormData,
): Promise<AulaState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const titulo = (formData.get("titulo") as string)?.trim();
  const tipoRaw = formData.get("tipo") as string;
  const dataHora = (formData.get("data_hora") as string) || null;
  const duracao = Number(formData.get("duracao_minutos")) || null;
  const link = (formData.get("link_aula") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  if (!titulo) return { error: "Título é obrigatório" };
  if (!["online", "presencial", "simulado"].includes(tipoRaw)) return { error: "Tipo inválido" };
  const tipo = tipoRaw as "online" | "presencial" | "simulado";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_aula")
    .update({
      titulo,
      tipo,
      data_hora: dataHora,
      duracao_minutos: duracao,
      link_aula: link,
      polos,
      descricao,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function excluirAula(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_aula").delete().eq("id", id);
  revalidatePath(PATH);
}

// ─── Materiais ────────────────────────────────────────────────────────────────

async function ensureBucket() {
  const supabase = createAdminClient();
  await supabase.storage.createBucket(BUCKET, { public: false, fileSizeLimit: 20971520 });
}

export async function uploadMaterial(
  aulaId: string,
  _prev: MaterialState,
  formData: FormData,
): Promise<MaterialState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Selecione um arquivo" };

  await ensureBucket();

  const supabase = createAdminClient();
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${aulaId}/${timestamp}-${safeName}`;

  const bytes = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (upErr) return { error: upErr.message };

  const { error: dbErr } = await supabase.from("preparacao_material").insert({
    aula_id: aulaId,
    nome: file.name,
    arquivo_path: path,
  });

  if (dbErr) {
    await supabase.storage.from(BUCKET).remove([path]);
    return { error: dbErr.message };
  }

  revalidatePath(PATH);
  return { ok: true };
}

export async function excluirMaterial(id: string, path: string): Promise<void> {
  const session = await getServerSession();
  if (!session) return;
  const supabase = createAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
  await supabase.from("preparacao_material").delete().eq("id", id);
  revalidatePath(PATH);
}

export async function getMaterialUrl(path: string): Promise<string | null> {
  const supabase = createAdminClient();
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}

// ─── Leitura de dados ─────────────────────────────────────────────────────────

export type Material = { id: string; nome: string; arquivo_path: string; criado_em: string };
export type Aula = {
  id: string;
  projeto_id: string;
  titulo: string;
  tipo: string;
  data_hora: string | null;
  duracao_minutos: number | null;
  link_aula: string | null;
  polos: string | null;
  descricao: string | null;
  ordem: number;
  criado_em: string;
  materiais: Material[];
};
export type Projeto = {
  id: string;
  olimpiada_sigla: string;
  nome: string;
  descricao: string | null;
  ano_letivo: number;
  ativo: boolean;
  criado_em: string;
  aulas: Aula[];
};

export async function getProjetos(): Promise<Projeto[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("preparacao_projeto")
    .select(`*, aulas:preparacao_aula(*, materiais:preparacao_material(*))`)
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  return (data ?? []) as unknown as Projeto[];
}
