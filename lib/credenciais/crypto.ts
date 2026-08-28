/**
 * Cifra das credenciais de integração (issue #159).
 *
 * AES-256-GCM com IV aleatório por gravação e tag de autenticação: adulterar o
 * ciphertext ou usar outra chave-mestra falha na leitura, nunca devolve lixo.
 * Formato guardado no banco: "v1:<iv>:<tag>:<ciphertext>", tudo em base64.
 *
 * A chave-mestra vem SÓ de CREDENCIAIS_MASTER_KEY (32 bytes em base64 —
 * `openssl rand -base64 32`). Sem ela, o banco sozinho não abre nada.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const VERSAO = "v1";
const TAMANHO_CHAVE = 32;
const TAMANHO_IV = 12;

export class MasterKeyAusenteError extends Error {
  constructor() {
    super(
      "CREDENCIAIS_MASTER_KEY não configurada — gere com `openssl rand -base64 32` e defina no ambiente do servidor.",
    );
    this.name = "MasterKeyAusenteError";
  }
}

export function getMasterKey(env: Record<string, string | undefined> = process.env): Buffer {
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

export function cifrar(valor: string, key: Buffer = getMasterKey()): string {
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

export function decifrar(blob: string, key: Buffer = getMasterKey()): string {
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

/** Sufixo exibido na tela ("····abcd") — o único pedaço da chave que sai do servidor. */
export function ultimos4(valor: string): string {
  return valor.slice(-4);
}
