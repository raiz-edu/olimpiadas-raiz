"use server";

import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Marcas elegíveis para o portal olímpico ──────────────────────────────────
// Alinhado com o requisito: do 1º ano EFAI à 3ª série do EM.
// O data engine filtra internamente pelo CODCOLIGADA correspondente a cada slug.
export const MARCAS_SYNC = [
  { slug: "americano", nome: "Americano", supabase_id: "11111111-0000-0000-0000-000000000006" },
  { slug: "apogeu", nome: "Apogeu", supabase_id: "11111111-0000-0000-0000-000000000001" },
  { slug: "uniao", nome: "União", supabase_id: "11111111-0000-0000-0000-000000000004" },
  { slug: "unificado", nome: "Unificado", supabase_id: "11111111-0000-0000-0000-000000000005" },
  { slug: "qi-bilingue", nome: "QI Bilíngue", supabase_id: "11111111-0000-0000-0000-000000000003" },
  {
    slug: "matriz-educacao",
    nome: "Matriz Educação",
    supabase_id: "11111111-0000-0000-0000-000000000002",
  },
] as const;

// Mapa slug → UUID para lookup rápido durante o upsert
const MARCA_UUID: Record<string, string> = Object.fromEntries(
  MARCAS_SYNC.map((m) => [m.slug, m.supabase_id]),
);

// ─── Tipos ────────────────────────────────────────────────────────────────────

// Contrato esperado do endpoint GET /educacional/alunos-olimpiadas
// Implementado no raiz-data-engine (Railway).
// Filtra automaticamente:
//   - Marcas: americano, apogeu, uniao, unificado, qi-bilingue, matriz-educacao
//   - Séries: 1º ano EFAI → 3ª série EM
//   - Status de matrícula: ativo
// Fonte: TOTVS Mirror (Neon) — tabelas s_aluno, p_pessoa, s_matricula, marca_coligada
export type AlunoDataEngine = {
  nome: string;
  email: string | null;
  cpf: string | null;
  data_nascimento: string; // YYYY-MM-DD
  serie: string; // ex: "5EF1", "9EF2", "1EM"
  marca_slug: string; // slug da marca (americano, apogeu, …)
  ra: string; // RA no TOTVS
  codcoligada: number; // CODCOLIGADA no TOTVS
};

type DataEngineResponse = {
  data: AlunoDataEngine[];
  total: number;
  page: number;
  hasMore: boolean;
};

export type SyncResult =
  | {
      total: number;
      novos: number;
      atualizados: number;
      sem_email: number;
      erros: string[];
    }
  | { error: string };

// ─── Action principal ─────────────────────────────────────────────────────────

export async function sincronizarAlunosTOTVS(): Promise<SyncResult> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const { role } = session.user;
  if (role !== "raiz" && role !== "direcao_marca") {
    return { error: "Permissão insuficiente para sincronizar alunos." };
  }

  const baseUrl = process.env.RAIZ_DATA_ENGINE_URL;
  const apiKey = process.env.RAIZ_DATA_ENGINE_TOKEN;

  if (!baseUrl) return { error: "RAIZ_DATA_ENGINE_URL não configurado." };
  if (!apiKey) return { error: "RAIZ_DATA_ENGINE_TOKEN não configurado." };

  const supabase = createAdminClient();
  let novos = 0;
  let atualizados = 0;
  let sem_email = 0;
  const erros: string[] = [];
  let totalFetched = 0;
  let page = 0;
  const limit = 500;

  while (true) {
    let resp: DataEngineResponse;

    try {
      const url = `${baseUrl}/educacional/alunos-olimpiadas?page=${page}&limit=${limit}`;
      const res = await fetch(url, {
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { error: `Data Engine retornou ${res.status}: ${body.slice(0, 200)}` };
      }

      resp = await res.json();
    } catch (err) {
      return { error: `Falha na conexão com raiz-data-engine: ${String(err)}` };
    }

    const alunos = Array.isArray(resp) ? (resp as AlunoDataEngine[]) : (resp.data ?? []);
    if (alunos.length === 0) break;
    totalFetched += alunos.length;

    for (const a of alunos) {
      if (!a.nome) continue;

      // Alunos sem e-mail não podem receber link de acesso — pular
      if (!a.email) {
        sem_email++;
        continue;
      }

      const marcaUuid = MARCA_UUID[a.marca_slug];
      if (!marcaUuid) {
        erros.push(`Marca desconhecida "${a.marca_slug}" para ${a.nome}`);
        continue;
      }

      // Deduplicação: RA+CODCOLIGADA (primário) ou e-mail (secundário)
      const { data: existente } = await supabase
        .from("aluno")
        .select("id, supabase_auth_id, email")
        .or(`and(ra_totvs.eq.${a.ra},codcoligada_totvs.eq.${a.codcoligada}),email.eq.${a.email}`)
        .maybeSingle();

      if (existente) {
        // Atualiza dados acadêmicos e de contato
        await supabase
          .from("aluno")
          .update({
            nome: a.nome,
            email: a.email,
            serie: a.serie,
            marca_id: marcaUuid,
            ra_totvs: a.ra,
            codcoligada_totvs: a.codcoligada,
          })
          .eq("id", existente.id);
        atualizados++;
        continue;
      }

      // ── Aluno novo: criar conta no Supabase Auth ──────────────────────────
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: a.email,
        email_confirm: true,
        user_metadata: { nome: a.nome, tipo: "aluno" },
      });

      if (authErr || !authData.user) {
        erros.push(`Erro ao criar auth para ${a.email}: ${authErr?.message ?? "desconhecido"}`);
        continue;
      }

      // Inserir na tabela aluno
      const { error: insertErr } = await supabase.from("aluno").insert({
        nome: a.nome,
        email: a.email,
        cpf: a.cpf ?? null,
        data_nascimento: a.data_nascimento,
        supabase_auth_id: authData.user.id,
        consentimento_responsavel: false,
        ativo: true,
        serie: a.serie,
        marca_id: marcaUuid,
        ra_totvs: a.ra,
        codcoligada_totvs: a.codcoligada,
        // turma_id: null (agora opcional — mapeamento futuro)
      });

      if (insertErr) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        erros.push(`Erro ao inserir ${a.email}: ${insertErr.message}`);
        continue;
      }

      // Enviar link de primeiro acesso (criação de senha)
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email: a.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/aluno/login`,
        },
      });

      novos++;
    }

    // Fim da paginação
    const hasMore = Array.isArray(resp) ? alunos.length === limit : resp.hasMore;
    if (!hasMore) break;
    page++;
  }

  return { total: totalFetched, novos, atualizados, sem_email, erros };
}
