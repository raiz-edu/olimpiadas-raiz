import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const inputDir = process.argv[2] ?? "/migration/snapshot";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
const manifest = JSON.parse(await readFile(path.join(inputDir, "manifest.json"), "utf8"));
const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const marcasOrigem = JSON.parse(await readFile(path.join(inputDir, "marca.json"), "utf8"));
for (const marca of marcasOrigem) {
  // A origem produtiva é soberana sobre UUIDs fixos criados por seeds históricos.
  await client.query("DELETE FROM marca WHERE slug = $1 AND id <> $2", [marca.slug, marca.id]);
}

// Preserva as chaves históricas durante a transição. A aplicação passa a usar
// cognito_sub, mas as FKs legadas ainda referenciam auth.users até a migration
// de identidade concluir o desacoplamento.
const usuariosOrigem = JSON.parse(await readFile(path.join(inputDir, "usuario.json"), "utf8"));
const alunosOrigem = JSON.parse(await readFile(path.join(inputDir, "aluno.json"), "utf8"));
for (const usuario of usuariosOrigem) {
  await client.query(
    `INSERT INTO auth.users(id, email, raw_user_meta_data)
     VALUES ($1, $2, jsonb_build_object('nome', $3::text)) ON CONFLICT (id) DO NOTHING`,
    [usuario.id, usuario.email, usuario.nome],
  );
}
for (const aluno of alunosOrigem) {
  if (!aluno.supabase_auth_id || !aluno.email) continue;
  await client.query(
    `INSERT INTO auth.users(id, email, raw_user_meta_data)
     VALUES ($1, $2, jsonb_build_object('nome', $3::text, 'tipo', 'aluno')) ON CONFLICT (id) DO NOTHING`,
    [aluno.supabase_auth_id, aluno.email, aluno.nome],
  );
}

const order = [
  "marca",
  "unidade",
  "turma",
  "usuario",
  "usuario_marca",
  "usuario_unidade",
  "usuario_turma",
  "aluno",
  "olimpiada",
  "olimpiada_marca",
  "olimpiada_fase",
  "inscricao",
  "resultado",
  "meta_marca",
  "preparacao_projeto",
  "preparacao_aula",
  "preparacao_material",
  "questao",
  "alternativa",
  "solucao",
  "preparacao_aula_questao",
  "questao_favorita",
  "resposta_aluno",
  "aluno_progresso",
  "olimpiada_stats_marca",
  "apostila_receita",
  "apostila_geracao",
  "apostila_questao",
  "apostila_aplicacao",
  "configuracao_sistema",
  "convite",
  "audit_log",
  "simulado_sessao",
];

const existingTables = new Set(
  (await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")).rows.map(
    ({ tablename }) => tablename,
  ),
);
const importOrder = order.filter(
  (table) => Object.hasOwn(manifest.tables, table) && existingTables.has(table),
);

try {
  for (const table of importOrder) {
    const rows = JSON.parse(await readFile(path.join(inputDir, `${table}.json`), "utf8"));
    if (rows.length !== manifest.tables[table])
      throw new Error(`${table}: contagem de origem divergente`);
    await client.query("BEGIN");
    try {
      const columnsResult = await client.query(
        `SELECT a.attname
           FROM pg_attribute a
           JOIN pg_class c ON c.oid = a.attrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = $1
            AND a.attnum > 0 AND NOT a.attisdropped AND a.attgenerated = ''
          ORDER BY a.attnum`,
        [table],
      );
      const columns = columnsResult.rows.map(({ attname }) => `"${attname.replaceAll('"', '""')}"`);
      const columnList = columns.join(", ");
      for (const row of rows) {
        await client.query(
          `INSERT INTO ${table} (${columnList})
           SELECT ${columnList} FROM jsonb_populate_record(NULL::${table}, $1::jsonb)
           ON CONFLICT DO NOTHING`,
          [JSON.stringify(row)],
        );
      }
      await client.query("COMMIT");
      const target = await client.query(`SELECT count(*)::int AS count FROM ${table}`);
      console.log(`${table}: origem=${rows.length} destino=${target.rows[0].count}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
