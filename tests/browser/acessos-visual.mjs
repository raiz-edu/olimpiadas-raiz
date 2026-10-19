import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

// Componente e tracker reais, fora do aplicativo e com dados sintéticos.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const saida = path.join(raiz, "docs/reports/acessos-participacao-2026-10-19");
await fs.mkdir(saida, { recursive: true });
const html =
  '<!doctype html><html lang="pt-BR" class="dark" style="--font-inter:Arial,sans-serif"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Verificação de acessos</title></head><body><div id="root"></div><script type="module" src="/tests/browser/acessos-preview.tsx"></script></body></html>';
const servidor = await createServer({
  root: raiz,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  cacheDir: path.join(raiz, ".next/acessos-vite-cache"),
  esbuild: { jsx: "automatic" },
  optimizeDeps: { include: ["react", "react-dom/client", "react/jsx-runtime", "lucide-react"] },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      { find: "@", replacement: raiz },
      { find: "next/link", replacement: path.join(raiz, "tests/browser/engajamento-link.tsx") },
      {
        find: "next/navigation",
        replacement: path.join(raiz, "tests/browser/acessos-navigation.ts"),
      },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3104,
    strictPort: true,
    hmr: false,
    watch: { ignored: ["**/.worktrees/**", "**/.next/**", "**/docs/reports/**"] },
  },
  plugins: [
    {
      name: "verificacao-acessos",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const pathname = new URL(req.url, "http://127.0.0.1").pathname;
          if (
            !pathname.startsWith("/analytics") &&
            !pathname.startsWith("/aluno/") &&
            pathname !== "/dashboard"
          )
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
  const pagina = await navegador.newPage({ viewport: { width: 1440, height: 1100 } });
  pagina.on("pageerror", (erro) => resultado.errosConsole.push(erro.message));
  pagina.on("console", (msg) => {
    if (msg.type() === "error") resultado.errosConsole.push(msg.text());
  });
  const endereco = "http://127.0.0.1:3104/analytics/acessos";
  const abrir = async (sufixo = "") => {
    await pagina.goto(endereco + sufixo, { waitUntil: "networkidle" });
    await pagina.getByRole("heading", { name: "Acessos e participação", exact: true }).waitFor();
  };
  await abrir();
  assert.equal(
    await pagina.locator('section[aria-label="Indicadores de acesso"] article').count(),
    6,
  );
  await pagina.getByRole("heading", { name: "Do acesso ao estudo", exact: true }).waitFor();
  await pagina
    .getByRole("table", { name: "Participação por marca e unidade", exact: true })
    .waitFor();
  await pagina.screenshot({ path: path.join(saida, "desktop.png"), fullPage: true });
  resultado.verificacoes.push(
    "Desktop: indicadores, comparação acesso/estudo, perfis, séries e unidades.",
  );

  await pagina.getByLabel("Marca", { exact: true }).selectOption("m1");
  await pagina.getByLabel("Perfil", { exact: true }).selectOption("aluno");
  await pagina.getByLabel("Série", { exact: true }).selectOption("6º");
  await pagina.getByLabel("Período", { exact: true }).selectOption("7");
  await pagina.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await pagina.waitForURL(/periodo=7/);
  assert.equal(await pagina.getByLabel("Marca", { exact: true }).inputValue(), "m1");
  assert.equal(await pagina.getByLabel("Série", { exact: true }).inputValue(), "6º");
  assert.equal(
    await pagina
      .getByRole("table", { name: "Participação por marca e unidade", exact: true })
      .locator("tbody tr")
      .count(),
    1,
  );
  await pagina.getByRole("link", { name: "Limpar filtros", exact: true }).click();
  await pagina.waitForURL(endereco);
  assert.equal(await pagina.getByLabel("Marca", { exact: true }).inputValue(), "");
  assert.equal(await pagina.getByLabel("Período", { exact: true }).inputValue(), "30");
  resultado.verificacoes.push(
    "Filtros combinados de marca/perfil/série/período; limpar por navegação parcial sincroniza seletores.",
  );

  await abrir("?perfil=professor");
  await pagina
    .getByText("O recorte selecionado não inclui alunos identificados.", { exact: false })
    .waitFor();
  assert.equal(
    await pagina
      .getByRole("table", { name: "Participação por marca e unidade", exact: true })
      .locator("tbody tr")
      .count(),
    2,
  );
  resultado.verificacoes.push("Professores aparecem na adoção sem compor a base de alunos.");
  await abrir("?vazio=1");
  await pagina
    .getByRole("heading", { name: "Nenhum cadastro neste recorte", exact: true })
    .waitFor();
  resultado.verificacoes.push("Conjunto vazio explícito, sem confundir com indisponibilidade.");
  await abrir("?restrito=1");
  assert.equal(await pagina.getByLabel("Marca", { exact: true }).locator("option").count(), 1);
  assert.equal(await pagina.getByText("Marca Horizonte", { exact: true }).count(), 0);
  resultado.verificacoes.push("Visão restrita apresenta apenas a marca e unidades do diretor.");

  await pagina.setViewportSize({ width: 390, height: 844 });
  await abrir();
  assert.ok(await pagina.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  await pagina.screenshot({ path: path.join(saida, "celular.png"), fullPage: true });
  await pagina.getByLabel("Perfil", { exact: true }).selectOption("pendente");
  await pagina.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await pagina.waitForURL(/perfil=pendente/);
  assert.equal(await pagina.getByLabel("Perfil", { exact: true }).inputValue(), "pendente");
  resultado.verificacoes.push(
    "Celular: sem overflow da página, tabela em região própria e filtro de perfis pendentes funcional.",
  );

  const coleta = await navegador.newPage();
  await coleta.clock.install({ time: new Date("2026-10-19T15:00:00Z") });
  const chamadas = [];
  await coleta.route("**/api/acessos", async (route) => {
    chamadas.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await coleta.goto("http://127.0.0.1:3104/aluno/login", { waitUntil: "networkidle" });
  assert.equal(chamadas.length, 0);
  await coleta.goto("http://127.0.0.1:3104/aluno/cadastro", { waitUntil: "networkidle" });
  assert.deepEqual(chamadas, [{ area: "portal" }]);
  await coleta.evaluate(() => {
    for (let i = 0; i < 12; i++) document.dispatchEvent(new Event("scroll"));
    history.pushState(null, "", "/aluno/dashboard");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  assert.equal(chamadas.length, 1);
  await coleta.clock.fastForward("01:01");
  assert.equal(chamadas.length, 1);
  await coleta.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("scroll"));
  });
  assert.equal(chamadas.length, 1);
  const proxima = coleta.waitForResponse(
    (resposta) => resposta.url().endsWith("/api/acessos") && resposta.status() === 204,
  );
  await coleta.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await proxima;
  assert.equal(chamadas.length, 2);
  await coleta.goto("http://127.0.0.1:3104/dashboard", { waitUntil: "networkidle" });
  assert.deepEqual(chamadas.at(-1), { area: "gestao" });
  resultado.verificacoes.push(
    "Tracker real: cadastro pendente e gestão; login ignorado, throttle entre navegações, ausência de heartbeat e aba oculta ignorada.",
  );
  assert.deepEqual(resultado.errosConsole, []);
  await fs.writeFile(path.join(saida, "navegador.json"), JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
} finally {
  await navegador?.close();
  await servidor.close();
}
