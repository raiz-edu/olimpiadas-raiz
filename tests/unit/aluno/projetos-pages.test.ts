import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import ProjetosPage from "@/app/aluno/(area)/projetos/page";
import ProjetoPage from "@/app/aluno/(area)/projeto/[id]/page";
import AulaPage from "@/app/aluno/(area)/aula/[id]/page";
import { ALUNO_SESSION_COOKIE, signStudentCookie } from "@/lib/auth/student-cookie";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  createAdminClient: vi.fn(),
  createServerClient: vi.fn(() => {
    throw new Error("O aluno não tem sessão Supabase.");
  }),
}));

vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));

type Row = Record<string, unknown>;
type Table = "aluno" | "inscricao" | "preparacao_projeto" | "preparacao_aula";
type Result = { data: Row | Row[] | null; error: { message: string } | null };
type Query = {
  select: (columns: string) => Query;
  eq: (column: string, value: unknown) => Query;
  neq: (column: string, value: unknown) => Query;
  is: (column: string, value: unknown) => Query;
  or: (expression: string) => Query;
  order: (column: string, options?: unknown) => Promise<Result>;
  maybeSingle: () => Promise<Result>;
  single: () => Promise<Result>;
  then: (resolve: (result: Result) => unknown) => Promise<unknown>;
};

const ALUNO_ID = "aluno-1";
const PROJETO_ID = "projeto-1";
const AULA_ID = "aula-1";
const OLIMPIADA_ID = "olimpiada-1";

function makeDatabase() {
  const material = {
    id: "material-1",
    nome: "Material da aula",
    arquivo_path: "material.pdf",
    criado_em: "2026-10-06T12:00:00Z",
  };
  const aula = {
    id: AULA_ID,
    projeto_id: PROJETO_ID,
    titulo: "Vídeo publicado",
    tipo: "online",
    modalidade_online: "gravada",
    data_hora: null,
    duracao_minutos: 300,
    link_aula: "https://youtu.be/video_123",
    ordem: 1,
    publicada: true,
    materiais: [material],
  };
  const projeto: Row = {
    id: PROJETO_ID,
    nome: "Projeto geral",
    olimpiada_sigla: "OBMEP",
    olimpiada_id: null,
    ano_letivo: 2026,
    publicado: true,
    ativo: true,
    aulas: [
      aula,
      { ...aula, id: "aula-rascunho", titulo: "Vídeo não publicado", publicada: false },
      { ...aula, id: "simulado-1", titulo: "Simulado da área própria", tipo: "simulado" },
    ],
  };
  const tables: Record<Table, Row[]> = {
    aluno: [{ id: ALUNO_ID, ativo: true, turma_id: null, marca_id: null }],
    inscricao: [],
    preparacao_projeto: [projeto],
    preparacao_aula: [{ ...aula, projeto }],
  };
  const errors: Partial<Record<Table, string>> = {};
  const createSignedUrl = vi.fn(async () => ({
    data: { signedUrl: "https://storage.example/material.pdf" },
    error: null,
  }));

  const client = {
    from: vi.fn((table: Table) => {
      const filters: Array<(row: Row) => boolean> = [];
      const result = (single = false): Result => {
        if (errors[table]) return { data: null, error: { message: errors[table] } };
        const rows = tables[table].filter((row) => filters.every((filter) => filter(row)));
        return { data: single ? (rows[0] ?? null) : rows, error: null };
      };
      const query: Query = {
        select: () => query,
        eq: (column, value) => {
          filters.push((row) => row[column] === value);
          return query;
        },
        neq: (column, value) => {
          filters.push((row) => row[column] !== value);
          return query;
        },
        is: (column, value) => query.eq(column, value),
        // A autorização final também precisa funcionar além dos filtros do PostgREST.
        or: () => query,
        order: async () => result(),
        maybeSingle: async () => result(true),
        single: async () => result(true),
        then: (resolve) => Promise.resolve(result()).then(resolve),
      };
      return query;
    }),
    storage: { from: vi.fn(() => ({ createSignedUrl })) },
  };
  return { client, tables, errors, projeto, createSignedUrl };
}

