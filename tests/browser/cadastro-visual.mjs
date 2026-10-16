import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const saida = path.join(raiz, "docs/reports/cadastro-portal-2026-10-16");
await fs.mkdir(saida, { recursive: true });
const html =
  '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Primeiro acesso — verificação sintética</title></head><body><div id="root"></div><script type="module" src="/tests/browser/cadastro-preview.tsx"></script></body></html>';
const servidor = await createServer({
  root: raiz,
  configFile: false,
  appType: "custom",
  logLevel: "error",
  cacheDir: path.join(raiz, ".next/cadastro-vite-cache"),
  optimizeDeps: { include: ["react", "react-dom/client", "react/jsx-runtime", "lucide-react"] },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: "@/app/aluno/cadastro/actions",
        replacement: path.join(raiz, "tests/browser/cadastro-action.ts"),
      },
      { find: "@", replacement: raiz },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3103,
    strictPort: true,
    hmr: false,
    watch: { ignored: ["**/.worktrees/**", "**/.next/**", "**/docs/reports/**"] },
  },
  plugins: [
    {
      name: "harness-cadastro",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (new URL(req.url, "http://127.0.0.1").pathname !== "/verificacao-cadastro")
            return next();
          try {
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.end(await server.transformIndexHtml(req.url, html));
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
});
let browser;
const resultado = { dados: "sintéticos", verificacoes: [], errosConsole: [] };
try {
  await servidor.listen();
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  page.on("pageerror", (error) => resultado.errosConsole.push(error.message));
  const abrir = async (qs = "") => {
    await page.goto(`http://127.0.0.1:3103/verificacao-cadastro${qs}`, {
      waitUntil: "networkidle",
    });
    await page.getByRole("heading", { name: "Vamos preparar seu espaço" }).waitFor();
  };
  await abrir();
  assert.equal(await page.getByRole("button", { name: "Continuar" }).isDisabled(), true);
  await page.getByRole("radio", { name: /Sou aluno/ }).check();
  await page
    .getByRole("combobox", { name: "Unidade", exact: true })
    .selectOption("30000000-0000-4000-8000-000000000001");
  await page.getByRole("combobox", { name: "Série", exact: true }).selectOption("6º");
  assert.equal(
    await page.getByRole("combobox", { name: "Série", exact: true }).locator("option").count(),
    13,
  );
  await page.screenshot({ path: path.join(saida, "aluno-desktop.png"), fullPage: true });
  resultado.verificacoes.push(
    "Aluno: unidades oficiais e 12 séries de Fundamental/Médio em desktop.",
  );
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("alert").filter({ hasText: "Falha de conexão simulada" }).waitFor();
  assert.equal(await page.getByRole("radio", { name: /Sou aluno/ }).isChecked(), true);
  assert.equal(
    await page.getByRole("combobox", { name: "Unidade", exact: true }).inputValue(),
    "30000000-0000-4000-8000-000000000001",
  );
  assert.equal(await page.getByRole("combobox", { name: "Série", exact: true }).inputValue(), "6º");
  assert.equal(await page.evaluate(() => window.cadastroEnviado.popup), "1");
  resultado.verificacoes.push("Falha recuperável mantém perfil, unidade, série e modo popup.");
  for (const nome of [/Sou professor/, /Outro profissional/]) {
    await page.getByRole("radio", { name: nome }).check();
    assert.equal(await page.getByRole("combobox", { name: "Unidade", exact: true }).count(), 0);
    assert.equal(await page.getByRole("button", { name: "Continuar" }).isEnabled(), true);
  }
  resultado.verificacoes.push(
    "Professor e outro profissional dispensam dados escolares; orientação de gestão presente.",
  );
  await abrir("?identificado=1&oficial=1");
  assert.equal(await page.getByRole("radio", { name: /Sou professor/ }).isDisabled(), true);
  assert.equal(await page.getByRole("radio", { name: /Outro profissional/ }).isDisabled(), true);
  assert.equal(await page.getByLabel("Série oficial").getAttribute("readonly"), "");
  resultado.verificacoes.push(
    "Aluno identificado tem perfil bloqueado e série oficial preservada.",
  );
  await abrir("?identificado=1&catalogo=1");
  await page.getByRole("link", { name: "Tentar novamente" }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Continuar" }).isDisabled(), true);
  resultado.verificacoes.push("Falha do catálogo explica o problema e bloqueia envio do aluno.");
  await page.setViewportSize({ width: 390, height: 844 });
  await abrir("?identificado=1&tema=escuro");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(saida, "aluno-celular-escuro.png"), fullPage: true });
  resultado.verificacoes.push("Celular 390px e tema escuro sem rolagem horizontal.");
  await abrir();
  await page.getByRole("radio", { name: /Sou professor/ }).check();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: path.join(saida, "professor-celular.png"), fullPage: true });
  assert.deepEqual(resultado.errosConsole, []);
  console.log(JSON.stringify(resultado, null, 2));
} finally {
  await fs.writeFile(path.join(saida, "resultado.json"), `${JSON.stringify(resultado, null, 2)}\n`);
  await browser?.close();
  await servidor.close();
}
