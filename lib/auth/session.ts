import type { RoleUsuario, Usuario } from "@/lib/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { readCognitoSession } from "@/lib/auth/cognito-session";

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
  const identity = await readCognitoSession();
  if (!identity) return null;

  // Admin client bypassa RLS para garantir que a leitura do usuario funcione
  // tanto em Server Components quanto em Server Actions
  const admin = createAdminClient();
  const { data: usuario, error } = await admin
    .from("usuario")
    .select("*")
    .eq("email", identity.email)
    .eq("ativo", true)
    .single();

  if (error || !usuario) return null;

  return {
    user: usuario,
    supabaseUserId: identity.sub,
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
