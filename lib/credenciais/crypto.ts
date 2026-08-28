/**
 * Cifra das credenciais de integração (issue #159).
 *
 * AES-256-GCM com IV aleatório por gravação e tag de autenticação: adulterar o
 * ciphertext ou usar outra chave-mestra falha na leitura, nunca devolve lixo.
 * Formato guardado no banco: "v1:<iv>:<tag>:<ciphertext>", tudo em base64.
 *
 * Chave-mestra, em ordem de preferência:
 *   1. CREDENCIAIS_MASTER_KEY — 32 bytes em base64 (`openssl rand -base64 32`).
 *   2. Derivada de SESSION_SIGNING_SECRET por HKDF-SHA256 (provisório, para
 *      ambientes onde ainda não dá para definir a env acima). Quem tem esse
 *      segredo já forja sessões e o JWT do PostgREST, então derivar dele não
 *      amplia o risco — mas a chave própria continua sendo o alvo.
 *
 * A leitura tenta a chave principal e depois as alternativas, então definir
 * CREDENCIAIS_MASTER_KEY depois de já haver chaves gravadas com a derivada não
 * quebra nada: elas seguem legíveis e passam a usar a nova chave na próxima
 * gravação. Sem nenhuma das duas envs, o banco sozinho não abre nada.
 */
import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const VERSAO = "v1";
const TAMANHO_CHAVE = 32;
const TAMANHO_IV = 12;
const HKDF_SALT = "olimpiadas-raiz/credenciais";
const HKDF_INFO = "chave-mestra-derivada/v1";

type Env = Record<string, string | undefined>;

export type OrigemChaveMestra = "env" | "derivada";

export type ChavesMestras = {
  principal: Buffer;
  origem: OrigemChaveMestra;
  /** Outras chaves com que credenciais antigas podem ter sido gravadas. */
  alternativas: Buffer[];
};

export class MasterKeyAusenteError extends Error {
  constructor() {
    super(
      "Nenhuma chave-mestra disponível: defina CREDENCIAIS_MASTER_KEY (gere com `openssl rand -base64 32`) no ambiente do servidor.",
    );
    this.name = "MasterKeyAusenteError";
  }
}

/** Só a chave CONFIGURADA (CREDENCIAIS_MASTER_KEY). Lança se ausente ou malformada. */
export function getMasterKey(env: Env = process.env): Buffer {
  const raw = env.CREDENCIAIS_MASTER_KEY?.trim();
  if (!raw) throw new MasterKeyAusenteError();
  const key = Buffer.from(raw, "base64");
  if (key.length !== TAMANHO_CHAVE) {
    throw new Error(
      `CREDENCIAIS_MASTER_KEY precisa ter ${TAMANHO_CHAVE} bytes em base64 (tem ${key.length}). Gere com \`openssl rand -base64 32\`.`,
    );
  }
  return key;
}

function derivarDeSessionSecret(env: Env): Buffer | null {
  const segredo = env.SESSION_SIGNING_SECRET?.trim();
  if (!segredo) return null;
  return Buffer.from(hkdfSync("sha256", segredo, HKDF_SALT, HKDF_INFO, TAMANHO_CHAVE));
}

/** Chave principal para cifrar + alternativas para decifrar. Lança sem nenhuma fonte. */
export function resolverChavesMestras(env: Env = process.env): ChavesMestras {
  const derivada = derivarDeSessionSecret(env);
  try {
    const principal = getMasterKey(env);
    return { principal, origem: "env", alternativas: derivada ? [derivada] : [] };
  } catch (e) {
    if (!(e instanceof MasterKeyAusenteError)) throw e;
    if (derivada) return { principal: derivada, origem: "derivada", alternativas: [] };
    throw new MasterKeyAusenteError();
  }
}

/** Para a tela: de onde vem a chave-mestra deste ambiente. */
export function origemChaveMestra(env: Env = process.env): OrigemChaveMestra | "ausente" {
  try {
    return resolverChavesMestras(env).origem;
  } catch {
    return "ausente";
  }
}

export function cifrar(valor: string, key: Buffer = resolverChavesMestras().principal): string {
  const iv = randomBytes(TAMANHO_IV);
  const cipher = createCipheriv(ALGORITMO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(valor, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    VERSAO,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

function decifrarCom(blob: string, key: Buffer): string {
  const [versao, ivB64, tagB64, ctB64] = blob.split(":");
  if (versao !== VERSAO || !ivB64 || !tagB64 || !ctB64) {
    throw new Error("Credencial cifrada em formato desconhecido.");
  }
  const decipher = createDecipheriv(ALGORITMO, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString(
    "utf8",
  );
}

/** Tenta cada chave na ordem; a tag GCM garante que só a certa devolve texto. */
export function decifrarComChaves(blob: string, chaves: Buffer[]): string {
  let ultimoErro: unknown = null;
  for (const key of chaves) {
    try {
      return decifrarCom(blob, key);
    } catch (e) {
      ultimoErro = e;
      if ((e as Error).message.includes("formato desconhecido")) throw e;
    }
  }
  throw ultimoErro instanceof Error
    ? new Error("Credencial cifrada com outra chave-mestra — não foi possível decifrar.")
    : new Error("Nenhuma chave para decifrar.");
}

export function decifrar(blob: string, key?: Buffer): string {
  if (key) return decifrarCom(blob, key);
  const { principal, alternativas } = resolverChavesMestras();
  return decifrarComChaves(blob, [principal, ...alternativas]);
}

/** Sufixo exibido na tela ("····abcd") — o único pedaço da chave que sai do servidor. */
export function ultimos4(valor: string): string {
  return valor.slice(-4);
}
