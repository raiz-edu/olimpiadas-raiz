"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  ALUNO_SESSION_COOKIE,
  ALUNO_PENDING_COOKIE,
  signStudentCookie,
  verifyStudentCookie,
  cookieSessionOpts,
} from "@/lib/auth/student-cookie";
import { getStudentSession } from "@/lib/auth/student-session";
import { cadastroPortalConcluido, destinoPortal } from "@/lib/auth/portal-profile";
import { abrirSessaoPortal } from "@/lib/auth/portal-login";
import { getMarcaSlugForEmail } from "@/lib/auth/domains";

export type LoginAlunoState = { error?: string; needsConsent?: boolean } | null;

// Verifica senha sem tocar na sessão Supabase independente da equipe.
function makeVerifySupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  );
}

export async function loginAluno(
  _prevState: LoginAlunoState,
  formData: FormData,
): Promise<LoginAlunoState> {
  const store = await cookies();
  const admin = createAdminClient();
  const popup = formData.get("popup") === "1";
  const session = await getStudentSession({ permitirCadastroIncompleto: true });
  let aluno = session?.aluno ?? null;
  // Compatibilidade com quem já iniciou consentimento antes desta publicação.
  if (!aluno) {
    const raw = store.get(ALUNO_PENDING_COOKIE)?.value;
    const id = raw ? verifyStudentCookie(raw) : null;
    if (id) {
      const { data } = await admin
        .from("aluno")
        .select("*")
        .eq("id", id)
        .eq("ativo", true)
        .maybeSingle();
      aluno = data;
      if (aluno) store.set(ALUNO_SESSION_COOKIE, signStudentCookie(aluno.id), cookieSessionOpts());
    }
  }

  if (aluno) {
    if (!cadastroPortalConcluido(aluno)) redirect(destinoPortal(aluno, popup));
    if (aluno.tipo_usuario !== "aluno" || aluno.consentimento_responsavel)
      redirect(destinoPortal(aluno, popup));
    const nome =
      typeof formData.get("responsavel_nome") === "string"
        ? String(formData.get("responsavel_nome")).trim()
        : "";
    const tipo = formData.get("responsavel_tipo");
    if (nome.length < 2 || nome.length > 160)
      return {
        needsConsent: true,
        error: "Informe o nome completo do responsável (até 160 caracteres).",
      };
    if (tipo !== "pedagogico" && tipo !== "financeiro")
      return { needsConsent: true, error: "Selecione o tipo de responsável." };
    if (formData.get("consentimento_aceito") !== "on")
      return {
        needsConsent: true,
        error: "O responsável deve aceitar os termos para liberar o acesso.",
      };
    try {
      const { data, error } = await admin
        .from("aluno")
        .update({
          consentimento_responsavel: true,
          consentimento_data: new Date().toISOString(),
          consentimento_responsavel_nome: nome,
          consentimento_responsavel_tipo: tipo,
        })
        .eq("id", aluno.id)
        .eq("ativo", true)
        .eq("tipo_usuario", "aluno")
        .select("*")
        .maybeSingle();
      if (error || !data)
        return {
          needsConsent: true,
          error: "Não foi possível salvar a autorização. Tente novamente.",
        };
      aluno = data;
    } catch {
      return { needsConsent: true, error: "A conexão foi interrompida. Tente novamente." };
    }
    store.delete(ALUNO_PENDING_COOKIE);
    redirect(destinoPortal(aluno, popup));
  }

  const email =
    typeof formData.get("email") === "string" ? String(formData.get("email")).trim() : "";
  const password =
    typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  if (!email || !password) return { error: "Preencha e-mail e senha." };
  const { data, error } = await makeVerifySupabase().auth.signInWithPassword({ email, password });
  if (error || !data.user)
    return { error: "E-mail ou senha incorretos. Verifique os dados e tente novamente." };
  const result = await admin
    .from("aluno")
    .select("*")
    .eq("supabase_auth_id", data.user.id)
    .eq("ativo", true)
    .maybeSingle();
  if (result.error) return { error: "Não foi possível verificar o acesso. Tente novamente." };
  if (!result.data)
    return { error: "Acesso não encontrado. Fale com a coordenação da sua escola." };
  const marca = getMarcaSlugForEmail(email);
  if (marca)
    store.set("marca_hint", marca, {
      maxAge: 365 * 86400,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  redirect(await abrirSessaoPortal(result.data, popup));
}

export async function logoutAluno(form?: FormData) {
  const store = await cookies();
  store.delete(ALUNO_SESSION_COOKIE);
  store.delete(ALUNO_PENDING_COOKIE);
  redirect(`/aluno/login${form?.get("popup") === "1" ? "?popup=1" : ""}`);
}
