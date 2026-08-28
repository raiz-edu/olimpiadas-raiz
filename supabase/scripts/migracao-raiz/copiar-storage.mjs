/**
 * Copia os buckets do Storage do projeto Supabase ANTIGO para o projeto NOVO.
 *
 * Uso:
 *   node supabase/scripts/migracao-raiz/copiar-storage.mjs --dry-run
 *   node supabase/scripts/migracao-raiz/copiar-storage.mjs --bucket questoes
 *   node supabase/scripts/migracao-raiz/copiar-storage.mjs                 # todos os buckets
 *
 * Env (.env.local):
 *   OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY          → origem (projeto antigo)
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY      → destino (projeto da Raiz, o do app)
 *
 * Idempotente: objeto já existente no destino com o mesmo tamanho é pulado, então
 * pode ser interrompido e retomado. Cria o bucket no destino se não existir, com
 * a mesma visibilidade (público/privado) da origem.
 *
 * Runbook: docs/ops/migracao-supabase-raiz.md
 */
import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const l of fs.existsSync(".env.local")
  ? fs.readFileSync(".env.local", "utf8").split(/\r?\n/)
  : []) {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const DRY = flag("--dry-run");
const ONLY = opt("--bucket");
const CONCURRENCY = Number(opt("--concurrency") ?? 4);

const need = (k) => {
  if (!process.env[k]) throw new Error(`${k} ausente no .env.local`);
  return process.env[k];
};
const origem = createClient(need("OLD_SUPABASE_URL"), need("OLD_SUPABASE_SERVICE_ROLE_KEY"));
const destino = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"));
if (process.env.OLD_SUPABASE_URL === process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    "OLD_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_URL são o mesmo projeto — nada a copiar.",
  );
}

/** Lista recursiva: devolve [{ path, size, mimetype }] */
async function listar(sb, bucket, prefixo = "") {
  const arquivos = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await sb.storage.from(bucket).list(prefixo, { limit: 1000, offset });
    if (error) throw new Error(`list ${bucket}/${prefixo}: ${error.message}`);
    for (const item of data ?? []) {
      const path = prefixo ? `${prefixo}/${item.name}` : item.name;
      if (item.id)
        arquivos.push({
          path,
          size: item.metadata?.size ?? null,
          mimetype: item.metadata?.mimetype ?? undefined,
        });
      else arquivos.push(...(await listar(sb, bucket, path)));
    }
    if (!data || data.length < 1000) break;
    offset += 1000;
  }
  return arquivos;
}

async function garantirBucket(nome, publico) {
  const { data: existentes } = await destino.storage.listBuckets();
  if (existentes?.some((b) => b.name === nome)) return "existia";
  if (DRY) return "criaria";
  const { error } = await destino.storage.createBucket(nome, { public: publico });
  if (error) throw new Error(`createBucket ${nome}: ${error.message}`);
  return "criado";
}

async function copiar(bucket, arq, jaNoDestino) {
  const dest = jaNoDestino.get(arq.path);
  if (dest && (arq.size == null || dest === arq.size)) return "pulado";
  if (DRY) return "copiaria";
  const { data: blob, error: e1 } = await origem.storage.from(bucket).download(arq.path);
  if (e1) throw new Error(`download ${bucket}/${arq.path}: ${e1.message}`);
  const { error: e2 } = await destino.storage
    .from(bucket)
    .upload(arq.path, blob, { contentType: arq.mimetype, upsert: true });
  if (e2) throw new Error(`upload ${bucket}/${arq.path}: ${e2.message}`);
  return "copiado";
}

const { data: buckets, error } = await origem.storage.listBuckets();
if (error) throw new Error(`listBuckets origem: ${error.message}`);
const alvo = (buckets ?? []).filter((b) => !ONLY || b.name === ONLY);
if (!alvo.length) throw new Error(`Bucket "${ONLY}" não existe na origem.`);

console.log(
  `${DRY ? "[DRY-RUN] " : ""}origem=${process.env.OLD_SUPABASE_URL} → destino=${process.env.NEXT_PUBLIC_SUPABASE_URL}`,
);
const totais = {};
for (const b of alvo) {
  const estadoBucket = await garantirBucket(b.name, b.public);
  const [deOrigem, deDestino] = await Promise.all([
    listar(origem, b.name),
    listar(destino, b.name).catch(() => []),
  ]);
  const jaNoDestino = new Map(deDestino.map((a) => [a.path, a.size]));
  const cont = { copiado: 0, copiaria: 0, pulado: 0, erro: 0 };
  let i = 0;
  const worker = async () => {
    while (i < deOrigem.length) {
      const arq = deOrigem[i++];
      try {
        cont[await copiar(b.name, arq, jaNoDestino)]++;
      } catch (e) {
        cont.erro++;
        console.error("  ERRO", e.message);
      }
      if ((cont.copiado + cont.copiaria + cont.pulado) % 250 === 0) process.stdout.write(".");
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(
    `\n${b.name} (${b.public ? "público" : "privado"}, bucket ${estadoBucket}): ${deOrigem.length} objetos na origem →`,
    cont,
  );
  totais[b.name] = cont;
}
const erros = Object.values(totais).reduce((s, c) => s + c.erro, 0);
console.log(
  erros
    ? `\nConcluído COM ${erros} erro(s) — rode de novo para retomar.`
    : "\nConcluído sem erros.",
);
process.exit(erros ? 1 : 0);
