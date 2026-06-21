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
  nivel?: string;
  tipo?: string;
  dificuldade?: string;
  publico_alvo?: string;
  topico?: string;
  status_cadastro?: string;
  busca?: string;
}) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  let query = supabase
    .from("questao")
    .select(
      "id, olimpiada, nivel, fase, ano, numero, assunto, topico, subtopico, tipo, " +
        "dificuldade, publico_alvo, tem_resolucao_video, tem_resolucao_texto, status_cadastro, ativo, criado_em",
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
  if (filtros?.nivel) query = query.eq("nivel", filtros.nivel);
  if (filtros?.tipo) query = query.eq("tipo", filtros.tipo as TipoQuestao);
  if (filtros?.dificuldade) query = query.eq("dificuldade", filtros.dificuldade);
  if (filtros?.publico_alvo) query = query.eq("publico_alvo", filtros.publico_alvo);
  if (filtros?.topico) query = query.ilike("topico", `%${filtros.topico}%`);
  if (filtros?.status_cadastro) query = query.eq("status_cadastro", filtros.status_cadastro);
  if (filtros?.busca) {
    const termo = filtros.busca.replace(/[%_]/g, "\\$&");
    query = query.or(
      `enunciado.ilike.%${termo}%,topico.ilike.%${termo}%,subtopico.ilike.%${termo}%`,
    );
  }

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

  const { data: stats } = await supabase
    .from("resposta_aluno")
    .select("correta, alternativa_id")
    .eq("questao_id", id);

  return { questao, alternativas: alternativas ?? [], solucao, stats: stats ?? [] };
}

// ─── Busca por similaridade (pré-check de duplicatas) ────────────────────────

export async function buscarQuestoesSimilares(enunciado: string): Promise<{
  count: number;
  similares: {
    id: string;
    enunciado: string;
    olimpiada: string;
    ano: number;
    nivel: string | null;
  }[];
}> {
  const session = await getServerSession();
  if (!session || !can(session.user.role, "questao:read")) return { count: 0, similares: [] };

  const snippet = enunciado.trim().replace(/\s+/g, " ").slice(0, 80);
  if (snippet.length < 15) return { count: 0, similares: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Busca pelo trecho inicial do enunciado — detecta duplicatas óbvias
  const { data } = await supabase
    .from("questao")
    .select("id, enunciado, olimpiada, ano, nivel")
    .ilike("enunciado", `%${snippet.slice(0, 40)}%`)
    .limit(5);

  return { count: data?.length ?? 0, similares: data ?? [] };
}

// ─── Questão CRUD ────────────────────────────────────────────────────────────

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
  const enunciado = ((formData.get("enunciado") as string) ?? "").trim();
  const enunciado_blocos = parseBlocos((formData.get("enunciado_blocos") as string) ?? "");
  const topico = ((formData.get("topico") as string) ?? "").trim() || null;
  const subtopico = ((formData.get("subtopico") as string) ?? "").trim() || null;
  const tipo = (formData.get("tipo") as TipoQuestao) || "multipla_escolha";
  const dificuldade = (formData.get("dificuldade") as string) || null;
  const publico_alvo = (formData.get("publico_alvo") as string) || null;
  const tem_resolucao_video = (formData.get("tem_resolucao_video") as string) || "nao";
  const tem_resolucao_texto = (formData.get("tem_resolucao_texto") as string) || "nao";
  const video_url = ((formData.get("video_url") as string) ?? "").trim() || null;
  const solucao_blocos = parseBlocos((formData.get("solucao_blocos") as string) ?? "");
  const solucao_texto = solucao_blocos
    ? (solucao_blocos as { tipo: string; conteudo?: string }[])
        .filter((b) => b.tipo === "texto")
        .map((b) => b.conteudo ?? "")
        .join("\n\n") || null
    : null;

  const status_cadastro = "publicado";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // Validação de ID natural (olimpiada + ano + numero) — bloqueia duplicata exata
  if (olimpiada && ano && numero) {
    const { data: existente } = await supabase
      .from("questao")
      .select("id")
      .eq("olimpiada", olimpiada)
      .eq("ano", ano)
      .eq("numero", numero)
      .maybeSingle();
    if (existente) {
      return {
        error: `Já existe uma questão cadastrada: ${olimpiada} · ${ano} · Q${numero}. Edite a questão existente.`,
      };
    }
  }

  const { data, error } = await supabase
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
      dificuldade,
      publico_alvo,
      tem_resolucao_video,
      tem_resolucao_texto,
      video_url,
      status_cadastro,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (solucao_blocos || solucao_texto) {
    await supabase
      .from("solucao")
      .insert({ questao_id: data.id, blocos: solucao_blocos, texto: solucao_texto });
  }

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  const enunciado_blocos = parseBlocos((formData.get("enunciado_blocos") as string) ?? "");

  const { error } = await supabase
    .from("questao")
    .update({
      olimpiada: formData.get("olimpiada"),
      nivel: (formData.get("nivel") as string) || null,
      fase: ((f) => (f ? Number(f) : null))((formData.get("fase") as string)?.trim()),
      ano: Number(formData.get("ano")),
      numero: ((n) => (n ? Number(n) : null))((formData.get("numero") as string)?.trim()),
      enunciado: ((formData.get("enunciado") as string) ?? "").trim(),
      enunciado_blocos,
      imagem_url: null,
      topico: ((formData.get("topico") as string) ?? "").trim() || null,
      subtopico: ((formData.get("subtopico") as string) ?? "").trim() || null,
      tipo: formData.get("tipo"),
      dificuldade: (formData.get("dificuldade") as string) || null,
      publico_alvo: (formData.get("publico_alvo") as string) || null,
      tem_resolucao_video: (formData.get("tem_resolucao_video") as string) || "nao",
      tem_resolucao_texto: (formData.get("tem_resolucao_texto") as string) || "nao",
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

export async function aprovarQuestao(id: string) {
  const session = await getServerSession();
  if (!session || session.user.role !== "raiz") return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  await supabase.from("questao").update({ status_cadastro: "publicado" }).eq("id", id);
  revalidatePath("/academico/banco-questoes");
}

// ─── Validação de upload de imagem ───────────────────────────────────────────

const ALLOWED_IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp"]);
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

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
  const video_url = ((formData.get("video_url") as string) ?? "").trim() || null;
  const tem_resolucao_video = (formData.get("tem_resolucao_video") as string) || "nao";
  const tem_resolucao_texto = (formData.get("tem_resolucao_texto") as string) || "nao";
  const blocos = parseBlocos((formData.get("solucao_blocos") as string) ?? "");
  const texto = blocos
    ? (blocos as { tipo: string; conteudo?: string }[])
        .filter((b) => b.tipo === "texto")
        .map((b) => b.conteudo ?? "")
        .join("\n\n") || null
    : ((formData.get("solucao_texto") as string) ?? "").trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  await supabase
    .from("questao")
    .update({ video_url, tem_resolucao_video, tem_resolucao_texto })
    .eq("id", questao_id);

  const { error } = await supabase
    .from("solucao")
    .upsert({ questao_id, blocos, texto }, { onConflict: "questao_id" });

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
