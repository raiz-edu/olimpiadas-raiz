"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import type { TipoQuestao } from "@/lib/types/database";

export type QuestaoState = { error: string } | { ok: true; id?: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) {
    throw new Error("Não autorizado");
  }
  return session;
}

// ─── Listagem ────────────────────────────────────────────────────────────────

export async function getQuestoes(filtros?: {
  olimpiada?: string;
  fase?: number;
  ano?: number;
  assunto?: string;
  ativo?: boolean;
}) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  let query = supabase
    .from("questao")
    .select(
      "id, olimpiada, nivel, fase, ano, numero, assunto, topico, subtopico, tipo, ativo, criado_em",
    )
    .order("olimpiada")
    .order("fase")
    .order("ano")
    .order("numero");

  if (filtros?.olimpiada) query = query.eq("olimpiada", filtros.olimpiada);
  if (filtros?.fase) query = query.eq("fase", filtros.fase);
  if (filtros?.ano) query = query.eq("ano", filtros.ano);
  if (filtros?.assunto) query = query.ilike("assunto", `%${filtros.assunto}%`);
  if (filtros?.ativo !== undefined) query = query.eq("ativo", filtros.ativo);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getQuestaoDetalhe(id: string) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const [{ data: questao }, { data: alternativas }, { data: solucao }] = await Promise.all([
    supabase.from("questao").select("*").eq("id", id).single(),
    supabase.from("alternativa").select("*").eq("questao_id", id).order("letra"),
    supabase.from("solucao").select("*").eq("questao_id", id).maybeSingle(),
  ]);

  // Estatísticas de respostas
  const { data: stats } = await supabase
    .from("resposta_aluno")
    .select("correta, alternativa_id")
    .eq("questao_id", id);

  return { questao, alternativas: alternativas ?? [], solucao, stats: stats ?? [] };
}

// ─── Questão CRUD ────────────────────────────────────────────────────────────

// ─── Validação de upload de imagem ───────────────────────────────────────────

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

function validateImageFile(file: File): string | null {
  if (!file || file.size === 0) return "Nenhum arquivo enviado.";
  if (file.size > MAX_IMAGE_SIZE) return "Arquivo muito grande. Máximo 5 MB.";
  const ext = (file.name.split(".").pop() ?? "").toLowerCase();
  if (!ALLOWED_IMAGE_EXTS.has(ext)) return "Formato inválido. Use JPG, PNG, GIF ou WEBP.";
  if (!ALLOWED_MIME_TYPES.has(file.type)) return "Tipo de arquivo inválido.";
  return null;
}

async function uploadToStorage(
  prefix: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { error } = await supabase.storage
    .from("questoes")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    console.error("[upload] storage error:", error.message);
    return { error: "Erro ao enviar imagem. Tente novamente." };
  }
  const { data } = supabase.storage.from("questoes").getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function uploadQuestaoImagem(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) return { error: "Não autorizado" };
  const file = formData.get("file") as File;
  const err = validateImageFile(file);
  if (err) return { error: err };
  return uploadToStorage("enunciados", file);
}

export async function uploadAlternativaImagem(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) return { error: "Não autorizado" };
  const file = formData.get("file") as File;
  const err = validateImageFile(file);
  if (err) return { error: err };
  return uploadToStorage("alternativas", file);
}

export async function uploadSolucaoImagem(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) return { error: "Não autorizado" };
  const file = formData.get("file") as File;
  const err = validateImageFile(file);
  if (err) return { error: err };
  return uploadToStorage("solucoes", file);
}

