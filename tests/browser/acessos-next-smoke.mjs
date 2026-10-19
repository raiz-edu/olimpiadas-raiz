import assert from "node:assert/strict";
import fs from "node:fs/promises";

// Executar após o build, com Next start em porta isolada e sem sessão autenticada.
const base = process.argv[2] ?? "http://127.0.0.1:3105";
const casos = [
  { caminho: "/analytics/acessos", esperado: 307 },
  { caminho: "/api/acessos", esperado: 405 },
  { caminho: "/api/acessos", metodo: "POST", area: "portal", esperado: 401 },
  { caminho: "/api/acessos", metodo: "POST", area: "gestao", esperado: 401 },
  {
    caminho: "/api/acessos",
    metodo: "POST",
    area: "portal",
    origem: "https://outra.example",
    esperado: 403,
  },
  {
    caminho: "/api/acessos",
    metodo: "POST",
    dados: { area: "portal", p_aluno_id: "forjado" },
    esperado: 400,
  },
  { caminho: "/api/acessos/outro", metodo: "POST", area: "portal", esperado: 307 },
  { caminho: "/aluno/login", esperado: 200 },
  { caminho: "/aluno/cadastro", esperado: 307 },
];
const resultados = [];
for (const caso of casos) {
  const resposta = await fetch(base + caso.caminho, {
    redirect: "manual",
    method: caso.metodo ?? "GET",
    headers: caso.metodo ? { origin: caso.origem ?? base, "content-type": "application/json" } : {},
    ...(caso.metodo ? { body: JSON.stringify(caso.dados ?? { area: caso.area }) } : {}),
  });
  assert.equal(resposta.status, caso.esperado, caso.caminho);
  resultados.push({ caminho: caso.caminho, metodo: caso.metodo ?? "GET", status: resposta.status });
}
await fs.writeFile(
  "docs/reports/acessos-participacao-2026-10-19/rotas-next.json",
  JSON.stringify(resultados, null, 2),
);
console.log(JSON.stringify(resultados));
