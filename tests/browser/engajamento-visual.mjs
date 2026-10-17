import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import { chromium } from "playwright";

// Renderiza o componente real. Nenhum bypass de autenticação é adicionado ao app.
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const saida = path.join(raiz, "docs/reports/perfis-nao-confirmados-2026-10-16");
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
  const tabelaPerfis = () =>
    pagina.getByRole("table", { name: "Lista de cadastros aguardando confirmação de perfil" });
  const listaPerfis = () => pagina.locator("#perfis-nao-confirmados");
  const abrir = async (sufixo = "") => {
    await pagina.goto(`${endereco}${sufixo}`, { waitUntil: "networkidle" });
    await pagina.getByRole("heading", { name: "Engajamento e desempenho", exact: true }).waitFor();
  };
  await abrir();
  await pagina.locator(".recharts-surface").waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 25);
  assert.ok(
    (await pagina.locator('section[aria-label="Alunos confirmados"]').innerText()).includes("32"),
  );
  await pagina.screenshot({ path: path.join(saida, "desktop.png"), fullPage: false });
  resultado.verificacoes.push("Desktop: indicadores, gráfico real e primeira página de 25 alunos.");

  await listaPerfis().getByText("Consultar cadastros com perfil não confirmado").click();
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 25);
  assert.ok((await listaPerfis().innerText()).includes("28 cadastro(s) no recorte"));
  assert.equal(await pagina.getByText("Profissional professor", { exact: true }).count(), 0);
  assert.equal(await pagina.getByText("Profissional colaborador", { exact: true }).count(), 0);
  assert.deepEqual(await tabelaPerfis().locator("thead th").allTextContents(), [
    "Nome",
    "Vínculo informado",
    "Último acesso",
  ]);
  await listaPerfis().screenshot({ path: path.join(saida, "desktop-perfis.png") });
  await pagina.getByRole("link", { name: "Próximos perfis", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=2/);
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 3);
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 25);
  assert.ok((await tabelaPerfis().innerText()).includes("Sem marca informada"));
  resultado.verificacoes.push(
    "Perfis NULL, undefined e pendente em lista própria de 28 cadastros, sem profissionais nem desempenho; paginação de 25 sem alterar alunos.",
  );

  await pagina.locator('a[href*="situacao=retomar"]').first().click();
  await pagina.waitForURL(/situacao=retomar/);
  await tabelaAlunos().waitFor();
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 4);
  assert.equal(await pagina.getByLabel("Situação", { exact: true }).inputValue(), "retomar");
  assert.ok(
    (await pagina.locator('section[aria-label="Alunos confirmados"]').innerText()).includes("32"),
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

  await listaPerfis().getByText("Consultar cadastros com perfil não confirmado").click();
  await pagina.getByRole("link", { name: "Próximos perfis", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=2/);
  assert.equal(new URL(pagina.url()).searchParams.get("pagina"), "2");
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 7);
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 3);
  await pagina.getByRole("link", { name: "Perfis anteriores", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=1/);
  await tabelaPerfis().waitFor();
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 25);
  assert.equal(await tabelaAlunos().locator("tbody tr").count(), 7);
  await pagina.getByRole("link", { name: "Próximos perfis", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=2/);
  await pagina.getByLabel("Ordenar", { exact: true }).selectOption("nome");
  await pagina.getByRole("button", { name: "Atualizar", exact: true }).click();
  await pagina.waitForURL(/ordenar=nome/);
  assert.equal(new URL(pagina.url()).searchParams.get("pagina_perfis"), "2");
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 3);
  resultado.verificacoes.push("As duas paginações preservam a página da outra lista.");
  resultado.verificacoes.push(
    "Voltar à primeira página mantém a lista aberta; refinar a ordenação de alunos preserva a página dos perfis.",
  );

  await pagina.getByLabel("Marca", { exact: true }).selectOption("marca-1");
  await pagina.getByLabel("Período", { exact: true }).selectOption("7");
  await pagina.getByLabel("Buscar por nome", { exact: true }).fill("Aluno de teste 01");
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
  await pagina.getByRole("heading", { name: "Nenhum aluno confirmado neste recorte" }).waitFor();
  resultado.verificacoes.push("Estado vazio explica o recorte sem sugerir falha de aprendizagem.");

  await abrir();
  await pagina.getByLabel("Marca", { exact: true }).selectOption("marca-3");
  await pagina.getByLabel("Unidade", { exact: true }).selectOption("unidade-3");
  await pagina.getByLabel("Série", { exact: true }).selectOption("2º EM");
  await pagina.getByRole("button", { name: "Aplicar filtros" }).click();
  await pagina.waitForURL(/marca=marca-3/);
  await pagina.getByRole("heading", { name: "Nenhum aluno confirmado neste recorte" }).waitFor();
  assert.ok((await listaPerfis().innerText()).includes("27 cadastro(s) no recorte"));
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 25);
  assert.ok((await tabelaPerfis().innerText()).includes("Unidade Jardim"));
  await pagina.screenshot({ path: path.join(saida, "somente-pendentes.png"), fullPage: false });
  await pagina.getByRole("link", { name: "Próximos perfis", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=2/);
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 2);
  for (const [chave, valor] of [
    ["marca", "marca-3"],
    ["unidade", "unidade-3"],
    ["serie", "2º EM"],
  ]) {
    assert.equal(new URL(pagina.url()).searchParams.get(chave), valor);
  }
  resultado.verificacoes.push(
    "Marca, unidade e série exclusivas de pendentes permanecem nos filtros; recorte sem alunos abre lista e mantém vínculos na paginação.",
  );

  await abrir("?periodo=7&situacao=retomar&busca=Perfil%20aguardando%2001");
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 1);
  assert.ok((await tabelaPerfis().innerText()).includes("Perfil aguardando 01"));
  resultado.verificacoes.push(
    "Busca filtra perfis; período e situação de estudo não ocultam a pendência cadastral.",
  );

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

  await abrir("?marca=marca-3");
  await tabelaPerfis().waitFor();
  assert.equal(
    await pagina.evaluate(() => document.documentElement.scrollWidth > window.innerWidth),
    false,
  );
  await listaPerfis().screenshot({ path: path.join(saida, "celular-perfis.png") });
  await pagina.getByRole("link", { name: "Próximos perfis", exact: true }).click();
  await pagina.waitForURL(/pagina_perfis=2/);
  assert.equal(await tabelaPerfis().locator("tbody tr").count(), 2);
  resultado.verificacoes.push(
    "Celular: lista pendente com rolagem interna, sem overflow da página, e próxima página acessível.",
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
