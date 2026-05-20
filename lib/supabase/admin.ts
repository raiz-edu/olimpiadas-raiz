/**
 * Cliente Supabase com service role (admin).
 *
 * Usa @supabase/ssr createServerClient com cookies no-op — sem sessão de usuário.
 *
 * IMPORTANTE: usar APENAS em Server Components, Route Handlers e Server Actions.
 * NUNCA expor a SERVICE_ROLE_KEY no client side.
 */
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database";

export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        // Admin client não precisa de sessão — cookies no-op
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}
