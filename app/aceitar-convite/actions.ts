"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database, Convite } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // Criar usuário via Supabase Auth Admin API (REST)
  const signUpResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({
        email: convite.email,
        password,
        email_confirm: true,
        user_metadata: { nome, convite_token: token },
      }),
    },
  );

  if (!signUpResponse.ok) {
    const err = (await signUpResponse.json()) as { msg?: string; message?: string };
    const msg = err.msg ?? err.message ?? "";
    if (msg.toLowerCase().includes("already registered")) {
      return {
        error:
          "Este e-mail já possui cadastro. Faça login com sua senha ou contate o administrador.",
      };
    }
    console.error("[aceitar-convite] createUser:", msg);
    return { error: "Erro ao criar conta. Tente novamente." };
  }

  const newAuthUser = (await signUpResponse.json()) as { id: string };

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

  // Login automático após aceitar convite
  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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

  await supabase.auth.signInWithPassword({ email: convite.email, password });
  redirect("/dashboard");
}
