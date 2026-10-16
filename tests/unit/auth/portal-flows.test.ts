import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getStudentSession } from "@/lib/auth/student-session";
import { concluirCadastroPortal } from "@/app/aluno/cadastro/actions";
import CadastroPortalPage from "@/app/aluno/cadastro/page";
import { loginAluno, logoutAluno } from "@/app/aluno/login/actions";
import { GET as googleCallback } from "@/app/api/auth/google/callback/route";
import { POST as trocarPopup } from "@/app/api/auth/popup-session/route";
import PopupCallbackPage from "@/app/auth/popup-callback/page";
import { getSimuladosDisponiveis, getOrCreateSessao } from "@/app/aluno/(area)/simulados/actions";
import {
  ALUNO_SESSION_COOKIE,
  ALUNO_PENDING_COOKIE,
  signStudentCookie,
  signPopupHandoff,
} from "@/lib/auth/student-cookie";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  admin: vi.fn(),
  verify: vi.fn(),
  jwt: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.verify }));
vi.mock("jose", () => ({ createRemoteJWKSet: vi.fn(), jwtVerify: mocks.jwt }));

type Row = Record<string, unknown>;
const A = "10000000-0000-4000-8000-000000000001";
const U = "30000000-0000-4000-8000-000000000001";
const full = (): Row => ({
  id: A,
  email: "pessoa@colegioapogeu.com.br",
  nome: "Conta sintética",
  ativo: true,
  tipo_usuario: "aluno",
  marca_id: "marca",
  unidade_id: U,
  serie: "6º",
  turma_id: null,
  ra_totvs: null,
  cadastro_concluido_em: "2026-10-16T12:00:00Z",
  consentimento_responsavel: true,
  supabase_auth_id: "auth-id",
});
function database() {
  const tables: Record<string, Row[]> = {
    aluno: [full()],
    marca: [{ id: "marca", slug: "apogeu" }],
    usuario: [{ id: "auth-id", ativo: true }],
  };
  const errors: Record<string, { code: string; message: string } | undefined> = {};
  let updateError = false;
  const writes = vi.fn();
  const rpc = vi.fn(() => ({
    abortSignal: async () => ({ error: null }),
    then: (resolve: (v: unknown) => unknown) => Promise.resolve({ error: null }).then(resolve),
  }));
  const from = vi.fn((table: string) => {
    const filters: [string, unknown][] = [];
    let update: Row | null = null;
    const result = (many = false) => {
      if (errors[table]) return { data: null, error: errors[table] };
      const rows = (tables[table] ?? []).filter((row) =>
        filters.every(([k, v]) => (Array.isArray(v) ? v.includes(row[k]) : row[k] === v)),
      );
      if (update) {
        if (updateError) return { data: null, error: { code: "57014" } };
        rows.forEach((row) => Object.assign(row, update));
        writes(table, update, filters);
      }
      return { data: many ? rows : (rows[0] ?? null), error: null };
    };
    const q = {
      select: () => q,
      eq: (key: string, value: unknown) => {
        filters.push([key, value]);
        return q;
      },
      update: (patch: Row) => {
        update = patch;
        return q;
      },
      insert: (row: Row) => {
        writes(table, row);
        (tables[table] ??= []).push({ id: A, ...row });
        return q;
      },
      maybeSingle: async () => result(),
      single: async () => result(),
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result(true)).then(resolve),
    };
    return q;
  });
  return {
    tables,
    errors,
    writes,
    rpc,
    from,
    failUpdate: () => {
      updateError = true;
    },
  };
}
let db: ReturnType<typeof database>;
let jar: Map<string, string>;
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([k, v]) => data.set(k, v));
  return data;
};
const signedIn = () => jar.set(ALUNO_SESSION_COOKIE, signStudentCookie(A));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SESSION_SIGNING_SECRET", "chave-exclusiva-deste-teste-sem-dados-reais");
  db = database();
  jar = new Map();
  mocks.admin.mockReturnValue(db);
  mocks.cookies.mockResolvedValue({
    get: (key: string) => (jar.has(key) ? { value: jar.get(key) } : undefined),
    set: (key: string, value: string) => jar.set(key, value),
    delete: (key: string) => jar.delete(key),
    getAll: () => [],
  });
  mocks.verify.mockReturnValue({
    auth: {
      signInWithPassword: vi.fn(async () => ({ data: { user: { id: "auth-id" } }, error: null })),
      signInWithIdToken: vi.fn(async () => ({ error: null })),
      getUser: vi.fn(async () => ({ data: { user: { id: "auth-id" } } })),
    },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("sessão de estudo e primeiro acesso", () => {
  it.each(["", "1"])("cadastro sem sessão retorna ao login preservando popup=%s", async (popup) => {
    const destino = `redirect:/aluno/login${popup === "1" ? "?popup=1" : ""}`;
    await expect(CadastroPortalPage({ searchParams: Promise.resolve({ popup }) })).rejects.toThrow(
      destino,
    );
    await expect(concluirCadastroPortal(null, form({ popup }))).rejects.toThrow(destino);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("série declarada não libera nem inicia simulado restrito por série", async () => {
    signedIn();
    Object.assign(db.tables.aluno![0]!, { serie: null, serie_cadastro: "3º EM" });
    db.tables.preparacao_aula = [
      {
        id: "simulado-restrito",
        titulo: "Restrito",
        tipo: "simulado",
        publicada: true,
        projeto_id: null,
        projeto_ids: [],
        turma_ids: [],
        series_elegiveis: ["3º EM"],
      },
    ];
    db.tables.inscricao = [];
    expect(await getSimuladosDisponiveis()).toEqual([]);
    expect(await getOrCreateSessao("simulado-restrito")).toBeNull();
    expect(db.from.mock.calls.map(([table]) => table)).not.toContain("simulado_sessao");
  });
  it("não aceita cookie adulterado ou registro desativado", async () => {
    jar.set(ALUNO_SESSION_COOKIE, "adulterado");
    expect(await getStudentSession()).toBeNull();
    signedIn();
    db.tables.aluno![0]!.ativo = false;
    expect(await getStudentSession()).toBeNull();
  });
  it("bloqueia páginas e ações pelo mesmo guard, sem impedir a leitura do próprio cadastro", async () => {
    signedIn();
    db.tables.aluno![0]!.tipo_usuario = "pendente";
    await expect(getStudentSession()).rejects.toThrow("redirect:/aluno/cadastro");
    expect(await getStudentSession({ permitirCadastroIncompleto: true })).toBeTruthy();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it("cookie antigo não dispensa autorização; profissional não precisa de responsável", async () => {
    signedIn();
    db.tables.aluno![0]!.consentimento_responsavel = false;
    await expect(getStudentSession()).rejects.toThrow("redirect:/aluno/login?consentimento=1");
    db.tables.aluno![0]!.tipo_usuario = "professor";
    expect(await getStudentSession()).toBeTruthy();
  });
  it("não confia em ID ou marca enviados no formulário e preserva popup", async () => {
    signedIn();
    Object.assign(db.tables.aluno![0]!, { tipo_usuario: "pendente", cadastro_concluido_em: null });
    await expect(
      concluirCadastroPortal(
        null,
        form({
          tipo_usuario: "aluno",
          unidade_id: U,
          serie: "6º",
          aluno_id: "outro-id",
          marca_id: "outra",
          popup: "1",
        }),
      ),
    ).rejects.toThrow("redirect:/aluno/cadastro?popup=1");
    expect(db.rpc).toHaveBeenCalledWith("concluir_cadastro_portal", {
      p_aluno_id: A,
      p_tipo: "aluno",
      p_unidade_id: U,
      p_serie: "6º",
    });
  });
  it("recusa autodeclaração profissional de aluno identificado antes da RPC", async () => {
    signedIn();
    Object.assign(db.tables.aluno![0]!, {
      tipo_usuario: "pendente",
      cadastro_concluido_em: null,
      ra_totvs: "001",
    });
    const result = await concluirCadastroPortal(null, form({ tipo_usuario: "professor" }));
    expect(result?.error).toContain("identifica um aluno");
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("falha de banco não conclui cadastro e devolve erro recuperável", async () => {
    signedIn();
    Object.assign(db.tables.aluno![0]!, { tipo_usuario: "pendente", cadastro_concluido_em: null });
    db.rpc.mockReturnValueOnce({
      abortSignal: async () => ({ error: { code: "57014" } }),
    } as never);
    expect(
      (await concluirCadastroPortal(null, form({ tipo_usuario: "professor" })))?.error,
    ).toContain("Tente novamente");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
});

describe("senha e autorização", () => {
  it("senha válida segue cadastro, mantendo a sessão da equipe independente", async () => {
    Object.assign(db.tables.aluno![0]!, { tipo_usuario: null, cadastro_concluido_em: null });
    await expect(
      loginAluno(null, form({ email: "pessoa@colegioapogeu.com.br", password: "senha-sintetica" })),
    ).rejects.toThrow("redirect:/aluno/cadastro");
    expect(jar.get(ALUNO_SESSION_COOKIE)).toBe(signStudentCookie(A));
    expect(db.rpc).toHaveBeenCalledWith("registrar_login_aluno", { p_aluno_id: A });
  });
  it("mantém formulário de autorização após validação ou erro ao salvar", async () => {
    signedIn();
    db.tables.aluno![0]!.consentimento_responsavel = false;
    expect(
      await loginAluno(null, form({ responsavel_nome: "Responsável sintético" })),
    ).toMatchObject({ needsConsent: true, error: expect.any(String) });
    db.failUpdate();
    expect(
      await loginAluno(
        null,
        form({
          responsavel_nome: "Responsável sintético",
          responsavel_tipo: "pedagogico",
          consentimento_aceito: "on",
        }),
      ),
    ).toMatchObject({ needsConsent: true, error: expect.stringContaining("salvar") });
    expect(db.tables.aluno![0]!.consentimento_responsavel).toBe(false);
  });
  it("só libera popup depois de persistir a autorização", async () => {
    signedIn();
    db.tables.aluno![0]!.consentimento_responsavel = false;
    await expect(
      loginAluno(
        null,
        form({
          responsavel_nome: "Responsável sintético",
          responsavel_tipo: "pedagogico",
          consentimento_aceito: "on",
          popup: "1",
        }),
      ),
    ).rejects.toThrow("redirect:/auth/popup-callback");
    expect(db.tables.aluno![0]!.consentimento_responsavel).toBe(true);
  });
  it("logout remove apenas os cookies de estudo", async () => {
    signedIn();
    jar.set("sb-equipe-auth-token", "sessao-staff");
    jar.set(ALUNO_PENDING_COOKIE, "pendente");
    await expect(logoutAluno()).rejects.toThrow("redirect:/aluno/login");
    expect(jar.get("sb-equipe-auth-token")).toBe("sessao-staff");
    expect(jar.has(ALUNO_SESSION_COOKIE)).toBe(false);
  });
});

describe("Google e popup", () => {
  const google = async (popup = false, mode = "aluno") => {
    const state = `nonce:${mode}${popup ? ":popup" : ""}`;
    jar.set("_goauth_state", state);
    mocks.jwt.mockResolvedValue({
      payload: {
        email: "pessoa@colegioapogeu.com.br",
        email_verified: true,
        name: "Conta sintética",
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ id_token: "token-sintetico", access_token: "acesso-sintetico" }),
            { status: 200 },
          ),
      ),
    );
    return googleCallback(
      new NextRequest(
        `https://olimpiadas.example/api/auth/google/callback?code=sintetico&state=${state}`,
      ),
    );
  };
  it("Google reutiliza identidade e histórico e encaminha incompletos ao cadastro", async () => {
    Object.assign(db.tables.aluno![0]!, { tipo_usuario: null, cadastro_concluido_em: null });
    const response = await google(true);
    expect(response.headers.get("location")).toBe(
      "https://olimpiadas.example/aluno/cadastro?popup=1",
    );
    expect(db.writes).not.toHaveBeenCalled();
    expect(jar.get(ALUNO_SESSION_COOKIE)).toBe(signStudentCookie(A));
  });
  it("Google não recria conta inativa nem escreve quando consulta falha", async () => {
    db.tables.aluno![0]!.ativo = false;
    expect((await google()).headers.get("location")).toContain("erro=inativo");
    expect(db.writes).not.toHaveBeenCalled();
    db.errors.aluno = { code: "57014", message: "indisponível" };
    expect((await google()).headers.get("location")).toContain("erro=oauth");
    expect(db.writes).not.toHaveBeenCalled();
  });
  it("Google novo cria identidade pendente, nunca papel de gestão", async () => {
    db.tables.aluno = [];
    const response = await google();
    expect(response.headers.get("location")).toContain("/aluno/cadastro");
    expect(db.tables.aluno[0]).toMatchObject({ tipo_usuario: "pendente", marca_id: "marca" });
    expect(db.from.mock.calls.map(([table]) => table)).not.toContain("usuario");
  });
  it("falha ao identificar marca não cria cadastro sem vínculo recuperável", async () => {
    db.tables.aluno = [];
    db.errors.marca = { code: "57014", message: "falha temporária" };
    expect((await google()).headers.get("location")).toContain("erro=oauth");
    expect(db.writes).not.toHaveBeenCalled();
    expect(jar.has(ALUNO_SESSION_COOKIE)).toBe(false);
  });
  it("o acesso de gestão existente continua com seu fluxo e papel", async () => {
    expect((await google(false, "staff")).headers.get("location")).toBe(
      "https://olimpiadas.example/dashboard",
    );
    expect(db.writes).not.toHaveBeenCalled();
    expect(jar.has(ALUNO_SESSION_COOKIE)).toBe(false);
  });
  it.each(["pendente", "sem-consentimento", "inativo"])(
    "handoff não emite nem aceita sessão para %s",
    async (estado) => {
      signedIn();
      const aluno = db.tables.aluno![0]!;
      if (estado === "pendente") aluno.cadastro_concluido_em = null;
      if (estado === "sem-consentimento") aluno.consentimento_responsavel = false;
      if (estado === "inativo") aluno.ativo = false;
      const request = new NextRequest("https://olimpiadas.example/api/auth/popup-session", {
        method: "POST",
        body: JSON.stringify({ handoff: signPopupHandoff(A) }),
      });
      expect((await trocarPopup(request)).status).toBe(401);
      if (estado !== "inativo") await expect(PopupCallbackPage()).rejects.toThrow("redirect:");
      else expect((await PopupCallbackPage()).props.handoff).toBeNull();
    },
  );
  it("handoff válido concluído produz cookie particionado; token adulterado é recusado", async () => {
    const request = (handoff: string) =>
      new NextRequest("https://olimpiadas.example/api/auth/popup-session", {
        method: "POST",
        body: JSON.stringify({ handoff }),
      });
    const response = await trocarPopup(request(signPopupHandoff(A)));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Partitioned");
    expect((await trocarPopup(request("adulterado"))).status).toBe(401);
  });
});
