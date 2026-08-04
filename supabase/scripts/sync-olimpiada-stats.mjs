/**
 * Sincroniza a participação agregada de olimpíadas do projeto "DEP à vista"
 * para a tabela `olimpiada_stats_marca` deste projeto.
 *
 * A origem guarda contagens por organização × competição × ano — não há
 * registro por aluno. Por isso o destino é a camada de agregados, e não
 * `inscricao`/`resultado` (ver migration 044).
 *
 * Uso:
 *   node supabase/scripts/sync-olimpiada-stats.mjs            # dry-run: só mostra o que faria
 *   node supabase/scripts/sync-olimpiada-stats.mjs --apply    # grava (upsert idempotente)
 *
 * Requer no .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (destino)
 *   SUPABASE_ACCESS_TOKEN                                (leitura da origem)
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const APPLY = process.argv.includes("--apply");
const ORIGEM_REF = "fvmywtcvamturqrmvlni"; // DEP à vista
const FONTE = "dep-a-vista";

// ─── Env ─────────────────────────────────────────────────────────────────────

function loadEnv(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(full, "utf8")
      .split(/\r?\n/)
      .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [
          l.slice(0, i).trim(),
          l
            .slice(i + 1)
            .trim()
            .replace(/^["']|["']$/g, ""),
        ];
      }),
  );
}

const env = { ...loadEnv(".env.local"), ...process.env };

for (const k of [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ACCESS_TOKEN",
]) {
  if (!env[k]) {
    console.error(`Faltando ${k} no ambiente / .env.local`);
    process.exit(1);
  }
}

// ─── Origem: DEP à vista (Management API, somente leitura) ───────────────────

async function origem(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ORIGEM_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const body = await res.json();
  if (!res.ok || !Array.isArray(body)) {
    throw new Error(`origem falhou (${res.status}): ${JSON.stringify(body).slice(0, 300)}`);
  }
  return body;
}

/**
 * Rola cada contagem até a marca (organizations.type='brand'), somando
 * unidades no pai quando a linha estiver em nível de unidade.
 */
const SQL_ORIGEM = `
  with org_marca as (
    select o.id, coalesce(p.name, o.name) as marca_nome
    from organizations o
    left join organizations p on p.id = o.parent_id
  ),
  base as (
    select om.marca_nome, e.competition_id, e.year,
           sum(e.enrolled_count) as inscritos, 0 as participantes
    from olympiad_enrollments e
    join org_marca om on om.id = e.organization_id
    group by 1, 2, 3
    union all
    select om.marca_nome, p.competition_id, p.year,
           0 as inscritos, sum(p.participant_count) as participantes
    from olympiad_participants p
    join org_marca om on om.id = p.organization_id
    group by 1, 2, 3
  ),
  contagem as (
    select marca_nome, competition_id, year,
           sum(inscritos) as inscritos, sum(participantes) as participantes
    from base group by 1, 2, 3
  ),
  premios as (
    select om.marca_nome, r.competition_id, r.year,
           sum(r.count) filter (where r.position_type = 'ouro')         as ouro,
           sum(r.count) filter (where r.position_type = 'prata')        as prata,
           sum(r.count) filter (where r.position_type = 'bronze')       as bronze,
           sum(r.count) filter (where r.position_type = 'honra')        as mencao_honrosa,
           sum(r.count) filter (where r.position_type = 'classificado') as classificado
    from olympiad_results r
    join org_marca om on om.id = r.organization_id
    group by 1, 2, 3
  )
  select
    coalesce(c.marca_nome, pr.marca_nome)         as marca_nome,
    comp.sigla                                     as sigla,
    comp.name                                      as competicao,
    coalesce(c.year, pr.year)                      as ano_letivo,
    coalesce(c.inscritos, 0)                       as inscritos,
    coalesce(c.participantes, 0)                   as participantes,
    coalesce(pr.ouro, 0)                           as ouro,
    coalesce(pr.prata, 0)                          as prata,
    coalesce(pr.bronze, 0)                         as bronze,
    coalesce(pr.mencao_honrosa, 0)                 as mencao_honrosa,
    coalesce(pr.classificado, 0)                   as classificado
  from contagem c
  full outer join premios pr
    on  pr.marca_nome     = c.marca_nome
    and pr.competition_id = c.competition_id
    and pr.year           = c.year
  join olympiad_competitions comp
    on comp.id = coalesce(c.competition_id, pr.competition_id)
  order by 1, 4, 2
`;