const paginas = [
  { nome: "lista", abrir: () => ProjetosPage() },
  { nome: "projeto", abrir: () => ProjetoPage({ params: Promise.resolve({ id: PROJETO_ID }) }) },
  { nome: "aula", abrir: () => AulaPage({ params: Promise.resolve({ id: AULA_ID }) }) },
];
const paginasDiretas = paginas.slice(1);

describe("projetos e vídeos com a sessão própria do aluno", () => {
  let db: ReturnType<typeof makeDatabase>;
  let cookie: string | null;
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("SESSION_SIGNING_SECRET", "segredo-exclusivo-dos-testes-de-projetos");
    db = makeDatabase();
    cookie = signStudentCookie(ALUNO_ID);
    mocks.createAdminClient.mockReturnValue(db.client);
    mocks.cookies.mockImplementation(async () => ({
      get: (name: string) =>
        name === ALUNO_SESSION_COOKIE && cookie ? { name, value: cookie } : undefined,
      getAll: () => (cookie ? [{ name: ALUNO_SESSION_COOKIE, value: cookie }] : []),
    }));
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
    vi.unstubAllEnvs();
  });

  it.each(paginas)(
    "$nome exige cookie próprio válido antes de consultar o banco",
    async (pagina) => {
      cookie = null;
      await expect(pagina.abrir()).rejects.toThrow("redirect:/aluno/login");
      cookie = "cookie-sem-assinatura-válida";
      await expect(pagina.abrir()).rejects.toThrow("redirect:/aluno/login");
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    },
  );

  it.each(paginas)("$nome recusa aluno inativo mesmo com cookie assinado", async (pagina) => {
    db.tables.aluno[0]!.ativo = false;
    await expect(pagina.abrir()).rejects.toThrow("redirect:/aluno/login");
    expect(db.client.from.mock.calls.map(([table]) => table)).toEqual(["aluno"]);
  });

  it.each(paginas)(
    "$nome abre projeto geral com aluno_session e sem sessão Supabase",
    async (pagina) => {
      const html = renderToStaticMarkup(await pagina.abrir());
      expect(html).toContain(pagina.nome === "aula" ? "Vídeo publicado" : "Projeto geral");
      expect(mocks.createServerClient).not.toHaveBeenCalled();
      if (pagina.nome === "aula") {
        expect(html).toContain("https://www.youtube.com/embed/video_123");
        expect(html).toContain("https://storage.example/material.pdf");
      }
      if (pagina.nome === "projeto") {
        expect(html).toContain("Vídeo publicado");
        expect(html).not.toContain("Vídeo não publicado");
        expect(html).not.toContain("Simulado da área própria");
      }
      expect(db.client.from.mock.calls.map(([table]) => table)).not.toContain("questao");
    },
  );

  it("a lista só mostra projetos publicados, ativos e elegíveis para o aluno", async () => {
    db.tables.preparacao_projeto.push(
      { ...db.projeto, id: "privado", nome: "Projeto restrito", olimpiada_id: OLIMPIADA_ID },
      { ...db.projeto, id: "inativo", nome: "Projeto inativo", ativo: false },
      { ...db.projeto, id: "rascunho", nome: "Projeto não publicado", publicado: false },
    );
    let html = renderToStaticMarkup(await ProjetosPage());
    expect(html).toContain("Projeto geral");
    expect(html).not.toContain("Projeto restrito");
    expect(html).not.toContain("Projeto inativo");
    expect(html).not.toContain("Projeto não publicado");

    db.tables.inscricao.push({
      aluno_id: ALUNO_ID,
      olimpiada_id: OLIMPIADA_ID,
      status: "confirmada",
    });
    html = renderToStaticMarkup(await ProjetosPage());
    expect(html).toContain("Projeto restrito");
  });

  it.each(paginasDiretas)(
    "$nome permite projeto restrito com inscrição confirmada",
    async (pagina) => {
      db.projeto.olimpiada_id = OLIMPIADA_ID;
      db.tables.inscricao.push({
        aluno_id: ALUNO_ID,
        olimpiada_id: OLIMPIADA_ID,
        status: "confirmada",
      });
      await expect(pagina.abrir()).resolves.toBeDefined();
      expect(db.createSignedUrl).toHaveBeenCalled();
    },
  );

  it.each(paginasDiretas)(
    "$nome recusa link restrito sem inscrição confirmada do aluno",
    async (pagina) => {
      db.projeto.olimpiada_id = OLIMPIADA_ID;
      db.tables.inscricao.push(
        { aluno_id: ALUNO_ID, olimpiada_id: OLIMPIADA_ID, status: "pendente" },
        { aluno_id: ALUNO_ID, olimpiada_id: "outra-olimpiada", status: "confirmada" },
        { aluno_id: "outro-aluno", olimpiada_id: OLIMPIADA_ID, status: "confirmada" },
      );
      await expect(pagina.abrir()).rejects.toThrow("notFound");
      expect(db.createSignedUrl).not.toHaveBeenCalled();
    },
  );

  it.each(paginasDiretas)(
    "$nome recusa projeto inativo ou não publicado em link direto",
    async (pagina) => {
      db.projeto.ativo = false;
      await expect(pagina.abrir()).rejects.toThrow("notFound");
      db.projeto.ativo = true;
      db.projeto.publicado = false;
      await expect(pagina.abrir()).rejects.toThrow("notFound");
      expect(db.createSignedUrl).not.toHaveBeenCalled();
    },
  );

  it("recusa aula não publicada, simulado e aula sem projeto elegível", async () => {
    db.tables.preparacao_aula[0]!.publicada = false;
    await expect(AulaPage({ params: Promise.resolve({ id: AULA_ID }) })).rejects.toThrow(
      "notFound",
    );
    db.tables.preparacao_aula[0]!.publicada = true;
    db.tables.preparacao_aula[0]!.tipo = "simulado";
    await expect(AulaPage({ params: Promise.resolve({ id: AULA_ID }) })).rejects.toThrow(
      "notFound",
    );
    db.tables.preparacao_aula[0]!.tipo = "online";
    db.tables.preparacao_aula[0]!.projeto = null;
    await expect(AulaPage({ params: Promise.resolve({ id: AULA_ID }) })).rejects.toThrow(
      "notFound",
    );
    expect(db.createSignedUrl).not.toHaveBeenCalled();
  });

  it.each(paginasDiretas)("$nome devolve 404 para recurso inexistente", async (pagina) => {
    db.tables.preparacao_projeto = [];
    db.tables.preparacao_aula = [];
    await expect(pagina.abrir()).rejects.toThrow("notFound");
    expect(db.createSignedUrl).not.toHaveBeenCalled();
  });

  it.each(paginas)(
    "$nome propaga falha de inscrição sem mostrar lista vazia ou conceder acesso",
    async (pagina) => {
      db.errors.inscricao = "Falha de conexão com o banco";
      await expect(pagina.abrir()).rejects.toThrow("Não foi possível carregar os projetos");
      expect(consoleError).toHaveBeenCalledWith(
        "[projetos] Falha ao consultar inscrições:",
        "Falha de conexão com o banco",
      );
      expect(db.createSignedUrl).not.toHaveBeenCalled();
    },
  );

  it.each(paginas)("$nome distingue falha de consulta de ausência de conteúdo", async (pagina) => {
    db.errors[pagina.nome === "aula" ? "preparacao_aula" : "preparacao_projeto"] =
      "Falha de conexão com o banco";
    await expect(pagina.abrir()).rejects.toThrow("Não foi possível carregar");
    expect(consoleError).toHaveBeenCalled();
    expect(db.createSignedUrl).not.toHaveBeenCalled();
  });
});
