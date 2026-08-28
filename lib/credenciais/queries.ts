/**
 * Leitura das credenciais de integração (issue #159). Módulo de SERVIDOR comum —
 * não é "use server": nada aqui vira Server Action invocável pelo navegador.
 *
 * Ordem de resolução: banco (cifrado) → env var do catálogo → null. O fallback em
 * env mantém o serviço de pé enquanto a migration 053 não roda ou a chave-mestra
 * não existe no ambiente.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CATALOGO_CREDENCIAIS,
  getDefinicao,
  type CredencialChave,
  type IntegracaoDef,
} from "./catalogo";
import {
  decifrar,
  MasterKeyAusenteError,
  origemChaveMestra,
  type OrigemChaveMestra,
} from "./crypto";

const TTL_CACHE_MS = 60_000;
const cache = new Map<string, { valor: string | null; expiraEm: number }>();

export function invalidarCacheCredencial(chave?: string): void {
  if (chave) cache.delete(chave);
  else cache.clear();
}

/** Valor em claro para uso no servidor. NUNCA devolver isto ao cliente. */
export async function getCredencial(
  chave: CredencialChave,
  opts: { semCache?: boolean } = {},
): Promise<string | null> {
  const agora = Date.now();
  const emCache = cache.get(chave);
  if (!opts.semCache && emCache && emCache.expiraEm > agora) return emCache.valor;

  let valor: string | null = null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("credencial")
      .select("valor_cifrado")
      .eq("chave", chave)
      .maybeSingle();
    if (error) console.error("[credenciais] leitura falhou:", chave, error.message);
    if (data?.valor_cifrado) valor = decifrar(data.valor_cifrado);
  } catch (e) {
    if (e instanceof MasterKeyAusenteError) {
      console.error(
        "[credenciais] sem chave-mestra (CREDENCIAIS_MASTER_KEY) — usando env var para",
        chave,
      );
    } else {
      console.error("[credenciais] decifrar falhou:", chave, (e as Error).message);
    }
  }

  if (!valor) {
    const def = getDefinicao(chave);
    valor = (def && process.env[def.env]) || null;
  }

  cache.set(chave, { valor, expiraEm: agora + TTL_CACHE_MS });
  return valor;
}

export type OrigemCredencial = "banco" | "env" | "ausente";

/** O que a tela pode saber de cada integração — sem o segredo. */
export type CredencialResumo = {
  chave: string;
  rotulo: string;
  descricao: string;
  envVar: string;
  obterEm: string;
  gerenciavel: boolean;
  testavel: boolean;
  origem: OrigemCredencial;
  ultimos4: string | null;
  atualizadoEm: string | null;
  atualizadoPor: string | null;
};

export async function listarCredenciais(): Promise<{
  itens: CredencialResumo[];
  /** "env" = CREDENCIAIS_MASTER_KEY; "derivada" = HKDF de SESSION_SIGNING_SECRET (provisório). */
  chaveMestra: OrigemChaveMestra | "ausente";
  masterKeyOk: boolean;
}> {
  const chaveMestra = origemChaveMestra();
  const masterKeyOk = chaveMestra !== "ausente";

  const admin = createAdminClient();
  // Sem a tabela (migration 053 ainda não rodou) a tela continua útil: mostra o status via env.
  const { data: rows, error } = await admin
    .from("credencial")
    .select("chave, ultimos4, atualizado_em, atualizado_por");
  if (error) console.error("[credenciais] listar falhou:", error.message);

  const porChave = new Map((rows ?? []).map((r) => [r.chave, r]));
  const idsAutores = [
    ...new Set((rows ?? []).map((r) => r.atualizado_por).filter(Boolean)),
  ] as string[];
  const nomes = new Map<string, string>();
  if (idsAutores.length > 0) {
    const { data: usuarios } = await admin.from("usuario").select("id, nome").in("id", idsAutores);
    for (const u of usuarios ?? []) nomes.set(u.id, u.nome);
  }

  const catalogo: readonly IntegracaoDef[] = CATALOGO_CREDENCIAIS;
  const itens = catalogo.map((def): CredencialResumo => {
    const row = def.gerenciavel ? porChave.get(def.chave) : undefined;
    // A primeira env var presente entre a principal e as alternativas do ambiente.
    const envPresente = [def.env, ...(def.envAlternativas ?? [])].find((nome) =>
      Boolean(process.env[nome]),
    );
    return {
      chave: def.chave,
      rotulo: def.rotulo,
      descricao: def.descricao,
      envVar: envPresente ?? def.env,
      obterEm: def.obterEm,
      gerenciavel: def.gerenciavel,
      testavel: Boolean(def.teste),
      origem: row ? "banco" : envPresente ? "env" : "ausente",
      ultimos4: row?.ultimos4 ?? null,
      atualizadoEm: row?.atualizado_em ?? null,
      atualizadoPor: row?.atualizado_por ? (nomes.get(row.atualizado_por) ?? null) : null,
    };
  });

  return { itens, chaveMestra, masterKeyOk };
}
