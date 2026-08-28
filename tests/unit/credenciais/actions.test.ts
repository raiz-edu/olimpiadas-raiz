/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SPEC issue #159 — CA3 (gate duplo + gravação cifrada + auditoria sem segredo)

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  createAdminClient: vi.fn(),
  registrarAuditoria: vi.fn<(evento: unknown) => Promise<void>>(async () => {}),
  testarChave: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ getServerSession: mocks.getServerSession }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@/lib/audit", () => ({ registrarAuditoria: mocks.registrarAuditoria }));
vi.mock("@/lib/credenciais/testar", () => ({ testarChave: mocks.testarChave }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

type Resultado = { data: unknown; error: { message: string } | null };

function makeAdmin(opts: { anterior?: Resultado; salvo?: Resultado } = {}) {
  const upserts: any[] = [];
  const deletes: string[] = [];
  const anterior = opts.anterior ?? { data: null, error: null };
  const salvo = opts.salvo ?? { data: { id: "cred-1" }, error: null };
  const chain = (): any => {
    const q: any = {};
    for (const m of ["select", "eq", "in"]) q[m] = vi.fn(() => q);
    q.maybeSingle = vi.fn(async () => anterior);
    q.single = vi.fn(async () => salvo);
    q.upsert = vi.fn((payload: unknown) => {
      upserts.push(payload);
      return q;
    });
    q.delete = vi.fn(() => {
      deletes.push("delete");
      return q;
    });
    q.then = (resolve: (r: Resultado) => void) => resolve({ data: null, error: null });
    return q;
  };
  return { upserts, deletes, client: { from: vi.fn(() => chain()) } };
}

function sessao(role: string, email: string, id = "u-1") {
  return { user: { id, role, email, admin_marca: false }, supabaseUserId: id };
}

function form(campos: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) fd.set(k, v);
  return fd;
}

const HELIO = "helio.barbosa@raizeducacao.com.br";
const CHAVE_MESTRA = Buffer.alloc(32, 5).toString("base64");

describe("salvarCredencial", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CREDENCIAIS_MASTER_KEY = CHAVE_MESTRA;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.restoreAllMocks();
  });

  it("professor → Não autorizado, sem tocar no banco", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("professor", "prof@colegioapogeu.com.br"));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    const r = await salvarCredencial(
      null,
      form({ chave: "openai_api_key", valor: "sk-live-abcdefgh1234" }),
    );
    expect(r).toEqual({ error: "Não autorizado" });
    expect(admin.client.from).not.toHaveBeenCalled();
  });

  it("raiz com e-mail fora de ADMIN_EMAILS → Não autorizado", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", "outro.admin@raizeducacao.com.br"));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    const r = await salvarCredencial(
      null,
      form({ chave: "openai_api_key", valor: "sk-live-abcdefgh1234" }),
    );
    expect(r).toEqual({ error: "Não autorizado" });
    expect(admin.client.from).not.toHaveBeenCalled();
  });

  it("Helio grava cifrado (nunca o texto claro), com últimos 4, autor e auditoria sem segredo", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO, "u-helio"));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    const r = await salvarCredencial(
      null,
      form({ chave: "openai_api_key", valor: "  sk-live-abcdefgh1234  " }),
    );

    expect(r).toEqual({ ok: true, message: "Chave da OpenAI salva (····1234)." });
    expect(admin.upserts).toHaveLength(1);
    const payload = admin.upserts[0];
    expect(payload).toMatchObject({
      chave: "openai_api_key",
      ultimos4: "1234",
      atualizado_por: "u-helio",
    });
    expect(payload.valor_cifrado.startsWith("v1:")).toBe(true);
    expect(JSON.stringify(payload)).not.toContain("sk-live-abcdefgh1234");

    expect(mocks.registrarAuditoria).toHaveBeenCalledTimes(1);
    const auditoria = mocks.registrarAuditoria.mock.calls[0]![0];
    expect(auditoria).toMatchObject({
      usuarioId: "u-helio",
      entidade: "credencial",
      entidadeId: "cred-1",
      acao: "create",
      antes: null,
      depois: { chave: "openai_api_key", ultimos4: "1234" },
    });
    expect(JSON.stringify(auditoria)).not.toContain("sk-live-abcdefgh1234");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/configuracoes/credenciais");
  });

  it("substituição de chave existente audita como update com os últimos 4 anteriores", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO, "u-helio"));
    const admin = makeAdmin({
      anterior: { data: { id: "cred-1", ultimos4: "AAAA" }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    await salvarCredencial(null, form({ chave: "openai_api_key", valor: "sk-live-novachave9999" }));
    expect(mocks.registrarAuditoria.mock.calls[0]![0]).toMatchObject({
      acao: "update",
      antes: { chave: "openai_api_key", ultimos4: "AAAA" },
      depois: { chave: "openai_api_key", ultimos4: "9999" },
    });
  });

  it("chave curta → erro; integração não gerenciável → erro; nada gravado", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    expect(await salvarCredencial(null, form({ chave: "openai_api_key", valor: "abc" }))).toEqual({
      error: "Cole a chave completa antes de salvar.",
    });
    expect(
      await salvarCredencial(null, form({ chave: "resend_api_key", valor: "re_abcdefgh1234" })),
    ).toEqual({
      error: "Integração desconhecida.",
    });
    expect(admin.upserts).toHaveLength(0);
  });

  it("só SESSION_SIGNING_SECRET → grava com a chave derivada (provisória)", async () => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    process.env.SESSION_SIGNING_SECRET = "segredo-de-sessao-de-teste";
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO, "u-helio"));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    const r = await salvarCredencial(
      null,
      form({ chave: "openai_api_key", valor: "sk-live-abcdefgh1234" }),
    );
    expect(r).toEqual({ ok: true, message: "Chave da OpenAI salva (····1234)." });
    expect(admin.upserts[0].valor_cifrado.startsWith("v1:")).toBe(true);
    expect(JSON.stringify(admin.upserts[0])).not.toContain("sk-live-abcdefgh1234");
    delete process.env.SESSION_SIGNING_SECRET;
  });

  it("sem CREDENCIAIS_MASTER_KEY nem SESSION_SIGNING_SECRET → erro com instrução, nada gravado", async () => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    delete process.env.SESSION_SIGNING_SECRET;
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO));
    const admin = makeAdmin();
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { salvarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    const r = await salvarCredencial(
      null,
      form({ chave: "openai_api_key", valor: "sk-live-abcdefgh1234" }),
    );
    expect(r && "error" in r && r.error).toContain("CREDENCIAIS_MASTER_KEY");
    expect(admin.upserts).toHaveLength(0);
  });
});