function parseBlocos(raw: string): unknown | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function criarQuestao(_prev: QuestaoState, formData: FormData): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:create")) return { error: "Não autorizado" };

  const olimpiada = (formData.get("olimpiada") as string) ?? "";
  const nivel = (formData.get("nivel") as string) || null;
  const faseRaw = (formData.get("fase") as string)?.trim();
  const fase = faseRaw ? Number(faseRaw) : null;
  const ano = Number(formData.get("ano"));
  const numeroRaw = (formData.get("numero") as string)?.trim();
  const numero = numeroRaw ? Number(numeroRaw) : null;
  const categoria = ((formData.get("categoria") as string) ?? "").trim() || null;
  const enunciado = ((formData.get("enunciado") as string) ?? "").trim();
  const enunciado_blocos = parseBlocos((formData.get("enunciado_blocos") as string) ?? "");
  const topico = ((formData.get("topico") as string) ?? "").trim() || null;
  const subtopico = ((formData.get("subtopico") as string) ?? "").trim() || null;
  const tipo = (formData.get("tipo") as TipoQuestao) || "multipla_escolha";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { data, error } = await supabase
    .from("questao")
    .insert({
      olimpiada,
      nivel,
      fase,
      ano,
      numero,
      categoria,
      enunciado,
      enunciado_blocos,
      topico,
      subtopico,
      tipo,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/academico/banco-questoes");
  redirect(`/academico/banco-questoes/${data.id}`);
}

export async function atualizarQuestao(
  id: string,
  _prev: QuestaoState,
  formData: FormData,
): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  const enunciado_blocos = parseBlocos((formData.get("enunciado_blocos") as string) ?? "");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from("questao")
    .update({
      olimpiada: formData.get("olimpiada"),
      nivel: (formData.get("nivel") as string) || null,
      fase: ((f) => (f ? Number(f) : null))((formData.get("fase") as string)?.trim()),
      ano: Number(formData.get("ano")),
      numero: ((n) => (n ? Number(n) : null))((formData.get("numero") as string)?.trim()),
      categoria: ((formData.get("categoria") as string) ?? "").trim() || null,
      enunciado: ((formData.get("enunciado") as string) ?? "").trim(),
      enunciado_blocos,
      imagem_url: null, // limpa campo legado ao salvar com editor de blocos
      topico: ((formData.get("topico") as string) ?? "").trim() || null,
      subtopico: ((formData.get("subtopico") as string) ?? "").trim() || null,
      tipo: formData.get("tipo"),
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/academico/banco-questoes");
  revalidatePath(`/academico/banco-questoes/${id}`);
  return { ok: true };
}

export async function toggleAtivo(id: string, ativo: boolean) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("questao").update({ ativo }).eq("id", id);
  revalidatePath("/academico/banco-questoes");
}

// ─── Alternativas ────────────────────────────────────────────────────────────

export async function salvarAlternativa(
  _prev: QuestaoState,
  formData: FormData,
): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  const questao_id = formData.get("questao_id") as string;
  const letra = formData.get("letra") as string;
  const texto = ((formData.get("texto") as string) ?? "").trim() || null;
  const correta = formData.get("correta") === "true";
  const imagem_url = ((formData.get("imagem_url") as string) ?? "").trim() || null;
  const imagem_largura = ((formData.get("imagem_largura") as string) ?? "").trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Se correta, remove flag das outras
  if (correta) {
    await supabase.from("alternativa").update({ correta: false }).eq("questao_id", questao_id);
  }

  const { error } = await supabase
    .from("alternativa")
    .upsert(
      { questao_id, letra, texto, imagem_url, imagem_largura, correta },
      { onConflict: "questao_id,letra" },
    );

  if (error) return { error: error.message };
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
  return { ok: true };
}

export async function excluirAlternativa(id: string, questao_id: string) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("alternativa").delete().eq("id", id);
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
}

// ─── Solução ─────────────────────────────────────────────────────────────────

export async function salvarSolucao(
  _prev: QuestaoState,
  formData: FormData,
): Promise<QuestaoState> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:update")) return { error: "Não autorizado" };

  const questao_id = formData.get("questao_id") as string;
  const texto = ((formData.get("texto") as string) ?? "").trim() || null;
  const video_url = ((formData.get("video_url") as string) ?? "").trim() || null;
  const imagem_url = ((formData.get("imagem_url") as string) ?? "").trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  await supabase.from("questao").update({ video_url }).eq("id", questao_id);

  const { error } = await supabase
    .from("solucao")
    .upsert({ questao_id, texto, imagem_url }, { onConflict: "questao_id" });

  if (error) return { error: error.message };
  revalidatePath(`/academico/banco-questoes/${questao_id}`);
  return { ok: true };
}

// ─── Exclusão ────────────────────────────────────────────────────────────────

export async function excluirQuestao(formData: FormData) {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:delete")) return;

  const id = formData.get("id") as string;
  if (!id) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("questao").delete().eq("id", id);

  revalidatePath("/academico/banco-questoes");
  redirect("/academico/banco-questoes");
}
