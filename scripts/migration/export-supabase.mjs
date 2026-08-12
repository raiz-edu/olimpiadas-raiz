import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const endpoint = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const outputDir = process.argv[2];

if (!endpoint || !key || !outputDir) {
  throw new Error("Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node export-supabase.mjs <diretorio>");
}

const tables = [
  "alternativa", "aluno", "aluno_progresso", "apostila_aplicacao", "apostila_geracao", "audit_log",
  "apostila_questao", "apostila_receita", "configuracao_sistema", "convite", "inscricao",
  "marca", "meta_marca", "olimpiada", "olimpiada_fase", "olimpiada_marca", "olimpiada_stats_marca",
  "preparacao_aula", "preparacao_aula_questao", "preparacao_material", "preparacao_projeto",
  "questao", "questao_favorita", "resposta_aluno", "resultado", "simulado_sessao",
  "solucao", "turma", "unidade", "usuario", "usuario_marca", "usuario_turma", "usuario_unidade",
];

await mkdir(outputDir, { recursive: true });
const manifest = { exportedAt: new Date().toISOString(), tables: {} };

for (const table of tables) {
  const rows = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const url = new URL(`/rest/v1/${table}`, endpoint);
    url.searchParams.set("select", "*");
    url.searchParams.set("offset", String(offset));
    url.searchParams.set("limit", String(pageSize));
    const response = await fetch(url, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "User-Agent": "olimpiadas-migration/1.0",
      },
    });
    if (!response.ok) throw new Error(`${table}: HTTP ${response.status} ${await response.text()}`);
    const page = await response.json();
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  await writeFile(path.join(outputDir, `${table}.json`), JSON.stringify(rows));
  manifest.tables[table] = rows.length;
}

await writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest));
