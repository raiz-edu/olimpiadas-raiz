import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const migrationsDir = process.argv[2] ?? "/migration/sql";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada");

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await client.connect();

try {
  await client.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN BYPASSRLS;
      END IF;
    END $$;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE TABLE IF NOT EXISTS auth.users (
      id uuid PRIMARY KEY,
      email text NOT NULL UNIQUE,
      raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE AS $$
      SELECT NULLIF(
        COALESCE(
          current_setting('request.jwt.claim.sub', true),
          (current_setting('request.headers', true)::jsonb ->> 'x-olimpiadas-user')
        ), ''
      )::uuid
    $$;
    CREATE SCHEMA IF NOT EXISTS storage;
    CREATE TABLE IF NOT EXISTS storage.buckets (
      id text PRIMARY KEY,
      name text NOT NULL UNIQUE,
      public boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE SCHEMA IF NOT EXISTS migration;
    CREATE TABLE IF NOT EXISTS migration.schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith(".sql") && !name.endsWith("_down.sql"))
    .sort();

  for (const filename of files) {
    const exists = await client.query(
      "SELECT 1 FROM migration.schema_migrations WHERE filename = $1",
      [filename],
    );
    if (exists.rowCount) continue;
    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO migration.schema_migrations(filename) VALUES ($1)", [
        filename,
      ]);
      await client.query("COMMIT");
      console.log(`aplicada: ${filename}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(`Falha em ${filename}: ${error instanceof Error ? error.message : error}`);
    }
  }

  await client.query(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'olimpiadas_api') THEN
        CREATE ROLE olimpiadas_api NOLOGIN;
      END IF;
    END $$;
    ALTER ROLE olimpiadas_api NOBYPASSRLS;
    GRANT authenticated TO olimpiadas_api;
    GRANT USAGE ON SCHEMA public TO olimpiadas_api;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO olimpiadas_api;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO olimpiadas_api;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO olimpiadas_api;
    GRANT USAGE ON SCHEMA public TO authenticated, service_role;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO olimpiadas_api;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO olimpiadas_api;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO olimpiadas_api;
    GRANT olimpiadas_api, authenticated, anon, service_role TO CURRENT_USER;
    NOTIFY pgrst, 'reload schema';
  `);
} finally {
  await client.end();
}
