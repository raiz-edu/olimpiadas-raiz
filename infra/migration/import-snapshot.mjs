import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const inputDir = process.argv[2] ?? "/migration/snapshot";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");
const manifest = JSON.parse(await readFile(path.join(inputDir, "manifest.json"), "utf8"));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

const order = [
  "marca",
  "unidade",
  "turma",
  "usuario",
  "usuario_marca",
  "usuario_unidade",
  "aluno",
  "olimpiada",
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
  "simulado_sessao",
].filter((table) => Object.hasOwn(manifest.tables, table));

try {
  for (const table of order) {
    const rows = JSON.parse(await readFile(path.join(inputDir, `${table}.json`), "utf8"));
    if (rows.length !== manifest.tables[table])
      throw new Error(`${table}: contagem de origem divergente`);
    await client.query("BEGIN");
    try {
      for (const row of rows) {
        await client.query(
          `INSERT INTO ${table} SELECT (jsonb_populate_record(NULL::${table}, $1::jsonb)).* ON CONFLICT DO NOTHING`,
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
