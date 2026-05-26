"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/types/database";

export type LoginAlunoState = { error?: string } | null;

export async function loginAluno(
  _prevState: LoginAlunoState,
  formData: FormData,
): Promise<LoginAlunoState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Preencha e-mail e senha." };

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const isInvalidCredentials =
      error.message.toLowerCase().includes("invalid") ||
      error.message.toLowerCase().includes("credentials");
    return {
      error: isInvalidCredentials
        ? "E-mail ou senha incorretos."
        : "Não foi possível fazer login. Tente novamente.",
    };
  }

  // Verifica que o usuário tem um aluno vinculado (não é staff)
  const { data: aluno } = await supabase
    .from("aluno")
    .select("id")
    .eq("supabase_auth_id", data.user.id)
    .maybeSingle();

  if (!aluno) {
    await supabase.auth.signOut();
    return {
      error: "Acesso não encontrado. Fale com a coordenação da sua escola.",
    };
  }

  redirect("/aluno/dashboard");
}

export async function logoutAluno() {
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

  await supabase.auth.signOut();
  redirect("/aluno/login");
}
