/**
 * Inventário de um projeto Supabase pela API pública (sem Management API / PAT):
 * tabelas + colunas (OpenAPI do PostgREST), RPCs, o que NÃO está em
 * supabase/migrations + seed (schema criado à mão), colunas com URL do Storage
 * antigo, buckets com contagem de objetos e linhas por tabela.
 *
 * Uso:
 *   node supabase/scripts/migracao-raiz/inventario-projeto.mjs --prefix OLD_ saida-antigo.json
 *   node supabase/scripts/migracao-raiz/inventario-projeto.mjs               saida-raiz.json
 *   node supabase/scripts/migracao-raiz/inventario-projeto.mjs --diff saida-antigo.json saida-raiz.json
 *
 * Env: <prefix>SUPABASE_URL + <prefix>SUPABASE_SERVICE_ROLE_KEY; sem prefixo usa
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (o projeto do app).
 *
 * Runbook: docs/ops/migracao-supabase-raiz.md
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

for (const l of fs.existsSync(".env.local")
  ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
  : []) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const positional = args.filter(
  (a, i) => !a.startsWith("--") && !["--prefix", "--host-antigo"].includes(args[i - 1]),
);

// ─── modo --diff ──────────────────────────────────────────────────────────────
if (args.includes("--diff")) {
  const [a, b] = positional.map((p) => JSON.parse(fs.readFileSync(p, "utf8")));
  const cols = (j) => new Set(j.spec_tables.flatMap((t) => t.cols.map((c) => `${t.name}.${c.c}`)));
  const tabs = (j) => new Set(j.spec_tables.map((t) => t.name));
  const faltamTabelas = [...tabs(a)].filter((t) => !tabs(b).has(t));
  const faltamColunas = [...cols(a)].filter(
    (c) => !cols(b).has(c) && !faltamTabelas.includes(c.split(".")[0]),
  );
  const faltamRpcs = a.rpcs.filter((r) => !b.rpcs.includes(r));
  const linhas = Object.entries(a.rowCounts)
    .map(([t, n]) => ({ tabela: t, antigo: n, novo: b.rowCounts[t] ?? "—" }))
    .filter((r) => r.antigo !== r.novo);
  const buckets = a.storage.map((s) => ({
    bucket: s.bucket,
    antigo: s.files,
    novo: b.storage.find((x) => x.bucket === s.bucket)?.files ?? "—",
  }));
  console.log(
    JSON.stringify(
      { faltamTabelas, faltamColunas, faltamRpcs, linhasDiferentes: linhas, buckets },
      null,
      1,
    ),
  );
  process.exit(0);
}

// ─── inventário ───────────────────────────────────────────────────────────────
const prefix = opt("--prefix") ?? "";
const URL = process.env[prefix ? `${prefix}SUPABASE_URL` : "NEXT_PUBLIC_SUPABASE_URL"];
const KEY = process.env[`${prefix}SUPABASE_SERVICE_ROLE_KEY`];
if (!URL || !KEY)
  throw new Error(
    `Defina ${prefix || "NEXT_PUBLIC_"}SUPABASE_URL e ${prefix}SUPABASE_SERVICE_ROLE_KEY no .env.local`,
  );
const OLD_HOST = opt("--host-antigo") ?? "ebdazvyyunilbkygtevn.supabase.co";
const out = positional[0];

const spec = await fetch(`${URL}/rest/v1/`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
}).then((r) => r.json());
const rpcs = Object.keys(spec.paths ?? {})
  .filter((p) => p.startsWith("/rpc/"))
  .map((p) => p.slice(5));
const tables = Object.entries(spec.definitions ?? {}).map(([name, d]) => ({
  name,
  cols: Object.entries(d.properties ?? {}).map(([c, p]) => ({ c, type: p.format ?? p.type })),
}));

const migDir = "supabase/migrations";
const sqlAll =
  fs
    .readdirSync(migDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => fs.readFileSync(path.join(migDir, f), "utf8"))
    .join("\n") +
  "\n" +
  fs.readFileSync("supabase/seed.sql", "utf8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (w) => new RegExp("\\b" + esc(w) + "\\b", "i").test(sqlAll);
const createdIn = (kind, name) =>
  new RegExp(
    "create\\s+(or\\s+replace\\s+)?" +
      kind +
      '\\s+(if\\s+not\\s+exists\\s+)?(public\\.)?"?' +
      esc(name) +
      '"?\\b',
    "i",
  ).test(sqlAll);
const isView = (t) => createdIn("(view|materialized\\s+view)", t);

const drift = { tables: [], columns: [], rpcs: [] };
for (const t of tables) {
  if (!isView(t.name) && !createdIn("table", t.name)) {
    drift.tables.push(t.name);
    continue;
  }
  if (isView(t.name)) continue;
  for (const { c, type } of t.cols) if (!hasWord(c)) drift.columns.push(`${t.name}.${c} (${type})`);
}
for (const r of rpcs) if (!createdIn("function", r)) drift.rpcs.push(r);

const sb = createClient(URL, KEY);
const hits = [];
const rowCounts = {};
for (const t of tables) {
  if (isView(t.name)) continue;
  const { count, error } = await sb.from(t.name).select("*", { count: "exact", head: true });
  rowCounts[t.name] = error ? `ERRO ${error.message}` : count;
  if (error) continue;
  for (const c of t.cols
    .filter((x) => x.type === "text" || x.type === "character varying")
    .map((x) => x.c)) {
    const { count: n, error: e } = await sb
      .from(t.name)
      .select("*", { count: "exact", head: true })
      .like(c, `%${OLD_HOST}%`);
    if (!e && n) hits.push({ col: `${t.name}.${c}`, tipo: "text", rows: n });
  }
  for (const c of t.cols.filter((x) => /json/.test(x.type)).map((x) => x.c)) {
    let from = 0,
      n = 0;
    for (;;) {
      const { data, error: e } = await sb
        .from(t.name)
        .select(c)
        .not(c, "is", null)
        .range(from, from + 999);
      if (e || !data?.length) break;
      for (const row of data) if (JSON.stringify(row[c]).includes(OLD_HOST)) n++;
      if (data.length < 1000) break;
      from += 1000;
    }
    if (n) hits.push({ col: `${t.name}.${c}`, tipo: "json", rows: n });
  }
}

const { data: buckets } = await sb.storage.listBuckets();
const storage = [];
for (const b of buckets ?? []) {
  const contar = async (prefixo) => {
    let off = 0,
      n = 0;
    for (;;) {
      const { data } = await sb.storage.from(b.name).list(prefixo, { limit: 1000, offset: off });
      for (const x of data ?? [])
        n += x.id ? 1 : await contar(prefixo ? `${prefixo}/${x.name}` : x.name);
      if (!data || data.length < 1000) break;
      off += 1000;
    }
    return n;
  };
  storage.push({ bucket: b.name, public: b.public, files: await contar("") });
}

const result = {
  url: URL,
  geradoEm: new Date().toISOString(),
  rpcs,
  drift,
  hits,
  storage,
  rowCounts,
};
if (out) fs.writeFileSync(out, JSON.stringify({ spec_tables: tables, ...result }, null, 2));
console.log(JSON.stringify(result, null, 1));
