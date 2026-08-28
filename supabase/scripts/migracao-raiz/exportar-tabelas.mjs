/**
 * Exporta todas as tabelas (não views) do schema public de um projeto Supabase
 * para JSON, uma tabela por arquivo, pela API pública (service role).
 * Backup de dados antes de mexer em projeto/plano — complementa baixar-storage.mjs.
 *
 * Uso:
 *   node supabase/scripts/migracao-raiz/exportar-tabelas.mjs <pasta-destino> [--prefix OLD_]
 *
 * Não substitui um pg_dump (não leva funções, policies, auth.users, sequences):
 * serve para recuperar LINHAS que tenham ficado para trás numa cópia.
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
const prefix = opt("--prefix") ?? "";
const destino = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--prefix");
if (!destino) throw new Error("Informe a pasta de destino.");

const URL = process.env[prefix ? `${prefix}SUPABASE_URL` : "NEXT_PUBLIC_SUPABASE_URL"];
const KEY = process.env[`${prefix}SUPABASE_SERVICE_ROLE_KEY`];
if (!URL || !KEY) throw new Error("URL/service key ausentes no .env.local");
const sb = createClient(URL, KEY);

const spec = await fetch(`${URL}/rest/v1/`, {
  headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
}).then((r) => r.json());
const tabelas = Object.entries(spec.definitions ?? {})
  .filter(([nome]) => !nome.startsWith("v_"))
  .map(([nome, d]) => ({
    nome,
    pk:
      Object.entries(d.properties ?? {}).find(([, p]) => /<pk\/>/.test(p.description ?? ""))?.[0] ??
      null,
  }));

fs.mkdirSync(destino, { recursive: true });
const PAGINA = 1000;
const resumo = {};
for (const t of tabelas) {
  const linhas = [];
  let from = 0;
  for (;;) {
    let q = sb
      .from(t.nome)
      .select("*")
      .range(from, from + PAGINA - 1);
    if (t.pk) q = q.order(t.pk, { ascending: true });
    const { data, error } = await q;
    if (error) {
      console.error(`ERRO ${t.nome}: ${error.message}`);
      resumo[t.nome] = `ERRO ${error.message}`;
      break;
    }
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) break;
    from += PAGINA;
  }
  if (!(t.nome in resumo)) {
    fs.writeFileSync(path.join(destino, `${t.nome}.json`), JSON.stringify(linhas));
    resumo[t.nome] = linhas.length;
  }
}
fs.writeFileSync(
  path.join(destino, "_resumo.json"),
  JSON.stringify({ url: URL, exportadoEm: new Date().toISOString(), tabelas: resumo }, null, 2),
);
console.log(JSON.stringify(resumo));
