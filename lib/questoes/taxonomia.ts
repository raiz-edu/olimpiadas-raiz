// Taxonomia canônica do banco de questões — única fonte de verdade.
// Todo par tópico/subtópico das questões deve vir desta lista (reclassificação
// completa das 350 questões em 16/07/2026). Ao criar tópico/subtópico novo,
// adicionar AQUI (o Raio-X e os filtros do treino são dinâmicos e acompanham).

export const TAXONOMIA_QUESTOES: Record<string, string[]> = {
  Aritmética: [
    "Operações e cálculo",
    "Frações e números racionais",
    "Porcentagem e proporção",
    "Médias e estatística básica",
    "Grandezas, medidas e velocidade",
    "Matemática do cotidiano",
  ],
  "Teoria dos Números": [
    "Múltiplos, divisores e primos",
    "Divisibilidade e restos",
    "Algarismos e representação decimal",
    "Paridade",
    "Criptaritmética",
  ],
  Álgebra: [
    "Equações e sistemas",
    "Expressões e desigualdades",
    "Padrões e sequências",
    "Somas e séries",
    "Funções e gráficos",
  ],
  Geometria: [
    "Áreas e perímetros",
    "Ângulos, triângulos e polígonos",
    "Circunferências e círculos",
    "Geometria espacial",
    "Visualização e recortes",
    "Simetria e transformações",
  ],
  Combinatória: [
    "Contagem",
    "Permutações, arranjos e combinações",
    "Casa dos pombos",
    "Inclusão-exclusão",
    "Configurações e tabuleiros",
  ],
  Probabilidade: ["Probabilidade clássica", "Probabilidade e contagem"],
  Lógica: ["Dedução e verdade-mentira", "Jogos e estratégias", "Algoritmos e processos"],
};

export const TOPICOS_QUESTOES = Object.keys(TAXONOMIA_QUESTOES);

/**
 * Tópico canônico que contém o subtópico dado (mapa reverso — o par é 1:1 na
 * taxonomia). Retorna null se o subtópico não pertence a nenhum tópico conhecido.
 * Usado para blindar o salvamento: subtópico preenchido nunca deve ficar sem tópico.
 */
export function topicoDeSubtopico(subtopico: string | null | undefined): string | null {
  if (!subtopico) return null;
  for (const [topico, subs] of Object.entries(TAXONOMIA_QUESTOES)) {
    if (subs.includes(subtopico)) return topico;
  }
  return null;
}
