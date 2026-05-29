import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = path.join(process.cwd(), "preview-docs", "screenshots");
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: false }); // visível para o usuário ver
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

// 1. Login page com marca
console.log("Abrindo login do aluno Unificado...");
await page.goto("https://olimpiadas-raiz.vercel.app/aluno/login?marca=unificado", {
  waitUntil: "networkidle",
});
await page.screenshot({ path: path.join(OUT, "aluno-unificado-login.png") });

// 2. Preencher credenciais
console.log("Preenchendo credenciais...");
await page.fill('input[type="email"]', "aluno.unificado@olimpiadas.teste");
await page.fill('input[type="password"]', "Teste@2026");
await page.screenshot({ path: path.join(OUT, "aluno-unificado-preenchido.png") });

// 3. Submeter
console.log("Fazendo login...");
await page.click('button[type="submit"]');
await page.waitForURL("**/aluno/dashboard", { timeout: 15000 });
await page.waitForLoadState("networkidle");

// 4. Screenshot do dashboard com header
console.log("Capturando dashboard...");
await page.screenshot({ path: path.join(OUT, "aluno-unificado-dashboard.png") });

// 5. Screenshot focado no header
const header = page.locator("header").first();
await header.screenshot({ path: path.join(OUT, "aluno-unificado-header.png") });

console.log("Concluído! Browser permanece aberto para você ver.");
// Mantém aberto 30s para o usuário visualizar
await page.waitForTimeout(30000);
await browser.close();
