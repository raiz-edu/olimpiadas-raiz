import { describe, expect, it } from "vitest";
import {
  cifrar,
  decifrar,
  decifrarComChaves,
  getMasterKey,
  MasterKeyAusenteError,
  origemChaveMestra,
  resolverChavesMestras,
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

describe("resolverChavesMestras — chave derivada de SESSION_SIGNING_SECRET (provisória)", () => {
  const SESSAO = { SESSION_SIGNING_SECRET: "segredo-de-sessao-de-teste" };
  const AMBAS = { ...SESSAO, CREDENCIAIS_MASTER_KEY: CHAVE.toString("base64") };

  it("sem nenhuma env → MasterKeyAusenteError; origem 'ausente'", () => {
    expect(() => resolverChavesMestras({})).toThrow(MasterKeyAusenteError);
    expect(origemChaveMestra({})).toBe("ausente");
  });

  it("só SESSION_SIGNING_SECRET → origem 'derivada', 32 bytes, determinística e diferente do segredo", () => {
    const a = resolverChavesMestras(SESSAO);
    const b = resolverChavesMestras(SESSAO);
    expect(a.origem).toBe("derivada");
    expect(a.principal.length).toBe(32);
    expect(a.principal.equals(b.principal)).toBe(true);
    expect(a.principal.toString("utf8")).not.toContain("segredo-de-sessao");
    expect(a.alternativas).toEqual([]);
    expect(origemChaveMestra(SESSAO)).toBe("derivada");
    expect(
      resolverChavesMestras({ SESSION_SIGNING_SECRET: "outro" }).principal.equals(a.principal),
    ).toBe(false);
  });

  it("com CREDENCIAIS_MASTER_KEY → origem 'env' e a derivada fica como alternativa", () => {
    const r = resolverChavesMestras(AMBAS);
    expect(r.origem).toBe("env");
    expect(r.principal).toEqual(CHAVE);
    expect(r.alternativas).toHaveLength(1);
    expect(r.alternativas[0]!.equals(resolverChavesMestras(SESSAO).principal)).toBe(true);
  });

  it("rotação: gravado com a derivada continua legível depois de definir a chave própria", () => {
    const antes = resolverChavesMestras(SESSAO);
    const blob = cifrar("sk-gravada-antes", antes.principal);

    const depois = resolverChavesMestras(AMBAS);
    expect(() => decifrar(blob, depois.principal)).toThrow();
    expect(decifrarComChaves(blob, [depois.principal, ...depois.alternativas])).toBe(
      "sk-gravada-antes",
    );
  });

  it("chave malformada não cai no fallback derivado", () => {
    expect(() =>
      resolverChavesMestras({
        ...SESSAO,
        CREDENCIAIS_MASTER_KEY: Buffer.alloc(8).toString("base64"),
      }),
    ).toThrow("32 bytes");
  });

  it("decifrarComChaves: nenhuma chave certa → erro explícito; formato inválido → erro de formato", () => {
    const blob = cifrar("x", CHAVE);
    expect(() => decifrarComChaves(blob, [OUTRA_CHAVE])).toThrow("outra chave-mestra");
    expect(() => decifrarComChaves("lixo", [CHAVE])).toThrow("formato desconhecido");
  });
});
