# Taxonomia canônica — banco de questões olimpiadas-raiz

Use EXATAMENTE estas strings (case-sensitive). Todo par tópico/subtópico deve vir desta lista.

## Tópicos e subtópicos

**Aritmética**

- Operações e cálculo
- Frações e números racionais
- Porcentagem e proporção
- Médias e estatística básica
- Grandezas, medidas e velocidade
- Matemática do cotidiano

**Teoria dos Números**

- Múltiplos, divisores e primos
- Divisibilidade e restos
- Algarismos e representação decimal
- Paridade
- Criptaritmética

**Álgebra**

- Equações e sistemas
- Expressões e desigualdades
- Padrões e sequências
- Somas e séries
- Funções e gráficos

**Geometria**

- Áreas e perímetros
- Ângulos, triângulos e polígonos
- Circunferências e círculos
- Geometria espacial
- Visualização e recortes
- Simetria e transformações

**Combinatória**

- Contagem
- Permutações, arranjos e combinações
- Casa dos pombos
- Inclusão-exclusão
- Configurações e tabuleiros

**Probabilidade**

- Probabilidade clássica
- Probabilidade e contagem

**Lógica**

- Dedução e verdade-mentira
- Jogos e estratégias
- Algoritmos e processos

## Critérios de desempate (coerência do conjunto)

- O tópico é o do NÚCLEO da resolução, não do enredo. Problema de compras que se resolve com equação → Álgebra; que se resolve contando → Combinatória.
- Contagem de casos SEM fórmula → Combinatória/Contagem; COM fatorial/arranjo → Permutações, arranjos e combinações.
- Chance/sorteio/dado/"probabilidade de" → Probabilidade (não Combinatória), mesmo que precise contar.
- Restos, ciclos de calendário, último algarismo → Teoria dos Números/Divisibilidade e restos.
- Criptaritmética (letras por algarismos) → Teoria dos Números/Criptaritmética.
- Sequências com padrão (figuras ou números) → Álgebra/Padrões e sequências.
- Dobradura, empilhamento de cubos, planificação, peças em malha → Geometria/Visualização e recortes.
- Tabuleiros/grades com contagem ou coloração → Combinatória/Configurações e tabuleiros; com estratégia de jogo → Lógica/Jogos e estratégias.
- Quem mente/quem fala a verdade, ordenação por pistas → Lógica/Dedução e verdade-mentira.

## Dificuldade (5 níveis: elementar, facil, medio, dificil, muito_dificil)

Relativa ao público do nível da prova. Âncora pela posição, ajuste ±1 nível pelo conteúdo:

- 1ª fase (20 questões): Q1-Q5 → elementar ou facil · Q6-Q10 → facil ou medio · Q11-Q15 → medio ou dificil · Q16-Q20 → dificil ou muito_dificil
- 2ª fase (dissertativa, 6 questões): Q1-Q2 → medio ou dificil · Q3-Q6 → dificil ou muito_dificil

## Público-alvo (valores: EFAF, EM, Todos)

- nivel_1 e nivel_2 → "EFAF" · nivel_3 → "EM"
- "Todos" SOMENTE para questão de lógica/visualização pura, sem pré-requisito de conteúdo escolar, acessível de qualquer série (usar com muita parcimônia).
- Nunca usar EFAI.

## Manutenção

- Fonte de verdade no código: `lib/questoes/taxonomia.ts` (alimenta os selects dos formulários de criar/editar questão). Alterou aqui, altere lá.
- Reclassificação completa das 350 questões aplicada em 16/07/2026 (leitura questão a questão, calibração de dificuldade por posição/fase verificada: média monotônica 1,55 → 2,42 → 3,12 → 4,18 nos blocos Q1-5 a Q16-20 da 1ª fase).
- Ao carregar prova nova (pipeline recortador-populador), classificar as questões JÁ NA CARGA usando esta taxonomia e estes critérios de desempate.
- Raio-X e filtros do treino são dinâmicos: novos tópicos aparecem automaticamente.
