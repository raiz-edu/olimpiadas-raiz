/**
 * Exporta todos os buckets do Storage de um projeto Supabase para uma pasta local.
 * Backup de segurança antes de mexer em projeto/plano (issue #157 — o projeto
 * antigo está em plano FREE fora do período de carência e pode parar de servir).
 *
 * Uso:
 *   node supabase/scripts/migracao-raiz/baixar-storage.mjs <pasta-destino> [--dry-run] [--prefix OLD_] [--bucket questoes]
 *
 * Env: <prefix>SUPABASE_URL + <prefix>SUPABASE_SERVICE_ROLE_KEY; sem prefixo usa
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 *
 * Idempotente: arquivo já existente no destino com o mesmo tamanho é pulado.
 * Grava também <pasta>/_manifesto-<bucket>.json com caminho, tamanho e mimetype.
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
const DRY = args.includes("--dry-run");
const ONLY = opt("--bucket");
const prefix = opt("--prefix") ?? "";
const destino = args.find(
  (a, i) => !a.startsWith("--") && !["--prefix", "--bucket"].includes(args[i - 1]),
);
if (!destino) throw new Error("Informe a pasta de destino.");

const URL = process.env[prefix ? `${prefix}SUPABASE_URL` : "NEXT_PUBLIC_SUPABASE_URL"];
const KEY = process.env[`${prefix}SUPABASE_SERVICE_ROLE_KEY`];
if (!URL || !KEY) throw new Error("URL/service key ausentes no .env.local");
const sb = createClient(URL, KEY);

async function listar(bucket, prefixo = "") {
  const arquivos = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage.from(bucket).list(prefixo, { limit: 1000, offset });
    if (error) throw new Error(`list ${bucket}/${prefixo}: ${error.message}`);
    for (const item of data ?? []) {
      const p = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id)
        arquivos.push({
          path: p,
          size: item.metadata?.size ?? null,
          mimetype: item.metadata?.mimetype ?? null,
        });
      else arquivos.push(...(await listar(bucket, p)));
    }
    if (!data || data.length < 1000) break;
    offset += 1000;
  }
  return arquivos;
}

const { data: buckets, error } = await sb.storage.listBuckets();
if (error) throw new Error(`listBuckets: ${error.message}`);
const alvo = (buckets ?? []).filter((b) => !ONLY || b.name === ONLY);

console.log(`${DRY ? "[DRY-RUN] " : ""}${URL} → ${path.resolve(destino)}`);
let totalArquivos = 0,
  totalBytes = 0,
  erros = 0;
for (const b of alvo) {
  const arquivos = await listar(b.name);
  const bytes = arquivos.reduce((s, a) => s + (a.size ?? 0), 0);
  totalArquivos += arquivos.length;
  totalBytes += bytes;
  console.log(
    `${b.name} (${b.public ? "público" : "privado"}): ${arquivos.length} arquivos, ${(bytes / 1e6).toFixed(1)} MB`,
  );
  if (DRY) continue;

  fs.mkdirSync(path.join(destino, b.name), { recursive: true });
  fs.writeFileSync(
    path.join(destino, `_manifesto-${b.name}.json`),
    JSON.stringify({ bucket: b.name, public: b.public, arquivos }, null, 2),
  );

  let baixados = 0,
    pulados = 0,
    i = 0;
  const worker = async () => {
    while (i < arquivos.length) {
      const a = arquivos[i++];
      const local = path.join(destino, b.name, a.path);
      try {
        if (fs.existsSync(local) && (a.size == null || fs.statSync(local).size === a.size)) {
          pulados++;
          continue;
        }
        const { data, error: e } = await sb.storage.from(b.name).download(a.path);
        if (e) throw new Error(e.message);
        fs.mkdirSync(path.dirname(local), { recursive: true });
        fs.writeFileSync(local, Buffer.from(await data.arrayBuffer()));
        baixados++;
      } catch (e) {
        erros++;
        console.error(`  ERRO ${b.name}/${a.path}: ${e.message}`);
      }
      if ((baixados + pulados) % 250 === 0) process.stdout.write(".");
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  console.log(`\n  → ${baixados} baixados, ${pulados} já existiam`);
}
console.log(
  `\nTotal: ${totalArquivos} arquivos, ${(totalBytes / 1e6).toFixed(1)} MB${erros ? ` — ${erros} erro(s), rode de novo para retomar` : ""}`,
);
process.exit(erros ? 1 : 0);
