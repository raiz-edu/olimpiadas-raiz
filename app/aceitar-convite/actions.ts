"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Convite } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  STAFF_SESSION_COOKIE,
  signCognitoSession,
  staffCookieOptions,
} from "@/lib/auth/cognito-session";

type AceitarState = { error?: string } | null;

export async function aceitarConvite(
  _prevState: AceitarState,
  formData: FormData,
): Promise<AceitarState> {
  const token = formData.get("token") as string;
  const nome = (formData.get("nome") as string)?.trim();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;

  if (!token) return { error: "Token de convite ausente." };
  if (!nome || nome.length < 2) return { error: "Informe seu nome completo." };
  if (!password || password.length < 8)
    return { error: "A senha deve ter pelo menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "As senhas não coincidem." };

  const supabaseAdmin = createAdminClient();

  // Buscar convite pelo token — cast explícito necessário por limitação de inferência do SDK
  const { data: rawConvite } = await supabaseAdmin
    .from("convite")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  const convite = rawConvite as Convite | null;

  if (!convite) {
    return { error: "Convite inválido ou não encontrado." };
  }
  if (convite.aceito_em) {
    return { error: "Este convite já foi utilizado. Faça login para acessar a plataforma." };
  }
  if (new Date(convite.expires_at) < new Date()) {
    return { error: "Este convite expirou. Solicite um novo convite ao administrador." };
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: convite.email,
    password,
    email_confirm: true,
    user_metadata: { nome, convite_token: token },
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? "";
    if (msg.toLowerCase().includes("exists")) {
      return {
        error:
          "Este e-mail já possui cadastro. Faça login com sua senha ou contate o administrador.",
      };
    }
    console.error("[aceitar-convite] createUser:", msg);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  const newAuthUser = authData.user;

  // Marcar convite como aceito
  await supabaseAdmin
    .from("convite")
    .update({ aceito_em: new Date().toISOString() })
    .eq("token", token);

  // Upsert registro público do usuário
  await supabaseAdmin
    .from("usuario")
    .upsert(
      { id: newAuthUser.id, nome, email: convite.email, role: convite.role },
      { onConflict: "id" },
    )
    .then(({ error }) => {
      if (error) console.error("[aceitar-convite] upsert usuario:", error.message);
    });

  if (convite.marca_id) {
    await supabaseAdmin
      .from("usuario_marca")
      .upsert({ usuario_id: newAuthUser.id, marca_id: convite.marca_id })
      .then(({ error }) => {
        if (error) console.error("[aceitar-convite] upsert usuario_marca:", error.message);
      });
  }

  if (convite.unidade_id) {
    await supabaseAdmin
      .from("usuario_unidade")
      .upsert({ usuario_id: newAuthUser.id, unidade_id: convite.unidade_id })
      .then(({ error }) => {
        if (error) console.error("[aceitar-convite] upsert usuario_unidade:", error.message);
      });
  }

  // Login automático após aceitar convite, por sessão BFF assinada.
  const cookieStore = await cookies();
  cookieStore.set(
    STAFF_SESSION_COOKIE,
    signCognitoSession({
      sub: newAuthUser.id,
      email: convite.email,
      name: nome,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    }),
    staffCookieOptions,
  );
  redirect("/dashboard");
}
