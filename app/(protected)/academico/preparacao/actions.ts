"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";

const BUCKET = "preparacao-materiais";
const PATH = "/academico/preparacao";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

export type ProjetoState = { error: string } | { ok: true } | null;
export type AulaState = { error: string } | { ok: true } | null;
export type MaterialState = { error: string } | { ok: true } | null;

// ─── Projetos ─────────────────────────────────────────────────────────────────

export async function criarProjeto(_prev: ProjetoState, formData: FormData): Promise<ProjetoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:create")) return { error: "Não autorizado" };

  const sigla = (formData.get("olimpiada_sigla") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ano = Number(formData.get("ano_letivo")) || new Date().getFullYear();
  const series = formData.getAll("series_elegiveis") as string[];

  if (!sigla || !nome) return { error: "Olimpíada e nome são obrigatórios" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_projeto")

    .insert({
      olimpiada_sigla: sigla,
      nome,
      descricao,
      ano_letivo: ano,
      series_elegiveis: series,
    } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

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
  if (!session || !can(session.user.role, "projeto:update")) return { error: "Não autorizado" };

  const sigla = (formData.get("olimpiada_sigla") as string)?.trim();
  const nome = (formData.get("nome") as string)?.trim();
  const descricao = (formData.get("descricao") as string)?.trim() || null;
  const ano = Number(formData.get("ano_letivo")) || new Date().getFullYear();
  const series = formData.getAll("series_elegiveis") as string[];

  if (!sigla || !nome) return { error: "Olimpíada e nome são obrigatórios" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_projeto")

    .update({
      olimpiada_sigla: sigla,
      nome,
      descricao,
      ano_letivo: ano,
      series_elegiveis: series,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function excluirProjeto(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:delete")) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_projeto").delete().eq("id", id);
  revalidatePath(PATH);
}

// ─── Helper: datetime-local → ISO com offset BRT (-03:00) ────────────────────

function withBRT(dt: string | null): string | null {
  if (!dt) return null;
  // Se já tem offset ou é Z, não mexe
  if (dt.includes("+") || dt.endsWith("Z") || dt.match(/-\d{2}:\d{2}$/)) return dt;
  // "2026-05-27T08:00" → "2026-05-27T08:00:00-03:00"
  return dt.length === 16 ? `${dt}:00-03:00` : `${dt}-03:00`;
}

// ─── Helper: parse MM:SS → segundos ──────────────────────────────────────────

function parseDuracao(raw: string | null): number | null {
  if (!raw || !raw.trim()) return null;
  const t = raw.trim();
  const parts = t.split(":");
  if (parts.length === 3) {
    // H:MM:SS
    const h = parseInt(parts[0] ?? "0", 10) || 0;
    const m = parseInt(parts[1] ?? "0", 10) || 0;
    const s = parseInt(parts[2] ?? "0", 10) || 0;
    return h * 3600 + m * 60 + Math.min(s, 59);
  }
  if (parts.length === 2) {
    // MM:SS (retrocompatibilidade)
    const m = parseInt(parts[0] ?? "0", 10) || 0;
    const s = parseInt(parts[1] ?? "0", 10) || 0;
    return m * 60 + Math.min(s, 59);
  }
  const n = parseInt(t, 10);
  return isNaN(n) ? null : n * 60; // número puro = minutos
}

// ─── Aulas ────────────────────────────────────────────────────────────────────

export async function criarAula(
  projetoId: string,
  _prev: AulaState,
  formData: FormData,
): Promise<AulaState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:create")) return { error: "Não autorizado" };

  const titulo = (formData.get("titulo") as string)?.trim();
  const tipoRaw = formData.get("tipo") as string;
  const dataHora = withBRT((formData.get("data_hora") as string) || null);
  const duracao = parseDuracao(formData.get("duracao_minutos") as string);
  const link = (formData.get("link_aula") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  const modalidade_online =
    tipoRaw === "online"
      ? (((formData.get("modalidade_online") as string) || "gravada") as "ao_vivo" | "gravada")
      : null;

  if (!titulo) return { error: "Título é obrigatório" };
  if (!["online", "presencial", "simulado", "modulo"].includes(tipoRaw))
    return { error: "Tipo inválido" };
  const tipo = tipoRaw as "online" | "presencial" | "simulado" | "modulo";

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
    modalidade_online,
    data_hora: dataHora,
    duracao_minutos: duracao,
    link_aula: link,
    polos,
    descricao,
    ordem: (count ?? 0) + 1,
  } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

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
  if (!session || !can(session.user.role, "projeto:update")) return { error: "Não autorizado" };

  const titulo = (formData.get("titulo") as string)?.trim();
  const tipoRaw = formData.get("tipo") as string;
  const dataHora = withBRT((formData.get("data_hora") as string) || null);
  const duracao = parseDuracao(formData.get("duracao_minutos") as string);
  const link = (formData.get("link_aula") as string)?.trim() || null;
  const polos = (formData.get("polos") as string)?.trim() || null;
  const descricao = (formData.get("descricao") as string)?.trim() || null;

  const modalidade_online_upd =
    tipoRaw === "online"
      ? (((formData.get("modalidade_online") as string) || "gravada") as "ao_vivo" | "gravada")
      : null;

  if (!titulo) return { error: "Título é obrigatório" };
  if (!["online", "presencial", "simulado", "modulo"].includes(tipoRaw))
    return { error: "Tipo inválido" };
  const tipo = tipoRaw as "online" | "presencial" | "simulado" | "modulo";

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_aula")
    .update({
      titulo,
      tipo,
      modalidade_online: modalidade_online_upd,
      data_hora: dataHora,
      duracao_minutos: duracao,
      link_aula: link,
      polos,
      descricao,
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath(PATH);
  return { ok: true };
}

export async function excluirAula(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:delete")) return;
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
  if (!session || !can(session.user.role, "projeto:update")) return { error: "Não autorizado" };

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
  if (!session || !can(session.user.role, "projeto:delete")) return;
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
export type AulaQuestao = {
  id: string;
  aula_id: string;
  questao_id: string;
  ordem: number;
  questao: {
    id: string;
    olimpiada: string;
    nivel: string | null;
    fase: number;
    ano: number;
    numero: number;
    enunciado: string;
    topico: string | null;
    subtopico: string | null;
  };
};
export type Aula = {
  id: string;
  projeto_id: string;
  titulo: string;
  tipo: string;
  modalidade_online: "ao_vivo" | "gravada" | null;
  data_hora: string | null;
  duracao_minutos: number | null;
  link_aula: string | null;
  polos: string | null;
  descricao: string | null;
  publicada: boolean;
  ordem: number;
  criado_em: string;
  materiais: Material[];
  questoes: AulaQuestao[];
};
export type Projeto = {
  id: string;
  olimpiada_sigla: string;
  olimpiada_id: string | null;
  nome: string;
  descricao: string | null;
  ano_letivo: number;
  publicado: boolean;
  ativo: boolean;
  criado_em: string;
  series_elegiveis: string[];
  aulas: Aula[];
};

export async function getProjetos(): Promise<Projeto[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("preparacao_projeto")
    .select(
      `*, aulas:preparacao_aula(*, materiais:preparacao_material(*), questoes:preparacao_aula_questao(*, questao:questao_id(id, olimpiada, nivel, fase, ano, numero, enunciado, topico, subtopico)))`,
    )
    .eq("ativo", true)
    .order("criado_em", { ascending: false });

  return (data ?? []) as unknown as Projeto[];
}

// ─── Publicação ───────────────────────────────────────────────────────────────

export async function publicarProjeto(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_projeto").update({ publicado: true }).eq("id", id);
  revalidatePath(PATH);
}

export async function despublicarProjeto(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_projeto").update({ publicado: false }).eq("id", id);
  revalidatePath(PATH);
}

export async function publicarAula(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_aula").update({ publicada: true }).eq("id", id);
  revalidatePath(PATH);
}

export async function despublicarAula(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return;
  const supabase = createAdminClient();
  await supabase.from("preparacao_aula").update({ publicada: false }).eq("id", id);
  revalidatePath(PATH);
}

// ─── Questões vinculadas à aula ───────────────────────────────────────────────

function parseBlocosPrep(raw: string | null): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function criarQuestaoParaAula(
  aulaId: string,
  _prev: AulaState,
  formData: FormData,
): Promise<AulaState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:create")) return { error: "Não autorizado" };

  const olimpiada = (formData.get("olimpiada") as string) ?? "";
  const nivel = (formData.get("nivel") as string) || null;
  const fase = Number(formData.get("fase")) || 0;
  const ano = Number(formData.get("ano")) || new Date().getFullYear();
  const numero = Number(formData.get("numero")) || 0;
  const enunciado = ((formData.get("enunciado") as string) ?? "").trim();
  const enunciado_blocos = parseBlocosPrep(formData.get("enunciado_blocos") as string);
  const topico = ((formData.get("topico") as string) ?? "").trim() || null;
  const subtopico = ((formData.get("subtopico") as string) ?? "").trim() || null;
  const tipo = (formData.get("tipo") as string) || "multipla_escolha";

  const supabase = createAdminClient();

  const { data: questao, error: qErr } = await supabase
    .from("questao")
    .insert({
      olimpiada,
      nivel,
      fase,
      ano,
      numero,
      enunciado,
      enunciado_blocos,
      topico,
      subtopico,
      tipo,
    } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
    .select("id")
    .single();

  if (qErr) return { error: qErr.message };

  const { error: lErr } = await supabase
    .from("preparacao_aula_questao")
    .insert({ aula_id: aulaId, questao_id: questao.id } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

  if (lErr) return { error: lErr.message };

  revalidatePath(PATH);
  return { ok: true };
}

export async function removerQuestaoAula(aulaId: string, questaoId: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return;
  const supabase = createAdminClient();
  await supabase
    .from("preparacao_aula_questao")
    .delete()
    .eq("aula_id", aulaId)
    .eq("questao_id", questaoId);
  revalidatePath(PATH);
}

export type QuestaoResumo = {
  id: string;
  olimpiada: string;
  nivel: string | null;
  fase: number;
  ano: number;
  numero: number;
  enunciado: string;
  topico: string | null;
  subtopico: string | null;
  tipo: string;
  usos: number;
};

export async function buscarQuestoesBanco(
  busca: string,
  origem?: string,
  topico?: string,
): Promise<QuestaoResumo[]> {
  const session = await getServerSession();
  if (!session) return [];

  const supabase = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("questao")
    .select("id, olimpiada, nivel, fase, ano, numero, enunciado, topico, subtopico, tipo")
    .eq("ativo", true)
    .order("olimpiada")
    .order("fase")
    .order("ano")
    .order("numero")
    .limit(30);

  if (origem) query = query.eq("olimpiada", origem);
  if (topico) query = query.ilike("topico", `%${topico}%`);
  if (busca) query = query.ilike("enunciado", `%${busca}%`);

  const { data } = await query;
  if (!data?.length) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ids = (data as any[]).map((q) => q.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usos } = await (supabase as any)
    .from("preparacao_aula_questao")
    .select("questao_id, aula_id")
    .in("questao_id", ids);

  const usoCount: Record<string, Set<string>> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const u of (usos ?? []) as any[]) {
    if (!usoCount[u.questao_id]) usoCount[u.questao_id] = new Set();
    usoCount[u.questao_id]!.add(u.aula_id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((q) => ({
    ...q,
    usos: usoCount[q.id]?.size ?? 0,
  })) as QuestaoResumo[];
}

export async function vincularQuestaoExistente(
  aulaId: string,
  questaoId: string,
): Promise<{ ok: true } | { error: string }> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "projeto:update")) return { error: "Não autorizado" };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("preparacao_aula_questao")
    .insert({ aula_id: aulaId, questao_id: questaoId } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

  if (error) {
    if (error.code === "23505") return { error: "Questão já vinculada a esta aula." };
    return { error: error.message };
  }

  revalidatePath(PATH);
  return { ok: true };
}
