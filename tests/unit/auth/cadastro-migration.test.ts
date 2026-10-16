import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const A = "10000000-0000-4000-8000-000000000001";
const M = "20000000-0000-4000-8000-000000000001";
const OUTRA_M = "20000000-0000-4000-8000-000000000002";
const U = "30000000-0000-4000-8000-000000000001";
const OUTRA_U = "30000000-0000-4000-8000-000000000002";
const INATIVA_U = "30000000-0000-4000-8000-000000000003";
const T = "40000000-0000-4000-8000-000000000001";
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE marca (id uuid primary key, slug text);
    CREATE TABLE unidade (id uuid primary key, marca_id uuid references marca(id), nome text, ativo boolean default true);
    CREATE TABLE turma (id uuid primary key, unidade_id uuid references unidade(id), serie text);
    CREATE TABLE aluno (id uuid primary key default gen_random_uuid(), nome text, email text,
      ativo boolean default true, turma_id uuid references turma(id), marca_id uuid references marca(id),
      ra_totvs text, codcoligada_totvs integer, codfilial_totvs integer,
      serie text, consentimento_responsavel boolean default false);
    INSERT INTO marca VALUES ('${M}', 'apogeu'), ('${OUTRA_M}', 'qi-bilingue');
    INSERT INTO unidade VALUES ('${U}', '${M}', 'Unidade oficial', true), ('${OUTRA_U}', '${OUTRA_M}', 'Outra marca', true), ('${INATIVA_U}', '${M}', 'Inativa', false);
    INSERT INTO turma VALUES ('${T}', '${U}', '6º');
    INSERT INTO aluno (id, nome, email) VALUES ('${A}', 'Legado', 'pessoa@colegioapogeu.com.br');
    INSERT INTO aluno (nome, turma_id, email) VALUES ('Legado com turma', '${T}', 'pessoa@colegioqi.com.br');
  `);
  await db.exec(readFileSync("supabase/migrations/20261016_059_cadastro_portal.sql", "utf8"));
  const legado = (
    await db.query<{ tipo_usuario: string | null; marca_id: string }>(
      "select tipo_usuario, marca_id from aluno where id = $1",
      [A],
    )
  ).rows[0];
  expect(legado).toEqual({ tipo_usuario: null, marca_id: M });
  const vinculado = (
    await db.query<{ tipo_usuario: string; unidade_id: string; cadastro_concluido_em: string }>(
      "select tipo_usuario, unidade_id, cadastro_concluido_em from aluno where nome = 'Legado com turma'",
    )
  ).rows[0];
  expect(vinculado?.tipo_usuario).toBe("aluno");
  expect(vinculado?.unidade_id).toBe(U);
  expect(
    (
      await db.query<{ marca_id: string }>(
        "select marca_id from aluno where nome = 'Legado com turma'",
      )
    ).rows[0]?.marca_id,
  ).toBe(M);
  expect(vinculado?.cadastro_concluido_em).toBeTruthy();
  await db.exec(
    "GRANT USAGE ON SCHEMA public TO authenticated, service_role; GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;",
  );
}, 30_000);
afterAll(async () => {
  await db?.close();
});
beforeEach(async () => {
  await db.exec("TRUNCATE aluno");
  await db.query(
    "INSERT INTO aluno (id, nome, email, marca_id) VALUES ($1, 'Conta sintética', 'pessoa@colegioapogeu.com.br', $2)",
    [A, M],
  );
});
const concluir = (tipo = "aluno", unidade: string | null = U, serie: string | null = "6º") =>
  db.query("select concluir_cadastro_portal($1, $2, $3, $4)", [A, tipo, unidade, serie]);

describe("migração real do cadastro em PostgreSQL", () => {
  it("reserva novos acessos como pendentes", async () => {
    expect((await db.query("select tipo_usuario, cadastro_concluido_em from aluno")).rows).toEqual([
      { tipo_usuario: "pendente", cadastro_concluido_em: null },
    ]);
  });
  it("conclui aluno sem inventar turma ou consentimento", async () => {
    await concluir();
    expect(
      (
        await db.query(
          "select tipo_usuario, unidade_id, serie, serie_cadastro, turma_id, consentimento_responsavel from aluno",
        )
      ).rows[0],
    ).toEqual({
      tipo_usuario: "aluno",
      unidade_id: U,
      serie: null,
      serie_cadastro: "6º",
      turma_id: null,
      consentimento_responsavel: false,
    });
  });
  it.each([OUTRA_U, INATIVA_U, null])(
    "recusa unidade inválida/fora da marca %s",
    async (unidade) => {
      await expect(concluir("aluno", unidade)).rejects.toThrow("unidade ativa da sua marca");
      expect((await db.query("select cadastro_concluido_em from aluno")).rows[0]).toEqual({
        cadastro_concluido_em: null,
      });
    },
  );
  it.each(["", "10º", "9º; DROP TABLE aluno;"])("recusa série arbitrária %s", async (serie) => {
    await expect(concluir("aluno", U, serie)).rejects.toThrow("série válida");
  });
  it.each(["professor", "colaborador"])(
    "conclui %s sem dados escolares ou consentimento",
    async (tipo) => {
      await concluir(tipo, null, null);
      expect(
        (
          await db.query(
            "select tipo_usuario, unidade_id, serie, consentimento_responsavel from aluno",
          )
        ).rows[0],
      ).toEqual({
        tipo_usuario: tipo,
        unidade_id: null,
        serie: null,
        consentimento_responsavel: false,
      });
    },
  );
  it("não permite aluno identificado por email virar profissional", async () => {
    await db.query("update aluno set email = 'nome@alunos.colegioapogeu.com.br'");
    await expect(concluir("professor", null, null)).rejects.toThrow("identifica um aluno");
  });
  it("preserva série oficial do RA mesmo em formato legado", async () => {
    await db.query("update aluno set ra_totvs = '0001', serie = '6º Ano'");
    await expect(concluir("colaborador", null, null)).rejects.toThrow("identifica um aluno");
    await expect(concluir()).rejects.toThrow("série oficial");
    await concluir("aluno", U, "6º Ano");
  });
  it("bloqueia inativos, IDs desconhecidos e perfil inválido", async () => {
    await expect(concluir("admin")).rejects.toThrow("perfil válido");
    await db.query("update aluno set ativo = false");
    await expect(concluir()).rejects.toThrow("Acesso indisponível");
  });
  it("reenvios preservam a conclusão; outra classificação é rejeitada", async () => {
    await Promise.all([concluir(), concluir()]);
    const antes = (await db.query("select cadastro_concluido_em from aluno")).rows;
    await concluir();
    expect((await db.query("select cadastro_concluido_em from aluno")).rows).toEqual(antes);
    await expect(concluir("professor", null, null)).rejects.toThrow();
    await expect(concluir("aluno", U, "7º")).rejects.toThrow("já concluído");
  });
  it.each([
    { campo: "marca_id", valor: OUTRA_M },
    { campo: "codcoligada_totvs", valor: 2 },
    { campo: "codfilial_totvs", valor: 2 },
  ])("solicita nova unidade quando a sincronização altera $campo", async ({ campo, valor }) => {
    await db.query(
      "update aluno set ra_totvs = '0001', codcoligada_totvs = 1, codfilial_totvs = 1, consentimento_responsavel = true where id = $1",
      [A],
    );
    await concluir();
    await db.exec("SET ROLE service_role");
    try {
      await db.query(`update aluno set ${campo} = $1 where id = $2`, [valor, A]);
    } finally {
      await db.exec("RESET ROLE");
    }
    expect(
      (
        await db.query(
          "select tipo_usuario, unidade_id, serie_cadastro, cadastro_concluido_em, consentimento_responsavel from aluno where id = $1",
          [A],
        )
      ).rows[0],
    ).toEqual({
      tipo_usuario: "aluno",
      unidade_id: null,
      serie_cadastro: null,
      cadastro_concluido_em: null,
      consentimento_responsavel: true,
    });
    await concluir("aluno", campo === "marca_id" ? OUTRA_U : U);
  });
  it("preserva cadastro quando a sincronização mantém a origem oficial", async () => {
    const sincronizar = () =>
      db.query(
        "update aluno set ra_totvs = '0001', marca_id = $1, codcoligada_totvs = 1, codfilial_totvs = 1 where id = $2",
        [M, A],
      );
    await sincronizar();
    await concluir();
    const antes = (await db.query("select * from aluno where id = $1", [A])).rows;
    await sincronizar();
    expect((await db.query("select * from aluno where id = $1", [A])).rows).toEqual(antes);
  });
  it("só service_role executa a RPC; cliente não pode editar perfil diretamente", async () => {
    expect(
      (
        await db.query(
          "select has_function_privilege('anon', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') as anon, has_function_privilege('authenticated', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') as autenticado, has_function_privilege('service_role', 'public.concluir_cadastro_portal(uuid,text,uuid,text)', 'execute') as servidor",
        )
      ).rows[0],
    ).toEqual({ anon: false, autenticado: false, servidor: true });
    await db.exec("SET ROLE authenticated");
    try {
      await expect(concluir()).rejects.toThrow("permission denied");
      await expect(
        db.query(
          "update aluno set tipo_usuario = 'professor', cadastro_concluido_em = now() where id = $1",
          [A],
        ),
      ).rejects.toThrow("reservado ao servidor");
    } finally {
      await db.exec("RESET ROLE");
    }
    await db.exec("SET ROLE service_role");
    try {
      await concluir();
    } finally {
      await db.exec("RESET ROLE");
    }
  });
  it("cadastro administrativo com turma já entra completo; sincronização RA continua aluno", async () => {
    await db.exec("SET ROLE authenticated");
    try {
      await db.query("insert into aluno (nome, turma_id) values ('Novo aluno oficial', $1)", [T]);
    } finally {
      await db.exec("RESET ROLE");
    }
    const row = (
      await db.query<Record<string, unknown>>(
        "select tipo_usuario, unidade_id, cadastro_concluido_em from aluno where turma_id = $1",
        [T],
      )
    ).rows[0];
    expect(row?.tipo_usuario).toBe("aluno");
    expect(row?.unidade_id).toBe(U);
    expect(row?.cadastro_concluido_em).toBeTruthy();
    await db.query("update aluno set ra_totvs = '0002' where id = $1", [A]);
    expect(
      (
        await db.query<{ tipo_usuario: string }>("select tipo_usuario from aluno where id = $1", [
          A,
        ])
      ).rows[0]?.tipo_usuario,
    ).toBe("aluno");
  });
});
