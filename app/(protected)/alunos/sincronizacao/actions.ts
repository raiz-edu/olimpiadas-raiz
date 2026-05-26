"use server";

import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export type SyncResult =
  | {
      total: number;
      novos: number;
      atualizados: number;
      erros: string[];
    }
  | { error: string };

type AlunoTotvs = {
  nome: string;
  email: string;
  cpf?: string | null;
  turma_id: string;
  data_nascimento: string;
};

export async function sincronizarAlunosTOTVS(): Promise<SyncResult> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };

  // Apenas raiz e direcao_marca podem sincronizar
  const { role } = session.user;
  if (role !== "raiz" && role !== "direcao_marca") {
    return { error: "Permissão insuficiente para sincronizar alunos." };
  }

  const raizDataEngineUrl = process.env.RAIZ_DATA_ENGINE_URL;
  const raizDataEngineToken = process.env.RAIZ_DATA_ENGINE_TOKEN;

  if (!raizDataEngineUrl) {
    return { error: "RAIZ_DATA_ENGINE_URL não configurado." };
  }

  const supabase = createAdminClient();
  let novos = 0;
  let atualizados = 0;
  const erros: string[] = [];
  let page = 0;
  const limit = 1000;
  let totalFetched = 0;

  // Busca paginada do raiz-data-engine
  while (true) {
    let alunos: AlunoTotvs[];

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (raizDataEngineToken) headers["Authorization"] = `Bearer ${raizDataEngineToken}`;

      const res = await fetch(`${raizDataEngineUrl}/api/totvs/alunos?page=${page}&limit=${limit}`, {
        headers,
        next: { revalidate: 0 },
      });

      if (!res.ok) {
        return { error: `Erro ao buscar alunos do TOTVS: ${res.status} ${res.statusText}` };
      }

      const json = await res.json();
      alunos = Array.isArray(json) ? json : (json.data ?? []);
    } catch (err) {
      return { error: `Falha na conexão com raiz-data-engine: ${String(err)}` };
    }

    if (alunos.length === 0) break;
    totalFetched += alunos.length;

    // Processa lote
    for (const a of alunos) {
      if (!a.email || !a.nome) {
        erros.push(`Aluno sem e-mail ou nome: ${a.nome ?? "(sem nome)"}`);
        continue;
      }

      // Verifica se já existe pelo e-mail ou CPF
      const { data: existente } = await supabase
        .from("aluno")
        .select("id, supabase_auth_id")
        .or(a.cpf ? `email.eq.${a.email},cpf.eq.${a.cpf}` : `email.eq.${a.email}`)
        .maybeSingle();

      if (existente) {
        // Atualiza dados (email pode ter mudado)
        await supabase
          .from("aluno")
          .update({ nome: a.nome, email: a.email })
          .eq("id", existente.id);
        atualizados++;
        continue;
      }

      // Cria auth.users para o aluno novo
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: a.email,
        email_confirm: true,
        user_metadata: { nome: a.nome, tipo: "aluno" },
      });

      if (authErr || !authData.user) {
        erros.push(`Erro ao criar usuário para ${a.email}: ${authErr?.message ?? "desconhecido"}`);
        continue;
      }

      // Insere na tabela aluno
      const { error: insertErr } = await supabase.from("aluno").insert({
        nome: a.nome,
        email: a.email,
        cpf: a.cpf ?? null,
        turma_id: a.turma_id,
        data_nascimento: a.data_nascimento,
        supabase_auth_id: authData.user.id,
        consentimento_responsavel: false,
      });

      if (insertErr) {
        // Limpa o auth user criado
        await supabase.auth.admin.deleteUser(authData.user.id);
        erros.push(`Erro ao inserir aluno ${a.email}: ${insertErr.message}`);
        continue;
      }

      // Envia e-mail de boas-vindas com link para criar senha
      await supabase.auth.admin.generateLink({
        type: "recovery",
        email: a.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/aluno/login`,
        },
      });

      novos++;
    }

    if (alunos.length < limit) break;
    page++;
  }

  return { total: totalFetched, novos, atualizados, erros };
}
