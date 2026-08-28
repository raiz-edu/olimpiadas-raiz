/**
 * Leitura de `configuracao_sistema`. Módulo de SERVIDOR comum — deliberadamente
 * NÃO é "use server": exportar isto de um módulo de Server Actions a tornava
 * invocável por qualquer usuário logado, sem checagem de sessão (issue #159).
 */
import { createAdminClient } from "@/lib/supabase/admin";

export async function getConfigValue(chave: string): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("configuracao_sistema")
      .select("valor")
      .eq("chave", chave)
      .maybeSingle();
    if (error) return "";
    return data?.valor ?? "";
  } catch {
    return "";
  }
}
