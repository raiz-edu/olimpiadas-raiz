/**
 * Configuração da avaliação por IA (issue #161), guardada em configuracao_sistema:
 *   ia_provedor                      "openai" | "groq"
 *   ia_fallback                      "openai" | "groq" | ""   (vazio = sem fallback)
 *   ia_<provedor>_modelo_texto       nome do modelo para avaliar texto
 *   ia_<provedor>_modelo_visao       nome do modelo para ler fotos
 *
 * Módulo de servidor comum (não "use server"). Cache de 60 s por instância.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { isProvedorIA, PROVEDORES, PROVEDORES_IA, type ProvedorIA } from "./provedores";

export type ModelosProvedor = { texto: string; visao: string };

export type ConfigIA = {
  provedor: ProvedorIA;
  fallback: ProvedorIA | null;
  modelos: Record<ProvedorIA, ModelosProvedor>;
};

export const CHAVE_PROVEDOR = "ia_provedor";
export const CHAVE_FALLBACK = "ia_fallback";
export const chaveModeloTexto = (p: ProvedorIA) => `ia_${p}_modelo_texto`;
export const chaveModeloVisao = (p: ProvedorIA) => `ia_${p}_modelo_visao`;

export function configIADefault(): ConfigIA {
  const modelos = Object.fromEntries(
    PROVEDORES_IA.map((p) => [
      p,
      { texto: PROVEDORES[p].modeloTextoDefault, visao: PROVEDORES[p].modeloVisaoDefault },
    ]),
  ) as Record<ProvedorIA, ModelosProvedor>;
  return { provedor: "openai", fallback: "groq", modelos };
}

/** Monta a config a partir de pares chave/valor (do banco ou de um formulário). */
export function montarConfigIA(valores: Record<string, string | undefined>): ConfigIA {
  const config = configIADefault();
  const provedor = valores[CHAVE_PROVEDOR];
  if (isProvedorIA(provedor)) config.provedor = provedor;

  const fallback = valores[CHAVE_FALLBACK];
  if (fallback === "") config.fallback = null;
  else if (isProvedorIA(fallback)) config.fallback = fallback;
  if (config.fallback === config.provedor) config.fallback = null;

  for (const p of PROVEDORES_IA) {
    const texto = valores[chaveModeloTexto(p)]?.trim();
    const visao = valores[chaveModeloVisao(p)]?.trim();
    if (texto) config.modelos[p].texto = texto;
    if (visao) config.modelos[p].visao = visao;
  }
  return config;
}

const TTL_CACHE_MS = 60_000;
let cache: { config: ConfigIA; expiraEm: number } | null = null;

export function invalidarCacheConfigIA(): void {
  cache = null;
}

export async function getConfigIA(opts: { semCache?: boolean } = {}): Promise<ConfigIA> {
  const agora = Date.now();
  if (!opts.semCache && cache && cache.expiraEm > agora) return cache.config;

  const valores: Record<string, string> = {};
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("configuracao_sistema")
      .select("chave, valor")
      .like("chave", "ia\\_%");
    if (error) console.error("[ia] leitura da configuração falhou:", error.message);
    for (const row of data ?? []) valores[row.chave] = row.valor;
  } catch (e) {
    console.error("[ia] leitura da configuração falhou:", (e as Error).message);
  }

  const config = montarConfigIA(valores);
  cache = { config, expiraEm: agora + TTL_CACHE_MS };
  return config;
}
