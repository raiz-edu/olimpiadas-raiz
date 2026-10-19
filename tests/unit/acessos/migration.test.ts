import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const A = "10000000-0000-4000-8000-000000000001";
const B = "10000000-0000-4000-8000-000000000002";
const STAFF = "10000000-0000-4000-8000-000000000003";
const M = "20000000-0000-4000-8000-000000000001";
const OUTRA = "20000000-0000-4000-8000-000000000002";
const U = "30000000-0000-4000-8000-000000000001";
const AGORA = "2026-10-19T15:00:00Z";
const DESDE = "2026-10-12T15:00:00Z";
let db: PGlite;
type Linha = {
  pessoa_id: string;
  tipo_usuario: string;
  marca_id: string;
  unidade_id: string | null;
  serie: string | null;
  sessoes: number;
  acessou_periodo: boolean;
  estudou_periodo: boolean;
  ultimo_acesso: Date | null;
  criado_em: Date;
  medicao_desde: Date | null;
};
const ler = (marcas: string[] | null = null, desde: string | null = DESDE) =>
  db.query<Linha>("SELECT * FROM gestao_acessos($1, $2, $3) ORDER BY pessoa_id", [
    marcas,
    desde,
    AGORA,
  ]);
const registrar = (id = A, staff = false) =>
  db.query<{ id: string }>("SELECT registrar_acesso($1, $2) AS id", [
    staff ? null : id,
    staff ? id : null,
  ]);

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, last_sign_in_at timestamptz);
    CREATE TABLE marca(id uuid PRIMARY KEY, nome text);
    CREATE TABLE unidade(id uuid PRIMARY KEY, marca_id uuid REFERENCES marca(id));
    CREATE TABLE turma(id uuid PRIMARY KEY, unidade_id uuid REFERENCES unidade(id), serie text);
    CREATE TABLE aluno(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), email text, tipo_usuario text,
      ativo boolean DEFAULT true, turma_id uuid REFERENCES turma(id), marca_id uuid REFERENCES marca(id),
      unidade_id uuid REFERENCES unidade(id), serie text, serie_cadastro text,
      created_at timestamptz DEFAULT '2026-09-01', last_login_at timestamptz);
    CREATE TABLE usuario(id uuid PRIMARY KEY REFERENCES auth.users(id), email text, role text,
      ativo boolean DEFAULT true, marca_ativa_id uuid REFERENCES marca(id), created_at timestamptz DEFAULT '2026-10-01');
    CREATE TABLE resposta_aluno(aluno_id uuid REFERENCES aluno(id), respondido_em timestamptz);
    CREATE TABLE aluno_progresso(aluno_id uuid REFERENCES aluno(id), assistido boolean,
      progresso_segundos integer, updated_at timestamptz);
    INSERT INTO marca VALUES ('${M}', 'Marca A'), ('${OUTRA}', 'Marca B');
    INSERT INTO unidade VALUES ('${U}', '${M}');
    GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  `);
  await db.exec(readFileSync("supabase/migrations/20261019_060_acessos_participacao.sql", "utf8"));
}, 30_000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec(`TRUNCATE acesso_sessao, resposta_aluno, aluno_progresso, usuario, auth.users, aluno, turma;
    INSERT INTO aluno(id, email, tipo_usuario, marca_id, unidade_id, serie_cadastro)
      VALUES ('${A}', 'pessoa@escola.example', 'aluno', '${M}', '${U}', '6º');`);
});

describe("sessões de uso em PostgreSQL real", () => {
  it("consolida recargas, abas e acessos repetidos", async () => {
    const [a, b] = await Promise.all([registrar(), registrar()]);
    expect(a.rows[0]?.id).toBe(b.rows[0]?.id);
    expect((await db.query("SELECT * FROM acesso_sessao")).rows).toHaveLength(1);
  });
  it("inicia outra sessão a partir de 30 minutos de inatividade", async () => {
    await registrar();
    await db.exec(
      "UPDATE acesso_sessao SET iniciada_em = now() - interval '1 hour', ultima_atividade_em = now() - interval '30 minutes'",
    );
    await registrar();
    expect((await db.query("SELECT * FROM acesso_sessao")).rows).toHaveLength(2);
  });
  it("atividade antes de 30 minutos mantém a sessão", async () => {
    await registrar();
    await db.exec(
      "UPDATE acesso_sessao SET iniciada_em = now() - interval '1 hour', ultima_atividade_em = now() - interval '29 minutes'",
    );
    await registrar();
    expect((await db.query("SELECT * FROM acesso_sessao")).rows).toHaveLength(1);
  });
  it("associa portal e gestão pelo e-mail normalizado, sem sessão extra", async () => {
    await db.exec(`INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id) VALUES ('${STAFF}', ' PESSOA@escola.example ', 'professor', '${M}');`);
    const primeira = await registrar();
    const segunda = await registrar(STAFF, true);
    expect(segunda.rows[0]?.id).toBe(primeira.rows[0]?.id);
  });
  it("aceita perfil pendente, mas recusa identidade inativa ou desconhecida", async () => {
    await db.exec("UPDATE aluno SET tipo_usuario = 'pendente'");
    await registrar();
    await db.exec("UPDATE aluno SET ativo = false");
    await expect(registrar()).rejects.toThrow("Acesso indisponível");
    await expect(registrar(B)).rejects.toThrow("Acesso indisponível");
  });
  it("exige exatamente uma identidade fornecida pelo servidor", async () => {
    await expect(db.query("SELECT registrar_acesso()")).rejects.toThrow(
      "Identidade de acesso inválida",
    );
    await expect(db.query("SELECT registrar_acesso($1, $2)", [A, STAFF])).rejects.toThrow(
      "Identidade de acesso inválida",
    );
  });
  it.each(["anon", "authenticated"])(
    "%s não pode ler/gravar sessões nem executar RPCs",
    async (role) => {
      await db.exec(`SET ROLE ${role}`);
      try {
        await expect(db.query("SELECT * FROM acesso_sessao")).rejects.toThrow("permission denied");
        await expect(
          db.query("INSERT INTO acesso_sessao(aluno_id) VALUES ($1)", [A]),
        ).rejects.toThrow("permission denied");
        await expect(registrar()).rejects.toThrow("permission denied");
        await expect(ler()).rejects.toThrow("permission denied");
      } finally {
        await db.exec("RESET ROLE");
      }
    },
  );
  it("tem RLS ativa e service_role autorizado", async () => {
    expect(
      (await db.query("SELECT relrowsecurity FROM pg_class WHERE oid = 'acesso_sessao'::regclass"))
        .rows[0],
    ).toEqual({ relrowsecurity: true });
    await db.exec("SET ROLE service_role");
    try {
      await registrar();
      await ler();
    } finally {
      await db.exec("RESET ROLE");
    }
  });
});

describe("alcance e evidências por pessoa", () => {
  it("inclui aluno sem acesso sem inventar sessões ou estudo", async () => {
    const p = (await ler()).rows[0]!;
    expect(p).toMatchObject({
      tipo_usuario: "aluno",
      sessoes: 0,
      acessou_periodo: false,
      estudou_periodo: false,
      serie: "6º",
      unidade_id: U,
      medicao_desde: null,
    });
  });
  it("login histórico registra pessoa, não cria sessão", async () => {
    await db.exec("UPDATE aluno SET last_login_at = '2026-10-18T10:00:00Z'");
    expect((await ler()).rows[0]).toMatchObject({
      sessoes: 0,
      acessou_periodo: true,
      estudou_periodo: false,
    });
  });
  it("resposta comprova acesso e estudo mesmo sem login registrado", async () => {
    await db.exec(`INSERT INTO resposta_aluno VALUES ('${A}', '2026-10-18T10:00:00Z')`);
    expect((await ler()).rows[0]).toMatchObject({
      sessoes: 0,
      acessou_periodo: true,
      estudou_periodo: true,
    });
  });
  it("progresso zero e eventos futuros não comprovam estudo", async () => {
    await db.exec(`INSERT INTO aluno_progresso VALUES ('${A}', false, 0, '2026-10-18'), ('${A}', true, 40, '2026-10-20');
      INSERT INTO resposta_aluno VALUES ('${A}', '2026-10-20'); UPDATE aluno SET last_login_at = '2026-10-20';`);
    expect((await ler()).rows[0]).toMatchObject({ acessou_periodo: false, estudou_periodo: false });
  });
  it("progresso positivo e aula concluída comprovam estudo", async () => {
    await db.exec(`INSERT INTO aluno_progresso VALUES ('${A}', false, 40, '2026-10-18')`);
    expect((await ler()).rows[0]?.estudou_periodo).toBe(true);
    await db.exec("UPDATE aluno_progresso SET progresso_segundos = 0, assistido = true");
    expect((await ler()).rows[0]?.estudou_periodo).toBe(true);
  });
  it.each(["professor", "colaborador", "pendente", null])(
    "não conta estudo de perfil %s como estudo de aluno",
    async (perfil) => {
      await db.query("UPDATE aluno SET tipo_usuario = $1", [perfil]);
      await db.exec(`INSERT INTO resposta_aluno VALUES ('${A}', '2026-10-18')`);
      expect((await ler()).rows[0]).toMatchObject({
        acessou_periodo: true,
        estudou_periodo: false,
      });
    },
  );
  it("associa as áreas preservando perfil e vínculo confirmado no portal", async () => {
    await db.exec(`INSERT INTO auth.users VALUES ('${STAFF}', '2026-10-17');
      INSERT INTO usuario(id, email, role, marca_ativa_id) VALUES ('${STAFF}', 'PESSOA@escola.example', 'coordenador', '${OUTRA}');
      INSERT INTO acesso_sessao(aluno_id, iniciada_em, ultima_atividade_em) VALUES ('${A}', '2026-10-18', '2026-10-18');`);
    const linhas = (await ler()).rows;
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({
      pessoa_id: STAFF,
      tipo_usuario: "aluno",
      marca_id: M,
      sessoes: 1,
      acessou_periodo: true,
      estudou_periodo: false,
    });
    expect(linhas[0]?.criado_em.toISOString()).toContain("2026-09-01");
    expect((await ler([OUTRA])).rows).toHaveLength(0);
  });
  it("papel professor no RBAC não transforma colaborador confirmado em professor", async () => {
    await db.exec(`UPDATE aluno SET tipo_usuario = 'colaborador';
      INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id) VALUES ('${STAFF}', 'pessoa@escola.example', 'professor', '${OUTRA}');`);
    expect((await ler()).rows[0]).toMatchObject({
      pessoa_id: STAFF,
      tipo_usuario: "colaborador",
      marca_id: M,
    });
  });
  it("staff sem perfil confirmado aparece como equipe na própria marca, mesmo com papel professor", async () => {
    await db.exec(`UPDATE aluno SET tipo_usuario = 'pendente';
      INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id) VALUES ('${STAFF}', 'pessoa@escola.example', 'professor', '${OUTRA}');`);
    expect((await ler()).rows[0]).toMatchObject({
      pessoa_id: STAFF,
      tipo_usuario: "equipe",
      marca_id: OUTRA,
    });
    expect((await ler([M])).rows).toHaveLength(0);
  });
  it("staff criado após o corte não altera o ID nem desloca a pessoa entre páginas", async () => {
    await db.exec(`INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id, created_at)
      VALUES ('${STAFF}', 'pessoa@escola.example', 'professor', '${OUTRA}', '2026-10-19T15:00:01Z');`);
    expect((await ler()).rows[0]).toMatchObject({
      pessoa_id: A,
      tipo_usuario: "aluno",
      marca_id: M,
    });
  });
  it("concluir o perfil não altera a chave de paginação da identidade associada", async () => {
    await db.exec(`UPDATE aluno SET tipo_usuario = 'pendente';
      INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id) VALUES ('${STAFF}', 'pessoa@escola.example', 'professor', '${M}');`);
    const antes = (await ler()).rows[0]?.pessoa_id;
    await db.exec("UPDATE aluno SET tipo_usuario = 'colaborador'");
    expect((await ler()).rows[0]?.pessoa_id).toBe(antes);
  });
  it("staff inativo não sobrepõe aluno ativo nem apaga suas sessões antigas", async () => {
    await db.exec(`INSERT INTO auth.users VALUES ('${STAFF}', NULL);
      INSERT INTO usuario(id, email, role, marca_ativa_id, ativo) VALUES ('${STAFF}', 'pessoa@escola.example', 'professor', '${OUTRA}', false);
      INSERT INTO acesso_sessao(usuario_id, iniciada_em, ultima_atividade_em) VALUES ('${STAFF}', '2026-10-18', '2026-10-18');`);
    expect((await ler()).rows[0]).toMatchObject({
      pessoa_id: A,
      tipo_usuario: "aluno",
      marca_id: M,
      sessoes: 1,
    });
  });
  it("contas sem e-mail não são fundidas", async () => {
    await db.exec(`UPDATE aluno SET email = NULL;
      INSERT INTO aluno(id, email, tipo_usuario, marca_id) VALUES ('${B}', ' ', 'aluno', '${M}');`);
    expect((await ler()).rows).toHaveLength(2);
  });
  it("recorta todos os indicadores e início da medição pela marca, sem vazamento", async () => {
    await db.exec(`INSERT INTO aluno(id, tipo_usuario, marca_id) VALUES ('${B}', 'aluno', '${OUTRA}');
      INSERT INTO acesso_sessao(aluno_id, iniciada_em, ultima_atividade_em) VALUES ('${B}', '2026-10-01', '2026-10-01');`);
    expect((await ler([M])).rows[0]?.medicao_desde).toBeNull();
    expect((await ler([])).rows).toHaveLength(0);
    expect((await ler([OUTRA])).rows[0]?.pessoa_id).toBe(B);
  });
  it("sessão iniciada antes do período pode ter atividade nele sem somar novo início", async () => {
    await db.exec(
      `INSERT INTO acesso_sessao(aluno_id, iniciada_em, ultima_atividade_em) VALUES ('${A}', '2026-10-12T14:55:00Z', '2026-10-12T15:05:00Z')`,
    );
    expect((await ler()).rows[0]).toMatchObject({ sessoes: 0, acessou_periodo: true });
  });
  it("sessão atualizada após o corte continua evidenciando a pessoa que já acessava", async () => {
    await db.exec(
      `INSERT INTO acesso_sessao(aluno_id, iniciada_em, ultima_atividade_em) VALUES ('${A}', '2026-10-19T14:59:00Z', '2026-10-19T15:01:00Z')`,
    );
    expect((await ler()).rows[0]).toMatchObject({ sessoes: 1, acessou_periodo: true });
  });
  it("cadastros e sessões inteiramente futuros não entram na janela", async () => {
    await db.exec(`INSERT INTO aluno(id, tipo_usuario, marca_id, created_at) VALUES ('${B}', 'aluno', '${M}', '2026-10-20');
      INSERT INTO acesso_sessao(aluno_id, iniciada_em, ultima_atividade_em) VALUES ('${A}', '2026-10-20', '2026-10-20');`);
    const linhas = (await ler()).rows;
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ sessoes: 0, acessou_periodo: false });
  });
  it("retorna mais de mil identidades sem limite implícito e sem nomes/e-mails", async () => {
    await db.exec(`INSERT INTO aluno(id, tipo_usuario, marca_id)
      SELECT gen_random_uuid(), 'aluno', '${M}'::uuid FROM generate_series(1, 1105)`);
    const linhas = (await ler()).rows;
    expect(linhas).toHaveLength(1106);
    expect(Object.keys(linhas[0]!)).not.toContain("email");
    expect(Object.keys(linhas[0]!)).not.toContain("nome");
  });
});
