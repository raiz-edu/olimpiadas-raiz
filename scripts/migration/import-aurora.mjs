import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const inputDir = process.argv[2];
if (!inputDir || !process.env.DATABASE_URL) {
  throw new Error("Uso: DATABASE_URL=... node import-aurora.mjs <diretorio>");
}

const manifest = JSON.parse(await readFile(path.join(inputDir, "manifest.json"), "utf8"));
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: false });
await client.connect();

try {
  await client.query("BEGIN");
  await client.query(`
    CREATE SCHEMA IF NOT EXISTS migration;
    CREATE TABLE IF NOT EXISTS migration.supabase_snapshot (
      source_table text NOT NULL,
      source_id text NOT NULL,
      payload jsonb NOT NULL,
      migrated_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (source_table, source_id)
    );
  `);

  for (const [table, expected] of Object.entries(manifest.tables)) {
    const rows = JSON.parse(await readFile(path.join(inputDir, `${table}.json`), "utf8"));
    if (rows.length !== expected) throw new Error(`${table}: esperado ${expected}, recebido ${rows.length}`);
    for (let i = 0; i < rows.length; i += 250) {
      const chunk = rows.slice(i, i + 250);
      const values = [];
      const placeholders = chunk.map((row, index) => {
        const id = row.id == null ? `row-${i + index}` : String(row.id);
        values.push(table, id, JSON.stringify(row));
        const base = index * 3;
        return `($${base + 1}, $${base + 2}, $${base + 3}::jsonb)`;
      });
      await client.query(
        `INSERT INTO migration.supabase_snapshot(source_table, source_id, payload) VALUES ${placeholders.join(",")}
         ON CONFLICT (source_table, source_id) DO UPDATE SET payload=excluded.payload, migrated_at=now()`,
        values,
      );
    }
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
