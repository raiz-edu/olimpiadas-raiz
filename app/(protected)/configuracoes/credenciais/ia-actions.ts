"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirCredenciais } from "@/lib/auth/roles";
import {
  CHAVE_FALLBACK,
  CHAVE_PROVEDOR,
  chaveModeloTexto,
  chaveModeloVisao,
  getConfigIA,
  invalidarCacheConfigIA,
  montarConfigIA,
} from "@/lib/ai/config";
import { testarModelo } from "@/lib/ai/avaliador";
import { getCredencial } from "@/lib/credenciais/queries";
import { isProvedorIA, PROVEDORES, PROVEDORES_IA } from "@/lib/ai/provedores";

export type ConfigIAState =
  | { error: string }
  | { ok: true; message: string; linhas?: string[] }
  | null;

const ROTA = "/configuracoes/credenciais";

async function exigirGestor() {
  const session = await getServerSession();
  if (!session || !podeGerirCredenciais(session.user.role, session.user.email)) return null;
  return session;
}

export async function salvarConfigIA(
  _prev: ConfigIAState,
  formData: FormData,
): Promise<ConfigIAState> {
  const session = await exigirGestor();
  if (!session) return { error: "Não autorizado" };

  const provedor = String(formData.get(CHAVE_PROVEDOR) ?? "");
  const fallback = String(formData.get(CHAVE_FALLBACK) ?? "");
  if (!isProvedorIA(provedor)) return { error: "Provedor primário inválido." };
  if (fallback !== "" && !isProvedorIA(fallback)) return { error: "Fallback inválido." };
  if (fallback === provedor) return { error: "O fallback precisa ser diferente do primário." };

  const valores: Record<string, string> = {
    [CHAVE_PROVEDOR]: provedor,
    [CHAVE_FALLBACK]: fallback,
  };
  for (const p of PROVEDORES_IA) {
    const texto = String(formData.get(chaveModeloTexto(p)) ?? "").trim();
    const visao = String(formData.get(chaveModeloVisao(p)) ?? "").trim();
    valores[chaveModeloTexto(p)] = texto || PROVEDORES[p].modeloTextoDefault;
    valores[chaveModeloVisao(p)] = visao || PROVEDORES[p].modeloVisaoDefault;
  }
  // Normaliza pelo mesmo caminho que a leitura usa — o que for salvo é o que será lido.
  const config = montarConfigIA(valores);

  const agora = new Date().toISOString();
  const linhas = Object.entries(valores).map(([chave, valor]) => ({
    chave,
    valor,
    atualizado_em: agora,
  }));
  const admin = createAdminClient();
  const { error } = await admin
    .from("configuracao_sistema")
    .upsert(linhas, { onConflict: "chave" });
  if (error) return { error: error.message };

  invalidarCacheConfigIA();
  revalidatePath(ROTA);
  const fb = config.fallback ? PROVEDORES[config.fallback].rotulo : "nenhum";
  return {
    ok: true,
    message: `Avaliação por IA: ${PROVEDORES[config.provedor].rotulo} (fallback: ${fb}).`,
  };
}

export async function testarModelosIA(
  _prev: ConfigIAState,
  _formData: FormData,
): Promise<ConfigIAState> {
  const session = await exigirGestor();
  if (!session) return { error: "Não autorizado" };

  const config = await getConfigIA({ semCache: true });
  const linhas: string[] = [];
  let algumOk = false;

  for (const p of PROVEDORES_IA) {
    const def = PROVEDORES[p];
    if (!(await getCredencial(def.credencial, { semCache: true }))) {
      linhas.push(`${def.rotulo}: sem chave — pulado.`);
      continue;
    }
    for (const tipo of ["texto", "visao"] as const) {
      const model = config.modelos[p][tipo];
      const r = await testarModelo(p, tipo, model);
      if (r.ok) algumOk = true;
      linhas.push(
        r.ok
          ? `${def.rotulo} · ${tipo} · ${model}: ok ("${r.resposta}")`
          : `${def.rotulo} · ${tipo} · ${model}: ${r.erro}`,
      );
    }
  }

  return algumOk
    ? { ok: true, message: "Teste concluído.", linhas }
    : { error: `Nenhum modelo respondeu.\n${linhas.join("\n")}` };
}
