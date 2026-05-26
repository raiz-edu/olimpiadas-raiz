import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database, RoleUsuario, Usuario } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";

export type ServerSession = {
  user: Usuario;
  supabaseUserId: string;
} | null;

/**
 * Recupera a sessão do usuário autenticado no servidor.
 * Combina o auth.user do Supabase com o registro em public.usuario.
 * Retorna null se não autenticado ou se o usuário ainda não tiver registro.
 */
export async function getServerSession(): Promise<ServerSession> {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Admin client bypassa RLS para garantir que a leitura do usuario funcione
  // tanto em Server Components quanto em Server Actions
  const admin = createAdminClient();
  const { data: usuario, error } = await admin
    .from("usuario")
    .select("*")
    .eq("id", authUser.id)
    .eq("ativo", true)
    .single();

  if (error || !usuario) return null;

  return {
    user: usuario,
    supabaseUserId: authUser.id,
  };
}

/**
 * Retorna a role do usuário atual ou null.
 * Útil para guards rápidos em Server Components.
 */
export async function getCurrentRole(): Promise<RoleUsuario | null> {
  const session = await getServerSession();
  return session?.user.role ?? null;
}
