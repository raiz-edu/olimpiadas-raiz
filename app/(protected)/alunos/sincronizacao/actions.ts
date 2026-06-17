"use server";

import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Coligadas elegíveis para o portal olímpico ───────────────────────────────
// Fonte: /matriculas/por-marca no raiz-data-engine (ciclo 2026).
// Cada entrada: CODCOLIGADA → marca + filiais a excluir dentro dessa coligada.
//
// COL=10 (Qi): inclui Qi Recreio (FIL=1) e, dentro da mesma coligada,
//              Sá Pereira (FIL=3,4,6) e SAP (FIL=7) — estes últimos EXCLUÍDOS.
const COLIGADAS_SYNC = [
  { cod: 2, marca_slug: "qi-bilingue", filiais_excluir: [] as number[] },
  { cod: 6, marca_slug: "qi-bilingue", filiais_excluir: [] as number[] },
  { cod: 8, marca_slug: "matriz-educacao", filiais_excluir: [] as number[] },
  { cod: 10, marca_slug: "qi-bilingue", filiais_excluir: [3, 4, 6, 7] }, // Sá Pereira + SAP
  { cod: 11, marca_slug: "unificado", filiais_excluir: [] as number[] },
  { cod: 18, marca_slug: "apogeu", filiais_excluir: [] as number[] },
  { cod: 29, marca_slug: "americano", filiais_excluir: [] as number[] },
  { cod: 30, marca_slug: "uniao", filiais_excluir: [] as number[] },
] as const;

// Exportado para uso na UI
export const MARCAS_SYNC = [
  {
    slug: "americano",
    nome: "Americano",
    supabase_id: "11111111-0000-0000-0000-000000000006",
    coligadas: [29],
  },
  {
    slug: "apogeu",
    nome: "Apogeu",
    supabase_id: "11111111-0000-0000-0000-000000000001",
    coligadas: [18],
  },
  {
    slug: "uniao",
    nome: "União",
    supabase_id: "11111111-0000-0000-0000-000000000004",
    coligadas: [30],
  },
  {
    slug: "unificado",
    nome: "Unificado",
    supabase_id: "11111111-0000-0000-0000-000000000005",
    coligadas: [11],
  },
  {
    slug: "qi-bilingue",
    nome: "QI Bilíngue",
    supabase_id: "11111111-0000-0000-0000-000000000003",
    coligadas: [2, 6, 10],
  },
  {
    slug: "matriz-educacao",
    nome: "Matriz Educação",
    supabase_id: "11111111-0000-0000-0000-000000000002",
    coligadas: [8],
  },
] as const;

const MARCA_UUID: Record<string, string> = Object.fromEntries(
  MARCAS_SYNC.map((m) => [m.slug, m.supabase_id]),
);

// Segmentos incluídos: do 1º ano EFAI à 3ª série EM.
// Exclui: Infantil, Berçário, Pré-Escola, Pré-Militar, Medicina, Curso Livre.
const CICLOS_ELEGIVEIS = new Set(["FundI", "FundII", "Medio"]);

// Termos de segmento que correspondem aos ciclos elegíveis
// (fallback quando ciclo_pedagogico não estiver disponível)
const SEGMENTOS_ELEGIVEIS = new Set([
  "1º Ano",
  "2º Ano",
  "3º Ano",
  "4º Ano",
  "5º Ano",
  "6º Ano",
  "7º Ano",
  "8º Ano",
  "9º Ano",
  "1ª Série",
  "2ª Série",
  "3ª Série",
]);

// ─── Contrato do endpoint /educacional/alunos ──────────────────────────────────
// GET /educacional/alunos?coligada={cod}&ciclo=2026
// Header: X-API-Key: rde_live_... (requer scope pii:read)
// Fonte: TOTVS Mirror (Neon) via PALUNO + SMATRICPL
//
// Campos esperados na resposta (snake_case do data engine):
//   ra, nome, email, cpf, data_nascimento, cod_filial, serie, segmento,
//   ciclo_pedagogico [FundI|FundII|Medio|Infantil|Outro]
type AlunoRDE = {
  ra?: string;
  RA?: string;
  nome?: string;
  NOME?: string;
  email?: string;
  EMAIL?: string;
  cpf?: string;
  CPF?: string;
  data_nascimento?: string;
  DTNASCIMENTO?: string;
  cod_filial?: number;
  CODFILIAL?: number;
  serie?: string;
  SERIE?: string;
  segmento?: string;
  ciclo_pedagogico?: string;
};

