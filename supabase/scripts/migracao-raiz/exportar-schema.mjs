/**
 * Exporta o SCHEMA de um projeto Supabase Cloud (colunas, constraints, índices,
 * funções, views, policies, RLS, triggers, enums, buckets, auth.users) para JSON,
 * via Management API — complementa exportar-tabelas.mjs (linhas) e
 * baixar-storage.mjs (arquivos). É a fonte de verdade para conferir o que uma
 * cópia deixou para trás.
 *
 * Uso:
 *   node supabase/scripts/migracao-raiz/exportar-schema.mjs <ref-do-projeto> <pasta-destino>
 *
 * Env (.env.local): SUPABASE_ACCESS_TOKEN (token pessoal — o mesmo da CLI do Supabase).
 * auth_users.json contém e-mails: fica só no backup local, nunca no repositório.
 */
import fs from "node:fs";
import path from "node:path";

for (const l of fs.existsSync(".env.local")
  ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
  : []) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const [ref, destino] = process.argv.slice(2);
if (!ref || !destino) throw new Error("Uso: exportar-schema.mjs <ref> <pasta-destino>");
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_PAT;
if (!TOKEN) throw new Error("SUPABASE_ACCESS_TOKEN ausente no .env.local");

async function sql(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

const CONSULTAS = {
  tabelas: `select table_name, table_type from information_schema.tables where table_schema = 'public' order by 1`,
  colunas: `select table_name, column_name, data_type, udt_name, is_nullable, column_default, ordinal_position
            from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position`,
  constraints: `select conrelid::regclass::text as tabela, conname, contype, pg_get_constraintdef(oid) as def
                from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`,
  indices: `select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by 1, 2`,
  funcoes: `select p.proname as nome, pg_get_functiondef(p.oid) as def
            from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' order by 1`,
  views: `select viewname, definition from pg_views where schemaname = 'public' order by 1`,
  policies: `select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2`,
  rls: `select c.relname as tabela, c.relrowsecurity as rls_on from pg_class c
        join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' order by 1`,
  triggers: `select event_object_table as tabela, trigger_name, action_timing, event_manipulation, action_statement
             from information_schema.triggers where trigger_schema = 'public' order by 1, 2`,
  enums: `select t.typname, array_agg(e.enumlabel order by e.enumsortorder) as valores
          from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
          where n.nspname = 'public' group by 1 order by 1`,
  storage_buckets: `select id, name, public, created_at from storage.buckets order by 1`,
  auth_users: `select id, email, created_at, last_sign_in_at, raw_app_meta_data ->> 'provider' as provider
               from auth.users order by created_at`,
  tamanho_db: `select pg_size_pretty(pg_database_size(current_database())) as tamanho`,
};

fs.mkdirSync(destino, { recursive: true });
const resumo = {};
for (const [nome, query] of Object.entries(CONSULTAS)) {
  try {
    const dados = await sql(query);
    fs.writeFileSync(path.join(destino, `${nome}.json`), JSON.stringify(dados, null, 1));
    resumo[nome] = Array.isArray(dados) ? dados.length : dados;
  } catch (e) {
    resumo[nome] = `ERRO ${e.message}`;
  }
}
fs.writeFileSync(
  path.join(destino, "_resumo.json"),
  JSON.stringify({ ref, exportadoEm: new Date().toISOString(), resumo }, null, 2),
);
console.log(JSON.stringify(resumo, null, 1));
