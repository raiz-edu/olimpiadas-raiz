"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";

export type ConfigState = { error: string } | { ok: true; message: string } | null;

// getConfigValue vivia aqui e, por estar num módulo "use server", era uma Server
// Action invocável por qualquer usuário logado sem checar sessão. Foi para
// lib/config/queries.ts (módulo de servidor comum) — issue #159.

export async function salvarConfig(_prev: ConfigState, formData: FormData): Promise<ConfigState> {
  const session = await getServerSession();
  if (!session || session.user.role !== "raiz") return { error: "Não autorizado" };

  const chave = formData.get("chave") as string;
  const valor = ((formData.get("valor") as string) ?? "").trim();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;
  const { error } = await supabase
    .from("configuracao_sistema")
    .upsert({ chave, valor, atualizado_em: new Date().toISOString() });

  if (error) return { error: error.message };

  revalidatePath("/configuracoes");
  revalidatePath("/aluno/login");
  return { ok: true, message: "Configuração salva com sucesso." };
}