export type SyncResult =
  | {
      total: number;
      novos: number;
      atualizados: number;
      sem_email: number;
      fora_serie: number;
      erros: string[];
    }
  | { error: string };

// ─── Action principal ──────────────────────────────────────────────────────────

export async function sincronizarAlunosTOTVS(): Promise<SyncResult> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  const { role } = session.user;
  if (!can(role, "aluno:create")) {
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
  let fora_serie = 0;
  const erros: string[] = [];
  let totalFetched = 0;

  for (const col of COLIGADAS_SYNC) {
    const url = `${baseUrl}/educacional/alunos?coligada=${col.cod}&ciclo=2026`;
    let alunos: AlunoRDE[];

    try {
      const res = await fetch(url, {
        headers: { "X-API-Key": apiKey },
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        erros.push(`COL=${col.cod}: ${res.status} — ${body.slice(0, 200)}`);
        continue;
      }

      const json = await res.json();
      alunos = Array.isArray(json) ? json : (json.data ?? json.alunos ?? []);
    } catch (err) {
      erros.push(`COL=${col.cod}: falha de conexão — ${String(err)}`);
      continue;
    }

    for (const a of alunos) {
      const ra = String(a.ra ?? a.RA ?? "").trim();
      const nome = (a.nome ?? a.NOME ?? "").trim();
      const email = (a.email ?? a.EMAIL ?? "").trim().toLowerCase() || null;
      const cpf = a.cpf ?? a.CPF ?? null;
      const nascimento = a.data_nascimento ?? a.DTNASCIMENTO ?? null;
      const codFilial = a.cod_filial ?? a.CODFILIAL ?? null;
      const serie = a.serie ?? a.SERIE ?? null;
      const ciclo = a.ciclo_pedagogico ?? null;
      const segmento = a.segmento ?? null;

      if (!nome || !ra) continue;

      // Excluir filiais Sá Pereira e SAP dentro de COL=10
      if (col.filiais_excluir.length > 0 && codFilial !== null) {
        if ((col.filiais_excluir as number[]).includes(Number(codFilial))) continue;
      }

      // Filtrar por série elegível (1º EFAI → 3ª EM)
      const cicloElegivel = ciclo ? CICLOS_ELEGIVEIS.has(ciclo) : null;
      const segmentoElegivel = segmento ? SEGMENTOS_ELEGIVEIS.has(segmento) : null;
      if (cicloElegivel === false || (cicloElegivel === null && segmentoElegivel === false)) {
        fora_serie++;
        continue;
      }

      totalFetched++;

      if (!email) {
        sem_email++;
        continue;
      }

      const marcaUuid = MARCA_UUID[col.marca_slug];

      // Deduplicação: RA+CODCOLIGADA+CODFILIAL (primário) ou e-mail (secundário)
      const { data: existente } = await supabase
        .from("aluno")
        .select("id")
        .or(
          `and(ra_totvs.eq.${ra},codcoligada_totvs.eq.${col.cod},codfilial_totvs.eq.${codFilial ?? 0}),email.eq.${email}`,
        )
        .maybeSingle();

      if (existente) {
        await supabase
          .from("aluno")
          .update({
            nome,
            email,
            serie,
            marca_id: marcaUuid,
            ra_totvs: ra,
            codcoligada_totvs: col.cod,
            codfilial_totvs: codFilial,
          })
          .eq("id", existente.id);
        atualizados++;
        continue;
      }

      // Aluno novo — criar conta Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { nome, tipo: "aluno" },
      });

      if (authErr || !authData.user) {
        erros.push(`Erro ao criar auth para ${email}: ${authErr?.message ?? "desconhecido"}`);
        continue;
      }

      const { error: insertErr } = await supabase.from("aluno").insert({
        nome,
        email,
        cpf: cpf ?? null,
        data_nascimento: nascimento ?? "2000-01-01",
        supabase_auth_id: authData.user.id,
        consentimento_responsavel: false,
        ativo: true,
        serie,
        marca_id: marcaUuid,
        ra_totvs: ra,
        codcoligada_totvs: col.cod,
        codfilial_totvs: codFilial,
      });

      if (insertErr) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        erros.push(`Erro ao inserir ${email}: ${insertErr.message}`);
        continue;
      }

      // Enviar link de primeiro acesso
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/aluno/login` },
      });

      novos++;
    }
  }

  return { total: totalFetched, novos, atualizados, sem_email, fora_serie, erros };
}
