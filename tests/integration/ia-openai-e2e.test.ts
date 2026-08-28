/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Ponta a ponta REAL da avaliação por IA (issue #161): chama a OpenAI de verdade
 * com uma questão discursiva do banco e uma imagem de resolução.
 *
 * Só roda quando pedido — custa dinheiro e precisa de rede:
 *   IA_E2E=1 npx vitest run tests/integration/ia-openai-e2e
 *
 * Lê `.env.local` (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY).
 * Falha se a resposta vier pelo fallback (Groq): o objetivo é provar a OpenAI.
 */
import fs from "node:fs";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

const LIGADO = process.env.IA_E2E === "1";

if (LIGADO && fs.existsSync(".env.local")) {
  for (const l of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

const QUESTAO_ID = "15ba75f9-71ea-476c-8038-e2723c3ac972"; // OBMEP 2021 N1 Q2 — fila de 100 pessoas
const IMAGEM_RESOLUCAO =
  "https://ebdazvyyunilbkygtevn.supabase.co/storage/v1/object/public/questoes/solucoes/OBMEP2015_N3_1F_Q06_sol.png";
const IMAGEM_LOCAL =
  "C:/Users/helio.barbosa/Documents/Claude/storage-backup-ebdazvyyunilbkygtevn/questoes/solucoes/OBMEP2015_N3_1F_Q06_sol.png";

describe.skipIf(!LIGADO)("OpenAI ponta a ponta", () => {
  const erros: string[] = [];
  const avisos: string[] = [];
  let restaurar: () => void = () => {};

  beforeAll(() => {
    const e = vi
      .spyOn(console, "error")
      .mockImplementation((...a) => erros.push(a.map(String).join(" ")));
    const w = vi
      .spyOn(console, "warn")
      .mockImplementation((...a) => avisos.push(a.map(String).join(" ")));
    restaurar = () => {
      e.mockRestore();
      w.mockRestore();
    };
  });
  afterAll(() => restaurar());

  it("avalia uma discursiva real pela OpenAI e devolve FeedbackIA válido", async () => {
    expect(process.env.OPENAI_API_KEY, "OPENAI_API_KEY ausente no .env.local").toBeTruthy();
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient() as any;
    const { data: questao } = await admin
      .from("questao")
      .select("enunciado")
      .eq("id", QUESTAO_ID)
      .single();
    const { data: solucao } = await admin
      .from("solucao")
      .select("texto")
      .eq("questao_id", QUESTAO_ID)
      .single();
    expect(questao?.enunciado).toBeTruthy();
    expect(solucao?.texto).toBeTruthy();

    const respostaAluno =
      "a) Em cada grupo de 5 posições há 3 mulheres, então em 100 posições há 20 grupos e 60 mulheres. " +
      "b) Como em cada 5 tem 2 homens e as posições 1 e 3 são homens, o padrão é H M H M M e a posição 100 é mulher.";

    const { avaliarRespostaAberta } = await import("@/lib/ai/avaliador");
    const inicio = Date.now();
    const feedback = await avaliarRespostaAberta(questao.enunciado, solucao.texto, respostaAluno);
    const ms = Date.now() - inicio;

    console.info("\n[e2e texto] enunciado:", questao.enunciado.replace(/\s+/g, " ").slice(0, 200));
    console.info("[e2e texto] resposta do aluno:", respostaAluno);
    console.info("[e2e texto] feedback:", JSON.stringify(feedback));
    console.info(`[e2e texto] ${ms} ms; erros=${erros.length}; avisos=${avisos.length}`);

    expect(feedback.itens.length).toBeGreaterThanOrEqual(1);
    for (const item of feedback.itens) {
      expect(["correto", "parcial", "incorreto", "nao_respondido"]).toContain(item.status);
      expect(item.comentario.length).toBeGreaterThan(0);
    }
    expect(feedback.resumo.length).toBeGreaterThan(0);
    expect(
      avisos.filter((a) => /fallback/.test(a)),
      "respondeu pelo fallback, não pela OpenAI",
    ).toEqual([]);
    expect(
      erros.filter((e) => /[ia] openai/.test(e)),
      "a OpenAI falhou",
    ).toEqual([]);
  }, 120_000);

  it("transcreve uma imagem de resolução pela OpenAI (visão)", async () => {
    let bytes: Buffer;
    if (fs.existsSync(IMAGEM_LOCAL)) bytes = fs.readFileSync(IMAGEM_LOCAL);
    else bytes = Buffer.from(await (await fetch(IMAGEM_RESOLUCAO)).arrayBuffer());
    const dataUrl = `data:image/png;base64,${bytes.toString("base64")}`;

    const { transcreverFotoAluno } = await import("@/lib/ai/avaliador");
    const inicio = Date.now();
    const foto = await transcreverFotoAluno(
      "Resolva a questão e mostre o raciocínio. a) Calcule. b) Justifique.",
      dataUrl,
    );
    const ms = Date.now() - inicio;

    console.info("\n[e2e visão] tipo:", foto.tipo);
    console.info("[e2e visão] transcrição:", foto.transcricao.replace(/\s+/g, " ").slice(0, 400));
    console.info(`[e2e visão] ${ms} ms; imagem ${(bytes.length / 1024).toFixed(0)} KB`);

    expect(["resolucao", "irrelevante", "ilegivel", "invalida"]).toContain(foto.tipo);
    expect(foto.tipo).toBe("resolucao");
    expect(foto.transcricao.length).toBeGreaterThan(20);
    expect(
      avisos.filter((a) => /fallback/.test(a)),
      "respondeu pelo fallback, não pela OpenAI",
    ).toEqual([]);
  }, 120_000);
});
