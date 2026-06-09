import Groq from "groq-sdk";
import type { FeedbackIA } from "./types";

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurado");
  return new Groq({ apiKey: key });
}

export async function avaliarRespostaAberta(
  enunciado: string,
  solucao: string,
  resposta: string,
): Promise<FeedbackIA> {
  const groq = getClient();

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.1,
    max_tokens: 800,
    messages: [
      {
        role: "system",
        content:
          "Você é um avaliador de olimpíadas de matemática para estudantes do ensino fundamental (6º e 7º ano). Avalie com precisão mas de forma encorajadora. Considere raciocínio parcialmente correto.",
      },
      {
        role: "user",
        content: `Avalie a resposta do aluno para esta questão da OBMEP.

ENUNCIADO:
${enunciado}

SOLUÇÃO OFICIAL:
${solucao}

RESPOSTA DO ALUNO:
${resposta}

Identifique os itens (a, b, c…) na solução oficial e avalie cada um na resposta do aluno.
Responda SOMENTE com JSON válido, sem markdown:
{"itens":[{"item":"a","status":"correto","comentario":"..."},{"item":"b","status":"parcial","comentario":"..."}],"resumo":"..."}

Valores de status: correto, parcial, incorreto, nao_respondido`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Resposta inesperada da IA");
  return JSON.parse(match[0]) as FeedbackIA;
}
