/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cifrar } from "@/lib/credenciais/crypto";

// SPEC issue #159 — CA2 e CA5

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

type Resultado = { data: unknown; error: { message: string } | null };

/** Cliente admin falso: cada tabela resolve para o resultado configurado, em qualquer terminal. */
function makeAdmin(porTabela: Record<string, Resultado>) {
  const chamadas: string[] = [];
  const chain = (tabela: string): any => {
    const resultado = porTabela[tabela] ?? { data: null, error: null };
    const q: any = {};
    for (const m of ["select", "eq", "in", "order"]) q[m] = vi.fn(() => q);
    q.maybeSingle = vi.fn(async () => resultado);
    q.then = (resolve: (r: Resultado) => void) => resolve(resultado);
    return q;
  };
  return {
    chamadas,
    client: {
      from: vi.fn((tabela: string) => {
        chamadas.push(tabela);
        return chain(tabela);
      }),
    },
  };
}

const CHAVE_MESTRA = Buffer.alloc(32, 3);

describe("getCredencial", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules(); // zera o cache em memória do módulo
    vi.clearAllMocks();
    process.env.CREDENCIAIS_MASTER_KEY = CHAVE_MESTRA.toString("base64");
    process.env.GROQ_API_KEY = "gsk_env_fallback";
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    delete process.env.GROQ_API_KEY;
    consoleError.mockRestore();
  });

  it("banco (cifrado) vence a env var", async () => {
    const admin = makeAdmin({
      credencial: { data: { valor_cifrado: cifrar("gsk_do_banco", CHAVE_MESTRA) }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial } = await import("@/lib/credenciais/queries");

    expect(await getCredencial("groq_api_key")).toBe("gsk_do_banco");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("sem linha no banco → env var", async () => {
    const admin = makeAdmin({ credencial: { data: null, error: null } });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial } = await import("@/lib/credenciais/queries");

    expect(await getCredencial("groq_api_key")).toBe("gsk_env_fallback");
  });

  it("sem linha e sem env → null", async () => {
    delete process.env.GROQ_API_KEY;
    const admin = makeAdmin({ credencial: { data: null, error: null } });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial } = await import("@/lib/credenciais/queries");

    expect(await getCredencial("groq_api_key")).toBeNull();
  });

  it("erro do banco (ex.: tabela ausente) → env var + console.error", async () => {
    const admin = makeAdmin({
      credencial: { data: null, error: { message: 'relation "credencial" does not exist' } },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial } = await import("@/lib/credenciais/queries");

    expect(await getCredencial("groq_api_key")).toBe("gsk_env_fallback");
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError.mock.calls[0]!.map(String).join(" ")).toContain("leitura falhou");
  });

  it("chave-mestra ausente com valor no banco → env var + console.error, sem lançar", async () => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    const admin = makeAdmin({
      credencial: { data: { valor_cifrado: cifrar("gsk_do_banco", CHAVE_MESTRA) }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial } = await import("@/lib/credenciais/queries");

    expect(await getCredencial("groq_api_key")).toBe("gsk_env_fallback");
    expect(consoleError.mock.calls[0]!.map(String).join(" ")).toContain("CREDENCIAIS_MASTER_KEY");
  });

  it("cache de 60 s: segunda chamada não consulta o banco; invalidar força nova leitura", async () => {
    const admin = makeAdmin({
      credencial: { data: { valor_cifrado: cifrar("gsk_do_banco", CHAVE_MESTRA) }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { getCredencial, invalidarCacheCredencial } = await import("@/lib/credenciais/queries");

    await getCredencial("groq_api_key");
    await getCredencial("groq_api_key");
    expect(admin.client.from).toHaveBeenCalledTimes(1);

    invalidarCacheCredencial("groq_api_key");
    await getCredencial("groq_api_key");
    expect(admin.client.from).toHaveBeenCalledTimes(2);

    await getCredencial("groq_api_key", { semCache: true });
    expect(admin.client.from).toHaveBeenCalledTimes(3);
  });
});

describe("listarCredenciais", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CREDENCIAIS_MASTER_KEY = CHAVE_MESTRA.toString("base64");
    process.env.GROQ_API_KEY = "gsk_env_fallback";
    delete process.env.OPENAI_API_KEY;
    delete process.env.RESEND_API_KEY;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    delete process.env.GROQ_API_KEY;
    vi.restoreAllMocks();
  });

  it("classifica origem (banco / env / ausente), resolve o autor e NUNCA expõe o segredo", async () => {
    const admin = makeAdmin({
      credencial: {
        data: [
          {
            chave: "openai_api_key",
            ultimos4: "9zZ1",
            atualizado_em: "2026-08-28T12:00:00.000Z",
            atualizado_por: "u-helio",
          },
        ],
        error: null,
      },
      usuario: { data: [{ id: "u-helio", nome: "Helio Barbosa" }], error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { listarCredenciais } = await import("@/lib/credenciais/queries");

    const { itens, masterKeyOk } = await listarCredenciais();
    const porChave = Object.fromEntries(itens.map((i) => [i.chave, i]));

    expect(masterKeyOk).toBe(true);
    expect(porChave.openai_api_key).toMatchObject({
      origem: "banco",
      ultimos4: "9zZ1",
      atualizadoPor: "Helio Barbosa",
      gerenciavel: true,
      testavel: true,
    });
    expect(porChave.groq_api_key).toMatchObject({ origem: "env", ultimos4: null });
    expect(porChave.resend_api_key).toMatchObject({ origem: "ausente", gerenciavel: false });

    const serializado = JSON.stringify(itens);
    expect(serializado).not.toContain("valor_cifrado");
    expect(serializado).not.toContain("gsk_env_fallback");
  });

  it("tabela ausente → lista via env e masterKeyOk reflete a env", async () => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    const admin = makeAdmin({
      credencial: { data: null, error: { message: 'relation "credencial" does not exist' } },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { listarCredenciais } = await import("@/lib/credenciais/queries");

    const { itens, masterKeyOk } = await listarCredenciais();
    expect(masterKeyOk).toBe(false);
    expect(itens.find((i) => i.chave === "groq_api_key")?.origem).toBe("env");
    expect(itens.find((i) => i.chave === "openai_api_key")?.origem).toBe("ausente");
    expect(admin.chamadas).toEqual(["credencial"]); // sem autores, não consulta usuario
  });

  it("env alternativa: na AWS o Google OAuth aparece via COGNITO_CLIENT_SECRET", async () => {
    delete process.env.GOOGLE_CLIENT_SECRET;
    process.env.COGNITO_CLIENT_SECRET = "cognito-secret";
    mocks.createAdminClient.mockReturnValue(
      makeAdmin({ credencial: { data: [], error: null } }).client,
    );
    const { listarCredenciais } = await import("@/lib/credenciais/queries");

    const { itens } = await listarCredenciais();
    const google = itens.find((i) => i.chave === "google_client_secret");
    expect(google).toMatchObject({ origem: "env", envVar: "COGNITO_CLIENT_SECRET" });
    expect(JSON.stringify(itens)).not.toContain("cognito-secret");

    delete process.env.COGNITO_CLIENT_SECRET;
    const { listarCredenciais: listar2 } = await import("@/lib/credenciais/queries");
    const { itens: itens2 } = await listar2();
    expect(itens2.find((i) => i.chave === "google_client_secret")).toMatchObject({
      origem: "ausente",
      envVar: "GOOGLE_CLIENT_SECRET",
    });
  });
});
