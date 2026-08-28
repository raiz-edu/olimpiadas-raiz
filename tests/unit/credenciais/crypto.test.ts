import { describe, expect, it } from "vitest";
import {
  cifrar,
  decifrar,
  getMasterKey,
  MasterKeyAusenteError,
  ultimos4,
} from "@/lib/credenciais/crypto";

// SPEC issue #159 — CA1
const CHAVE = Buffer.alloc(32, 7);
const OUTRA_CHAVE = Buffer.alloc(32, 9);

describe("cifra das credenciais (AES-256-GCM)", () => {
  it("round-trip devolve o texto original e o blob não contém o texto claro", () => {
    const blob = cifrar("sk-live-abc123XYZ", CHAVE);
    expect(blob.startsWith("v1:")).toBe(true);
    expect(blob).not.toContain("sk-live-abc123XYZ");
    expect(blob.split(":")).toHaveLength(4);
    expect(decifrar(blob, CHAVE)).toBe("sk-live-abc123XYZ");
  });

  it("dois cifrar do mesmo texto produzem blobs diferentes (IV aleatório)", () => {
    expect(cifrar("mesmo", CHAVE)).not.toBe(cifrar("mesmo", CHAVE));
  });

  it("ciphertext adulterado não decifra", () => {
    const partes = cifrar("segredo", CHAVE).split(":");
    partes[3] = Buffer.from("xxxxxxxxxx").toString("base64");
    expect(() => decifrar(partes.join(":"), CHAVE)).toThrow();
  });

  it("outra chave-mestra não decifra", () => {
    const blob = cifrar("segredo", CHAVE);
    expect(() => decifrar(blob, OUTRA_CHAVE)).toThrow();
  });

  it("formato desconhecido falha com mensagem clara", () => {
    expect(() => decifrar("v0:a:b:c", CHAVE)).toThrow("formato desconhecido");
    expect(() => decifrar("lixo", CHAVE)).toThrow("formato desconhecido");
  });

  it("aceita unicode e strings longas", () => {
    const longa = "ç".repeat(2000) + "🔑";
    expect(decifrar(cifrar(longa, CHAVE), CHAVE)).toBe(longa);
  });
});

describe("getMasterKey", () => {
  it("env ausente → MasterKeyAusenteError com instrução de geração", () => {
    expect(() => getMasterKey({})).toThrow(MasterKeyAusenteError);
    expect(() => getMasterKey({ CREDENCIAIS_MASTER_KEY: "   " })).toThrow(
      "openssl rand -base64 32",
    );
  });

  it("tamanho errado → erro citando 32 bytes", () => {
    expect(() =>
      getMasterKey({ CREDENCIAIS_MASTER_KEY: Buffer.alloc(16, 1).toString("base64") }),
    ).toThrow("32 bytes");
  });

  it("32 bytes em base64 → Buffer de 32 bytes", () => {
    expect(getMasterKey({ CREDENCIAIS_MASTER_KEY: CHAVE.toString("base64") })).toEqual(CHAVE);
  });
});

describe("ultimos4", () => {
  it("devolve só o sufixo", () => {
    expect(ultimos4("sk-abcd1234")).toBe("1234");
    expect(ultimos4("ab")).toBe("ab");
  });
});
