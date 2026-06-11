import Groq from "groq-sdk";
import type { FeedbackIA } from "./types";

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY não configurado");
  return new Groq({ apiKey: key });
}

const SYSTEM_PROMPT =
  "Você é um avaliador de olimpíadas de matemática para estudantes do ensino fundamental (6º e 7º ano). Avalie com precisão mas de forma encorajadora. Considere raciocínio parcialmente correto.";

const INSTRUCOES_FORMATO = `Identifique TODOS os itens (a, b, c…) que aparecem no ENUNCIADO da questão — não apenas os cobertos pela solução oficial ou pela resposta do aluno — e avalie cada um deles. Um item do enunciado sem resposta correspondente deve ser marcado como "nao_respondido", mas NUNCA pode ser omitido da lista.

IMPORTANTE: avalie exclusivamente o conteúdo identificado como RESPOSTA DO ALUNO (texto e/ou a imagem indicada como tal). Imagens ou textos de SOLUÇÃO OFICIAL servem apenas de gabarito para comparação — NUNCA descreva ou pontue o conteúdo da solução oficial como se fosse a resposta do aluno. Se a resposta do aluno estiver vazia, ilegível, ou não tiver relação com o item (ex.: texto aleatório como "teste", "asdf", letras repetidas), marque esse item como "incorreto" — nunca "correto" ou "parcial" nesse caso, mesmo que a solução oficial esteja correta.

Responda SOMENTE com JSON válido, sem markdown:
{"itens":[{"item":"a","status":"correto","comentario":"..."},{"item":"b","status":"parcial","comentario":"..."}],"resumo":"..."}

Valores de status: correto, parcial, incorreto, nao_respondido`;

function parseFeedback(raw: string): FeedbackIA {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Resposta inesperada da IA");
  return JSON.parse(match[0]) as FeedbackIA;
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
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Avalie a resposta do aluno para esta questão da OBMEP.

ENUNCIADO:
${enunciado}

SOLUÇÃO OFICIAL:
${solucao}

RESPOSTA DO ALUNO:
${resposta}

${INSTRUCOES_FORMATO}`,
      },
    ],
  });

  return parseFeedback(completion.choices[0]?.message?.content ?? "{}");
}

// Avalia a partir de uma foto da resolução manuscrita do aluno — lê e avalia em uma única chamada.
export async function avaliarFotoAberta(
  enunciado: string,
  textoSolucao: string,
  imagensSolucaoUrls: string[],
  fotoAlunoBase64: string,
): Promise<FeedbackIA> {
  const groq = getClient();

  const partesSolucao = textoSolucao ? `\nSOLUÇÃO OFICIAL:\n${textoSolucao}\n` : "";
  const refImagemSolucao =
    imagensSolucaoUrls.length === 0
      ? "\nA imagem anexada contém a resolução manuscrita do aluno."
      : imagensSolucaoUrls.length === 1
        ? "\nA primeira imagem anexada contém a solução oficial. A última imagem é a resolução manuscrita do aluno."
        : `\nAs ${imagensSolucaoUrls.length} primeiras imagens anexadas contêm a solução oficial (em partes). A última imagem é a resolução manuscrita do aluno.`;

  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `Avalie a resposta do aluno para esta questão da OBMEP.

ENUNCIADO:
${enunciado}
${partesSolucao}
${refImagemSolucao}
Leia o conteúdo manuscrito da imagem do aluno (pode conter vários itens a, b, c…) e avalie cada item.

${INSTRUCOES_FORMATO}`,
    },
  ];

  for (const url of imagensSolucaoUrls) content.push({ type: "image_url", image_url: { url } });
  content.push({ type: "image_url", image_url: { url: fotoAlunoBase64 } });

  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.1,
    max_tokens: 800,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content },
    ],
  });

  return parseFeedback(completion.choices[0]?.message?.content ?? "{}");
}

// Transcreve o conteúdo da solução oficial a partir de imagens — não avalia nada.
// Mantida separada da avaliação para evitar que o modelo de visão confunda as
// imagens da solução com a resposta do aluno (ele tende a "avaliar a si mesmo").
async function extrairTextoSolucaoDeImagens(
  enunciado: string,
  imagensSolucaoUrls: string[],
): Promise<string> {
  const groq = getClient();

  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `As imagens anexadas contêm a solução oficial de uma questão de olimpíada de matemática.

ENUNCIADO (apenas para contexto):
${enunciado}

Transcreva o conteúdo da solução oficial em texto corrido, descrevendo o raciocínio e o resultado de cada item (a, b, c…). Apenas descreva o que está escrito/desenhado nas imagens — não avalie nada.`,
    },
  ];
  for (const url of imagensSolucaoUrls) content.push({ type: "image_url", image_url: { url } });

  const completion = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.1,
    max_tokens: 800,
    messages: [{ role: "user", content }],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}

// Avalia quando a solução oficial está disponível apenas como imagem (sem texto extraído).
// Primeiro transcreve a solução via visão, depois avalia em texto com avaliarRespostaAberta.
export async function avaliarRespostaAbertaComImagem(
  enunciado: string,
  imagensSolucaoUrls: string[],
  resposta: string,
): Promise<FeedbackIA> {
  const textoSolucao = await extrairTextoSolucaoDeImagens(enunciado, imagensSolucaoUrls);
  return avaliarRespostaAberta(enunciado, textoSolucao, resposta);
}