describe("testarCredencial", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.CREDENCIAIS_MASTER_KEY = CHAVE_MESTRA;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    delete process.env.CREDENCIAIS_MASTER_KEY;
    delete process.env.OPENAI_API_KEY;
    vi.restoreAllMocks();
  });

  it("sem chave configurada → erro nomeando a integração", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO));
    mocks.createAdminClient.mockReturnValue(makeAdmin().client);
    const { testarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    expect(await testarCredencial(null, form({ chave: "openai_api_key" }))).toEqual({
      error: "Nenhuma chave configurada para OpenAI.",
    });
    expect(mocks.testarChave).not.toHaveBeenCalled();
  });

  it("com chave (via env) chama o provedor certo e repassa o resultado", async () => {
    process.env.OPENAI_API_KEY = "sk-env-xyz";
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO));
    mocks.createAdminClient.mockReturnValue(makeAdmin().client);
    mocks.testarChave.mockResolvedValue({
      ok: true,
      detalhe: "Chave aceita — 3 modelos disponíveis.",
    });
    const { testarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    expect(await testarCredencial(null, form({ chave: "openai_api_key" }))).toEqual({
      ok: true,
      message: "Chave aceita — 3 modelos disponíveis.",
    });
    expect(mocks.testarChave).toHaveBeenCalledWith("openai", "sk-env-xyz");
  });

  it("professor → Não autorizado, sem chamar o provedor", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("professor", "prof@colegioapogeu.com.br"));
    const { testarCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    expect(await testarCredencial(null, form({ chave: "openai_api_key" }))).toEqual({
      error: "Não autorizado",
    });
    expect(mocks.testarChave).not.toHaveBeenCalled();
  });
});

describe("removerCredencial", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("Helio remove e audita delete com os últimos 4; professor não remove", async () => {
    mocks.getServerSession.mockResolvedValue(sessao("raiz", HELIO, "u-helio"));
    const admin = makeAdmin({
      anterior: { data: { id: "cred-1", ultimos4: "1234" }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin.client);
    const { removerCredencial } =
      await import("@/app/(protected)/configuracoes/credenciais/actions");

    await removerCredencial(form({ chave: "openai_api_key" }));
    expect(admin.deletes).toEqual(["delete"]);
    expect(mocks.registrarAuditoria.mock.calls[0]![0]).toMatchObject({
      acao: "delete",
      entidadeId: "cred-1",
      antes: { chave: "openai_api_key", ultimos4: "1234" },
      depois: null,
    });

    vi.clearAllMocks();
    mocks.getServerSession.mockResolvedValue(sessao("professor", "prof@colegioapogeu.com.br"));
    const admin2 = makeAdmin({
      anterior: { data: { id: "cred-1", ultimos4: "1234" }, error: null },
    });
    mocks.createAdminClient.mockReturnValue(admin2.client);
    await removerCredencial(form({ chave: "openai_api_key" }));
    expect(admin2.deletes).toEqual([]);
    expect(mocks.registrarAuditoria).not.toHaveBeenCalled();
  });
});
