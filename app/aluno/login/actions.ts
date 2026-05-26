"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginAlunoState = { error: string } | { needsConsent: true } | null;

function makeSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

export async function loginAluno(
  _prevState: LoginAlunoState,
  formData: FormData,
): Promise<LoginAlunoState> {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  const adminClient = createAdminClient();

  // ── Passo 2: sessão ativa — verificar se é aluno (pode ser admin na aba) ────
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (existingUser) {
    // Usa o cliente autenticado — a policy aluno_read_own permite leitura própria
    const { data: aluno } = await supabase
      .from("aluno")
      .select("id, consentimento_responsavel")
      .eq("supabase_auth_id", existingUser.id)
      .maybeSingle();

    if (aluno) {
      // Sessão válida de aluno — processar consentimento se necessário
      if (!aluno.consentimento_responsavel) {
        const nome = (formData.get("responsavel_nome") as string)?.trim();
        const tipo = formData.get("responsavel_tipo") as string;
        const aceito = formData.get("consentimento_aceito") === "on";

        if (!nome) return { error: "Informe o nome completo do responsável." };
        if (!tipo || !["pedagogico", "financeiro"].includes(tipo))
          return { error: "Selecione o tipo de responsável." };
        if (!aceito)
          return { error: "O responsável deve aceitar os termos para liberar o acesso." };

        await adminClient
          .from("aluno")
          .update({
            consentimento_responsavel: true,
            consentimento_data: new Date().toISOString(),
            consentimento_responsavel_nome: nome,
            consentimento_responsavel_tipo: tipo as "pedagogico" | "financeiro",
          })
          .eq("id", aluno.id);
      }

      redirect("/aluno/dashboard");
    }

    // Sessão não é de aluno (ex: admin com sessão ativa na mesma aba)
    // Encerra a sessão atual e continua para o login com as credenciais digitadas
    await supabase.auth.signOut();
  }

  // ── Passo 1: autenticar com e-mail e senha ──────────────────────────────────
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Preencha e-mail e senha." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const isInvalid =
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials");
    return {
      error: isInvalid
        ? "E-mail ou senha incorretos."
        : "Não foi possível fazer login. Tente novamente.",
    };
  }

  // Usa cliente autenticado — após signIn, auth.uid() = data.user.id
  // A policy aluno_read_own permite: supabase_auth_id = auth.uid()
  const { data: aluno, error: alunoError } = await supabase
    .from("aluno")
    .select("id, consentimento_responsavel")
    .eq("supabase_auth_id", data.user.id)
    .maybeSingle();

  if (alunoError) {
    console.error("Erro ao buscar aluno:", alunoError.message, alunoError.code);
    await supabase.auth.signOut();
    return { error: "Não foi possível verificar o acesso. Tente novamente." };
  }

  if (!aluno) {
    await supabase.auth.signOut();
    return { error: "Acesso não encontrado. Fale com a coordenação da sua escola." };
  }

  // Primeiro acesso: sinalizar para exibir o formulário de consentimento
  if (!aluno.consentimento_responsavel) {
    return { needsConsent: true };
  }

  redirect("/aluno/dashboard");
}

export async function logoutAluno() {
  const cookieStore = await cookies();
  const supabase = makeSupabase(cookieStore);
  await supabase.auth.signOut();
  redirect("/aluno/login");
}