// ─── Marcas: nome na origem → nome no destino ────────────────────────────────

const ALIAS_MARCA = {
  "Colégio Qi": "QI Bilíngue",
};

// ─── Nome de exibição no padrão do sistema: "SIGLA ANO — Nome" ───────────────

function nomeExibicao(sigla, competicao, ano) {
  // Remove a sigla repetida só quando ela vem seguida de travessão
  // ("OBMEP — 1ª Fase" → "1ª Fase"). Sem o travessão a palavra faz parte do
  // nome e tem de ficar ("Canguru de Matemática Brasil").
  const escapada = sigla.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const limpo = competicao.replace(new RegExp(`^${escapada}\\s*[—–-]\\s*`, "i"), "").trim();
  return `${sigla} ${ano} — ${limpo || competicao}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const destino = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

console.log(`\n${APPLY ? "APLICANDO" : "DRY-RUN (nada será gravado)"}`);
console.log(`origem : DEP à vista (${ORIGEM_REF})`);
console.log(`destino: ${env.NEXT_PUBLIC_SUPABASE_URL}\n`);

const linhas = await origem(SQL_ORIGEM);
console.log(`origem: ${linhas.length} combinações marca × olimpíada × ano`);

const { data: marcas, error: errMarcas } = await destino.from("marca").select("id, nome");
if (errMarcas) throw new Error(`destino/marca: ${errMarcas.message}`);
const marcaPorNome = new Map((marcas ?? []).map((m) => [m.nome, m.id]));

// Área e classificação vêm da olimpíada correspondente no destino, quando existir.
const { data: olimpiadas, error: errOlimp } = await destino
  .from("olimpiada")
  .select("nome, area_conhecimento, classificacao, ano_letivo");
if (errOlimp) throw new Error(`destino/olimpiada: ${errOlimp.message}`);

// A sigla sai do padrão "SIGLA ANO — Nome" via regex, e não de split por
// espaço: "OBMEP MIRIM 2026 — ..." tem de virar "OBMEP MIRIM", senão colide com
// "OBMEP" e herda a classificação errada (a Mirim não é obrigatória).
// Indexado por sigla+ano, porque a classificação pode mudar de um ano para o
// outro; o fallback por sigla cobre o ano que não existir em `olimpiada`.
const metaPorSiglaAno = new Map();
const metaPorSigla = new Map();
for (const o of olimpiadas ?? []) {
  const m = o.nome.match(/^(.+?)\s+(\d{4})\s*—/);
  if (!m) continue;
  const sigla = m[1].toUpperCase();
  const meta = { area_conhecimento: o.area_conhecimento, classificacao: o.classificacao };
  metaPorSiglaAno.set(`${sigla}|${m[2]}`, meta);
  if (!metaPorSigla.has(sigla)) metaPorSigla.set(sigla, meta);
}

// Siglas que a origem escreve diferente do cadastro deste sistema.
const ALIAS_SIGLA = {
  OBMEP_MIR: "OBMEP MIRIM",
};

const registros = [];
const semMarca = new Map();

for (const l of linhas) {
  const nomeDestino = ALIAS_MARCA[l.marca_nome] ?? l.marca_nome;
  const marcaId = marcaPorNome.get(nomeDestino);
  if (!marcaId) {
    semMarca.set(l.marca_nome, (semMarca.get(l.marca_nome) ?? 0) + Number(l.inscritos));
    continue;
  }
  const siglaBusca = (ALIAS_SIGLA[l.sigla] ?? String(l.sigla)).toUpperCase();
  const meta =
    metaPorSiglaAno.get(`${siglaBusca}|${l.ano_letivo}`) ?? metaPorSigla.get(siglaBusca) ?? {};
  registros.push({
    marca_id: marcaId,
    olimpiada_sigla: l.sigla,
    olimpiada_nome: nomeExibicao(l.sigla, l.competicao, l.ano_letivo),
    ano_letivo: Number(l.ano_letivo),
    inscritos: Number(l.inscritos),
    participantes: Number(l.participantes),
    ouro: Number(l.ouro),
    prata: Number(l.prata),
    bronze: Number(l.bronze),
    mencao_honrosa: Number(l.mencao_honrosa),
    classificado: Number(l.classificado),
    area_conhecimento: meta.area_conhecimento ?? null,
    classificacao: meta.classificacao ?? null,
    fonte: FONTE,
    sincronizado_em: new Date().toISOString(),
  });
}

// ─── Resumo ──────────────────────────────────────────────────────────────────

const soma = (campo) => registros.reduce((s, r) => s + r[campo], 0);
const porAno = {};
for (const r of registros) {
  porAno[r.ano_letivo] ??= { linhas: 0, inscritos: 0, participantes: 0, premios: 0 };
  const a = porAno[r.ano_letivo];
  a.linhas++;
  a.inscritos += r.inscritos;
  a.participantes += r.participantes;
  a.premios += r.ouro + r.prata + r.bronze + r.mencao_honrosa;
}

console.log(`\na gravar: ${registros.length} linhas`);
console.log("  ano    linhas  inscritos  participantes  prêmios");
for (const ano of Object.keys(porAno).sort()) {
  const a = porAno[ano];
  console.log(
    `  ${ano}   ${String(a.linhas).padStart(5)}  ${String(a.inscritos).padStart(9)}  ` +
      `${String(a.participantes).padStart(13)}  ${String(a.premios).padStart(7)}`,
  );
}
console.log(
  `  TOTAL  ${String(registros.length).padStart(5)}  ${String(soma("inscritos")).padStart(9)}  ` +
    `${String(soma("participantes")).padStart(13)}  ` +
    `${String(soma("ouro") + soma("prata") + soma("bronze") + soma("mencao_honrosa")).padStart(7)}`,
);

const marcasAtingidas = [...new Set(registros.map((r) => r.marca_id))].length;
const siglas = [...new Set(registros.map((r) => r.olimpiada_sigla))];
console.log(`\nmarcas: ${marcasAtingidas} · siglas: ${siglas.length} (${siglas.join(", ")})`);

if (semMarca.size > 0) {
  console.log("\nIGNORADAS — marca da origem sem correspondente no destino:");
  for (const [nome, insc] of semMarca) console.log(`  ${nome} (${insc} inscritos)`);
}

const semArea = registros.filter((r) => !r.area_conhecimento).length;
if (semArea > 0) {
  console.log(
    `\naviso: ${semArea} linhas sem área/classificação (sigla sem olimpíada correspondente no destino).`,
  );
}

if (!APPLY) {
  console.log("\nDry-run concluído. Rode com --apply para gravar.\n");
  process.exit(0);
}

// ─── Gravação ────────────────────────────────────────────────────────────────

const LOTE = 200;
let gravadas = 0;
for (let i = 0; i < registros.length; i += LOTE) {
  const lote = registros.slice(i, i + LOTE);
  const { error } = await destino
    .from("olimpiada_stats_marca")
    .upsert(lote, { onConflict: "marca_id,olimpiada_sigla,ano_letivo" });
  if (error) throw new Error(`upsert lote ${i / LOTE + 1}: ${error.message}`);
  gravadas += lote.length;
  console.log(`  gravadas ${gravadas}/${registros.length}`);
}

const { count } = await destino
  .from("olimpiada_stats_marca")
  .select("*", { count: "exact", head: true });
console.log(`\nOK — olimpiada_stats_marca agora tem ${count} linhas.\n`);
