import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = path.join(process.cwd(), "preview-docs", "screenshots");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const CONTAS = [
  { slug: "apogeu", email: "aluno.apogeu@olimpiadas.teste" },
  { slug: "qi-bilingue", email: "aluno.qi-bilingue@olimpiadas.teste" },
  { slug: "matriz-educacao", email: "aluno.matriz-educacao@olimpiadas.teste" },
];
const SENHA = "Teste@2026";
const BASE = "https://olimpiadas-raiz.vercel.app";

async function testar(browser, conta) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  console.log(`[${conta.slug}] abrindo login...`);
  await page.goto(`${BASE}/aluno/login?marca=${conta.slug}`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', conta.email);
  await page.fill('input[type="password"]', SENHA);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/aluno/dashboard", { timeout: 15000 });
  await page.waitForLoadState("networkidle");

  const header = page.locator("header").first();
  await header.screenshot({ path: path.join(OUT, `header-${conta.slug}.png`) });
  console.log(`[${conta.slug}] screenshot salvo`);

  // mantém janela aberta
  return page;
}

const browser = await chromium.launch({ headless: false });

// Abre os 3 em paralelo
const pages = await Promise.all(CONTAS.map((c) => testar(browser, c)));

console.log("\nTodas as 3 janelas abertas. Fechando em 40s...");
await pages[0].waitForTimeout(40000);
await browser.close();
