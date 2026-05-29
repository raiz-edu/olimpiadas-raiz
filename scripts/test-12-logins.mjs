import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const OUT = path.join(process.cwd(), "preview-docs", "test-12-logins");
fs.mkdirSync(OUT, { recursive: true });

const SENHA = "Teste@2026";
const BASE = "https://olimpiadas-raiz.vercel.app";

const DIRETORES = [
  { slug: "apogeu", email: "diretor.apogeu@olimpiadas.teste" },
  { slug: "matriz-educacao", email: "diretor.matriz-educacao@olimpiadas.teste" },
  { slug: "qi-bilingue", email: "diretor.qi-bilingue@olimpiadas.teste" },
  { slug: "uniao", email: "diretor.uniao@olimpiadas.teste" },
  { slug: "unificado", email: "diretor.unificado@olimpiadas.teste" },
  { slug: "americano", email: "diretor.americano@olimpiadas.teste" },
];

const ALUNOS = [
  { slug: "apogeu", email: "aluno.apogeu@olimpiadas.teste" },
  { slug: "matriz-educacao", email: "aluno.matriz-educacao@olimpiadas.teste" },
  { slug: "qi-bilingue", email: "aluno.qi-bilingue@olimpiadas.teste" },
  { slug: "uniao", email: "aluno.uniao@olimpiadas.teste" },
  { slug: "unificado", email: "aluno.unificado@olimpiadas.teste" },
  { slug: "americano", email: "aluno.americano@olimpiadas.teste" },
];

const resultados = [];

async function testar(browser, conta, tipo) {
  const loginUrl =
    tipo === "aluno"
      ? `${BASE}/aluno/login?marca=${conta.slug}`
      : `${BASE}/login?marca=${conta.slug}`;
  const dashUrl = tipo === "aluno" ? "**/aluno/dashboard" : "**/dashboard";
  const prefix = `${tipo}-${conta.slug}`;

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const erros = [];

  try {
    // 1. Tela de login
    await page.goto(loginUrl, { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(OUT, `${prefix}-1-login.png`), fullPage: false });

    // Verificar logo na tela de login
    const loginImg = await page
      .locator("img")
      .first()
      .getAttribute("src")
      .catch(() => null);
    const temLogoLogin = loginImg && (loginImg.includes(conta.slug) || loginImg.includes("marcas"));
    if (!temLogoLogin) erros.push("logo ausente na tela de login");

    // 2. Fazer login
    await page.fill('input[type="email"]', conta.email);
    await page.fill('input[type="password"]', SENHA);
    await page.click('button[type="submit"]');

    await page.waitForURL(dashUrl, { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    // 3. Screenshot completo do dashboard
    await page.screenshot({ path: path.join(OUT, `${prefix}-2-dashboard.png`), fullPage: false });

    // Verificar logo no header
    const headerImgs = await page.locator("header img").all();
    let temLogoHeader = false;
    for (const img of headerImgs) {
      const src = await img.getAttribute("src").catch(() => "");
      if (src && (src.includes(conta.slug) || src.includes("marcas"))) {
        temLogoHeader = true;
        break;
      }
    }
    if (!temLogoHeader) erros.push("logo ausente no header");

    resultados.push({
      tipo,
      slug: conta.slug,
      email: conta.email,
      status: erros.length === 0 ? "✅ OK" : "⚠️ " + erros.join("; "),
    });
    console.log(`[${tipo}/${conta.slug}] ${erros.length === 0 ? "✅" : "⚠️  " + erros.join("; ")}`);
  } catch (e) {
    await page
      .screenshot({ path: path.join(OUT, `${prefix}-ERRO.png`), fullPage: false })
      .catch(() => {});
    resultados.push({
      tipo,
      slug: conta.slug,
      email: conta.email,
      status: "❌ " + e.message.split("\n")[0],
    });
    console.log(`[${tipo}/${conta.slug}] ❌ ${e.message.split("\n")[0]}`);
  } finally {
    await ctx.close();
  }
}

const browser = await chromium.launch({ headless: true });

console.log("=== DIRETORES ===");
for (const c of DIRETORES) await testar(browser, c, "diretor");

console.log("\n=== ALUNOS ===");
for (const c of ALUNOS) await testar(browser, c, "aluno");

await browser.close();

console.log("\n=== RESUMO ===");
for (const r of resultados) {
  console.log(`${r.status}  [${r.tipo}] ${r.slug} — ${r.email}`);
}

// Salvar relatório
const relatorio = resultados
  .map((r) => `${r.status}  [${r.tipo}] ${r.slug} — ${r.email}`)
  .join("\n");
fs.writeFileSync(path.join(OUT, "relatorio.txt"), relatorio);
console.log(`\nScreenshots e relatório em: ${OUT}`);
