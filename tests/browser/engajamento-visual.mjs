import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

// Renderiza o componente real. Nenhum bypass de autenticação é adicionado ao app.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const saida = path.join(raiz, "docs/reports/engajamento-pedagogico-2026-10-16");
await fs.mkdir(saida, { recursive: true });
const html =
  '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Verificação pedagógica</title></head><body><div id="root"></div><script type="module" src="/tests/browser/engajamento-preview.tsx"></script></body></html>';
const servidor = await createServer({
  root: raiz,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  cacheDir: path.join(raiz, ".next/engajamento-vite-cache"),
  optimizeDeps: {
    include: ["react", "react-dom/client", "react/jsx-runtime", "lucide-react", "recharts"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@", replacement: raiz },
      { find: "next/link", replacement: path.join(raiz, "tests/browser/engajamento-link.tsx") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3102,
    strictPort: true,
    hmr: false,
    watch: { ignored: ["**/.worktrees/**", "**/.next/**", "**/docs/reports/**"] },
  },
  plugins: [
    {
      name: "harness-pedagogico",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (new URL(req.url, "http://127.0.0.1").pathname !== "/academico/desempenho")
            return next();
          try {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(await server.transformIndexHtml(req.url, html));
          } catch (erro) {
            next(erro);
          }
        });
      },
    },
  ],
});
let navegador;
const resultado = { dados: "sintéticos", verificacoes: [], errosConsole: [] };
try {
  await servidor.listen();
  navegador = await chromium.launch({ channel: "chrome", headless: true });
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1050 } });
  pagina.on("pageerror", (erro) => resultado.errosConsole.push(erro.message));
  pagina.on("console", (msg) => {
    if (msg.type() === "error") resultado.errosConsole.push(msg.text());
  });
  const endereco = "http://127.0.0.1:3102/academico/desempenho";
  const tabelaAlunos = () =>
    pagina.getByRole("table", {
      name: "Dias de prática, tentativas e acertos no período selecionado",
    });
  const abrir = async (sufixo = "") => {
    await pagina.goto(`${endereco}${sufixo}`, { waitUntil: "networkidle" });
    await pagina.getByRole("heading", { name: "Engajamento e desempenho", exact: true }).waitFor();
  };
  await abrir();
  await pagina.locator(".recharts-surface").waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 25);
  assert.ok(
    (await pagina.locator('section[aria-label="Alunos no recorte"]').innerText()).includes("32"),
  );
  await pagina.screenshot({ path: path.join(saida, "desktop.png"), fullPage: false });
  resultado.verificacoes.push("Desktop: indicadores, gráfico real e primeira página de 25 alunos.");

  await pagina.locator('a[href*="situacao=retomar"]').first().click();
  await pagina.waitForURL(/situacao=retomar/);
  await tabelaAlunos().waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 4);
  assert.equal(await pagina.getByLabel("Situação", { exact: true }).inputValue(), "retomar");
  assert.ok(
    (await pagina.locator('section[aria-label="Alunos no recorte"]').innerText()).includes("32"),
  );
  resultado.verificacoes.push(
    "Filtro de retomada: quatro alunos; denominador geral preservado em 32.",
  );

  await abrir();
  await pagina.getByRole("link", { name: "Apogeu", exact: true }).click();
  await pagina.waitForURL(/marca=marca-2/);
  assert.equal(await pagina.getByLabel("Marca", { exact: true }).inputValue(), "marca-2");
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 16);
  resultado.verificacoes.push(
    "Navegação parcial por marca e situação mantém os seletores sincronizados com o recorte.",
  );

  await abrir();
  await pagina.getByRole("link", { name: "Próxima" }).click();
  await pagina.waitForURL(/pagina=2/);
  await tabelaAlunos().waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 7);
  resultado.verificacoes.push("Paginação: os sete alunos restantes aparecem na segunda página.");

  await pagina.getByLabel("Marca", { exact: true }).selectOption("marca-1");
  await pagina.getByLabel("Período", { exact: true }).selectOption("7");
  await pagina.getByLabel("Buscar aluno", { exact: true }).fill("Aluno de teste 01");
  await pagina.getByRole("button", { name: "Aplicar filtros" }).click();
  await pagina.waitForURL(/periodo=7/);
  await tabelaAlunos().waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 1);
  assert.ok(
    (
      await pagina
        .getByRole("heading", { name: "Acompanhamento por aluno" })
        .locator("..")
        .innerText()
    ).includes("1 de 1"),
  );
  resultado.verificacoes.push("Marca, período e busca funcionam juntos e reiniciam a paginação.");

  await abrir("?busca=sem-correspondencia");
  await pagina.getByRole("heading", { name: "Nenhum aluno neste recorte" }).waitFor();
  resultado.verificacoes.push("Estado vazio explica o recorte sem sugerir falha de aprendizagem.");

  await pagina.setViewportSize({ width: 390, height: 844 });
  await abrir();
  assert.equal(
    await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  await pagina.screenshot({ path: path.join(saida, "celular.png"), fullPage: false });
  const primeiro = pagina.getByRole("article").first();
  await primeiro.getByText("Ver análise", { exact: true }).click();
  await primeiro.locator("details[open]").waitFor();
  assert.ok((await primeiro.locator("details[open]").innerText()).includes("Histórico:"));
  await primeiro.scrollIntoViewIfNeeded();
  await pagina.screenshot({ path: path.join(saida, "celular-aluno.png"), fullPage: false });
  resultado.verificacoes.push(
    "Celular: sem transbordamento horizontal; cartões e análise individual expansível.",
  );

  await pagina.setViewportSize({ width: 768, height: 1024 });
  await abrir("?periodo=90");
  assert.equal(
    await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  resultado.verificacoes.push("Tablet e período de 90 dias: sem transbordamento horizontal.");
  assert.deepEqual(resultado.errosConsole, []);
  console.log(JSON.stringify(resultado, null, 2));
} finally {
  await fs.writeFile(path.join(saida, "resultado.json"), JSON.stringify(resultado, null, 2));
  await navegador?.close();
  await servidor.close();
}
