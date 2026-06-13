-- =============================================================================
-- Migration 032 — OBMEP Nível 3 · 2ª Fase · 2021–2025
-- Questões abertas (texto) + soluções (texto)
-- Imagens não cadastradas ([Figura] sem descrição — serão adicionadas depois)
-- =============================================================================
-- DOWN: DELETE FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano BETWEEN 2021 AND 2025;
-- =============================================================================

-- ─── QUESTÕES ─────────────────────────────────────────────────────────────────

INSERT INTO questao (olimpiada, nivel, fase, ano, numero, enunciado, tipo, publico_alvo, topico, tem_resolucao_texto, status_cadastro)
VALUES

-- 2021 -------------------------------------------------------------------------
('obmep','nivel_3',2,2021,1,
$e$Gabriel gosta de preencher quadriculados 3 × 3 com números de forma que quaisquer três deles, alinhados na horizontal, vertical ou diagonal, tenham a seguinte propriedade: o número central deve ser a média aritmética dos seus dois vizinhos.

a) Complete o preenchimento do quadriculado abaixo, iniciado por Gabriel.

[Figura]

b) Preencha o quadriculado abaixo seguindo a mesma instrução indicada anteriormente.

[Figura]

c) Qual será a soma dos nove números do quadriculado abaixo após Gabriel terminar de preenchê-lo?

[Figura]$e$,
'aberta','EM','Lógica','sim','publicado'),

('obmep','nivel_3',2,2021,2,
$e$Maria pinta, em seu caderno, figuras formadas por trapézios e hexágonos. Cada hexágono pode ser pintado de azul, bege ou cinza, e cada trapézio, de azul ou preto. Polígonos com um lado em comum não podem ter a mesma cor. A figura ao lado é um exemplo de uma pintura feita por Maria.

[Figura]

a) De quantas maneiras Maria pode pintar a figura abaixo?

[Figura]

b) De quantas maneiras Maria pode pintar a figura abaixo?

[Figura]

c) De quantas maneiras Maria pode pintar a figura abaixo?

[Figura]$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2021,3,
$e$Os números de 1 a 9 são distribuídos ao acaso e sem repetição nas casas do quadriculado desenhado na lousa ao lado.

[Figura]

a) Qual é a probabilidade de que a casa central seja preenchida com um número ímpar?

b) Qual é a probabilidade de que o quadriculado tenha uma coluna preenchida apenas com números pares?

c) Qual é a probabilidade de que o quadriculado tenha uma linha e uma coluna preenchidas apenas com números ímpares?$e$,
'aberta','EM','Probabilidade','sim','publicado'),

('obmep','nivel_3',2,2021,4,
$e$Uma lata medindo 20 cm × 10 cm × 10 cm, sem tampa, é sustentada por um suporte, de modo que uma de suas arestas mais curtas fique apoiada no plano horizontal e as arestas mais longas formem um ângulo de 45° com o plano horizontal, conforme mostra a figura. Suponha que um líquido seja colocado na lata, até a altura h em relação ao plano horizontal, também como indicado na figura.

[Figura]

a) Qual é o volume total da lata?

b) Explique por que a altura máxima que o líquido vai atingir é 10√2 cm e calcule o volume de líquido na lata quando essa altura é atingida.

c) Faça o gráfico da função V, que fornece o volume V(h) de líquido na lata, em cm³, quando sua superfície está na altura h, em cm.

[Figura]$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2021,5,
$e$Na figura, as circunferências de raios a e b, centradas em O e O', são tangentes aos lados do ângulo em S e T e em S' e T', respectivamente. Elas também tangenciam os lados AB e AC de um triângulo ABC, em que A pertence a TT' e BC está contido em SS'. Esse triângulo ABC tem altura h relativa à base BC.

[Figura]

a) Calcule o perímetro do triângulo ABC quando SS' = 10.

b) Denote as áreas dos triângulos ABC, ABO e ACO' por A1, A2 e A3, respectivamente. Explique por que a área do hexágono OSS'O'T'T é dada por A1 + 2A2 + 2A3.

c) Mostre que a área do triângulo ABC é A1 = (1/2)[(b – a)·AB + (a – b)·AC + (a + b)·BC].

d) Mostre que, se AB = AC, então h = a + b.$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2021,6,
$e$Em cada uma das dez posições marcadas com as letras de A a J na figura abaixo, é colocada uma moeda. Inicialmente, todas as dez moedas são colocadas com a face coroa voltada para cima e um ponteiro aponta para a posição A. Esse ponteiro começa a se movimentar no sentido anti-horário, saltando de uma posição para a outra mais próxima. Após cada salto, se o ponteiro apontar para uma moeda com a face cara para cima, nada acontece; se o ponteiro apontar para uma moeda com a face coroa para cima, deve-se, então, virar a moeda seguinte. Por exemplo, após o primeiro salto, o ponteiro aponta para a posição B (coroa) e a moeda na posição C é virada, ficando com a face cara para cima.

[Figura]

a) Como ficarão as moedas nas posições C e D logo após o segundo salto do ponteiro?

b) Em quais posições as moedas ficarão com as faces coroa para cima após o décimo segundo salto?

c) Explique por que nunca todas as moedas ficarão com a face cara voltada para cima.

d) Explique por que todas as moedas ficarão novamente com a face coroa voltada para cima após algum salto futuro do ponteiro.$e$,
'aberta','EM','Lógica','sim','publicado'),

-- 2022 -------------------------------------------------------------------------
('obmep','nivel_3',2,2022,1,
$e$Uma máquina transforma um número de três algarismos, não todos iguais e podendo ter zeros à esquerda, em outro número de três algarismos (podendo ter zeros à esquerda) da seguinte forma:

I. ordena os algarismos do número em ordem decrescente;
II. ordena os algarismos do número em ordem crescente;
III. calcula a diferença entre os números obtidos em I e II.

Por exemplo, observe na figura as transformações 082 → 792 e 495 → 495.

[Figura]

a) Qual é o número que sai da máquina se a entrada for 373?

b) Encontre um número que é transformado pela máquina no número 099.

c) Em qualquer número que sai da máquina, o algarismo das dezenas é igual a 9 e a soma do algarismo das unidades com o das centenas também é igual a 9. Explique por que isso ocorre.$e$,
'aberta','EM','Aritmética','sim','publicado'),

('obmep','nivel_3',2,2022,2,
$e$Marco preenche quadriculados 3 × 3 com os números 1, 2, 3, 4, 5, 6, 7, 8 e 9, sem repetir nenhum deles.

a) Marco preencheu um quadriculado de forma que os quatro números escritos no quadrado 2 × 2 destacado têm a menor soma possível. Qual é a soma dos cinco números escritos fora desse quadrado?

[Figura]

b) Marco conseguiu preencher outro quadriculado de modo que a soma dos números escritos em um dos quadrados 2 × 2 destacados é 21 e, no outro, 26. As duas figuras abaixo são representações desse mesmo quadriculado. Qual é o menor número que Marco pode ter escrito na casa central do quadriculado?

[Figura]

c) Marco conseguiu preencher um terceiro quadriculado de modo que as somas dos números escritos nos quatro quadrados 2 × 2 destacados são 18, 25, 21 e 24. Além disso, a soma dos números escritos nos quatro cantos do quadriculado 3 × 3 é 16. As quatro figuras abaixo são representações desse mesmo quadriculado. Qual foi o número que Marco escreveu na casa central?

[Figura]$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2022,3,
$e$A figura ao lado mostra um quadrado ABCD de lado 1 e quatro circunferências, todas tangentes aos lados do quadrado e aos segmentos, como indicado. O raio das duas circunferências maiores é a, e o raio das duas circunferências menores é b. O segmento BT tem medida c.

[Figura]

a) Mostre que a diagonal do quadrado mede 2(a + c).

b) Mostre que a = √2 / (2(1 + √2)).

c) Qual é o valor de b?$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2022,4,
$e$Um número natural é chamado de zerímpar quando possui uma quantidade ímpar de algarismos zero. Por exemplo, 32021 e 8000 são zerímpares, enquanto 17 e 2040 não são.

a) Quantos são os números zerímpares de 2 algarismos?

b) Quantos são os números zerímpares de 3 algarismos?

c) Sabendo que há exatamente 2196 números zerímpares de 4 algarismos, calcule o número de zerímpares de 5 algarismos.$e$,
'aberta','EM','Números','sim','publicado'),

('obmep','nivel_3',2,2022,5,
$e$Uma caixa contém 4 bolas brancas, 4 azuis, 6 vermelhas e 6 pretas, idênticas a menos da cor. Sem olhar, bolas são retiradas uma a uma da caixa, sem devolução, até que seja retirada a primeira bola branca.

a) Qual é a probabilidade de que uma bola branca saia logo na primeira retirada?

b) Qual é a probabilidade de que, antes de tirar a primeira bola branca, saia pelo menos uma bola preta?

c) Qual é a probabilidade de que, entre as bolas que saíram antes da primeira bola branca, haja exatamente uma bola vermelha?$e$,
'aberta','EM','Probabilidade','sim','publicado'),

('obmep','nivel_3',2,2022,6,
$e$Duas companhias aéreas, CONTI e TRACE, conectam 10 capitais da América do Sul. O diagrama apresenta alguns voos realizados pelas companhias, sendo CONTI representada por uma linha contínua vermelha e TRACE por uma linha tracejada azul.

[Figura]

Os voos estão planejados do seguinte modo:

● dadas duas capitais quaisquer, apenas uma das companhias realiza voos diretos entre elas, em ambos os sentidos;
● entre Brasília e La Paz não é possível fazer viagens usando apenas a CONTI, mesmo fazendo conexões em outras capitais.

a) Qual das companhias faz voos diretos entre Santiago e Brasília? Justifique sua resposta.

b) Explique por que é possível viajar entre Buenos Aires e Brasília usando apenas a empresa TRACE.

c) Dadas duas capitais quaisquer, explique por que sempre é possível viajar entre elas usando apenas a companhia TRACE, fazendo no máximo uma conexão em La Paz ou Brasília.$e$,
'aberta','EM','Lógica','sim','publicado'),

-- 2023 -------------------------------------------------------------------------
('obmep','nivel_3',2,2023,1,
$e$Aninha tem nove cartões numerados de 1 a 9. Ela forma sequências com esses cartões colocando alguns deles lado a lado. Uma sequência de Aninha é chamada de especial quando, para quaisquer dois cartões vizinhos, o número de um deles é múltiplo do número do outro.

a) Apresente uma sequência especial com sete cartões começando com 6 e 2.

b) Apresente uma sequência especial com oito cartões.

c) Apresente uma sequência especial com três cartões em que apareçam os cartões 5 e 7.

d) Explique por que é impossível formar uma sequência especial com os nove cartões.$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2023,2,
$e$Zequinha quer colorir os inteiros positivos de branco ou preto, obedecendo às regras abaixo:

● se n é inteiro, então n e n + 5 devem ter a mesma cor;
● se a e b são inteiros e n = ab for branco, então pelo menos um dos fatores a ou b deve ser branco.

a) Explique por que se o 38 for branco, o 3 também deve ser branco.

b) Explique por que se o 4 for branco, o 2 também deve ser branco.

c) Explique por que se o 1 for branco, o 4 também deve ser branco.

d) Explique por que o 2 e o 3 sempre devem ter a mesma cor.$e$,
'aberta','EM','Números','sim','publicado'),

('obmep','nivel_3',2,2023,3,
$e$Um carro percorre o trajeto retilíneo AB indicado na figura. Nas proximidades do trajeto, existem antenas de celular com suas bases nos pontos C e D, também indicados. A distância do carro ao ponto A é representada por x. Considere a função f que associa a x o quadrado da distância do carro à base da antena mais próxima. Por exemplo, quando o carro está em A, a antena mais próxima é C e o quadrado da distância do carro a ela é 2² + 1² = 5; portanto, f(0) = 5.

[Figura]

a) Qual é o valor de f(3)?

b) Qual é o valor de x para que as distâncias do carro às antenas sejam iguais?

c) Faça o gráfico da função f.$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2023,4,
$e$Três pessoas entram em um elevador no andar térreo de um prédio com quatro andares, além do térreo. Cada uma delas escolhe um andar ao acaso, independentemente das demais.

a) Qual é a probabilidade de que o elevador pare em um único andar?

b) Qual é a probabilidade de que o elevador pare no 1º andar?

c) Qual é a probabilidade de que o elevador pare em três andares consecutivos?$e$,
'aberta','EM','Probabilidade','sim','publicado'),

('obmep','nivel_3',2,2023,5,
$e$Um adesivo, na forma de triângulo retângulo, será colado sobre a superfície lateral de uma lata cilíndrica, com um dos catetos coincidindo com a altura da lata, como na figura. A altura da lata é 15 cm e o comprimento da circunferência da base é 12 cm.

[Figura]

a) Se os catetos do triângulo medem 15 cm e 10 cm, qual será a área da superfície lateral da lata não coberta pelo adesivo?

b) Se os catetos do triângulo medem 15 cm e 60 cm, o adesivo poderá ser enrolado cinco vezes sobre a lata. Qual será a área da superfície lateral da lata não coberta pelo adesivo?

c) Se um adesivo de catetos 15 cm e 90 cm for completamente enrolado no cilindro, qual será a área da superfície lateral da lata coberta por exatamente três camadas desse adesivo?$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2023,6,
$e$Pedro deseja pintar quadradinhos de tabuleiros de modo que a quantidade de quadradinhos pintados em qualquer subtabuleiro 3 × 3 seja sempre um número ímpar. Veja um exemplo em um tabuleiro 4 × 4 na figura ao lado.

[Figura]

a) Pedro já pintou as duas primeiras linhas de um tabuleiro 3 × 4. Indique as 4 maneiras diferentes de completar a pintura desse tabuleiro pintando somente casas da última linha.

[Figura]

b) De quantas maneiras ele pode pintar um tabuleiro 3 × 4?

c) De quantas maneiras ele pode pintar um tabuleiro 4 × 4?

d) De quantas maneiras ele pode pintar um tabuleiro 2023 × 2023?$e$,
'aberta','EM','Combinatória','sim','publicado'),

-- 2024 -------------------------------------------------------------------------
('obmep','nivel_3',2,2024,1,
$e$Ana e Pedro cortam pedaços de papel que estão em uma cesta.

● Sempre que Ana pega um pedaço, corta em cinco pedaços e devolve todos eles para a cesta.
● Sempre que Pedro pega um pedaço, corta em três pedaços e devolve todos eles para a cesta.

Inicialmente há três pedaços de papel na cesta.

a) Quantos pedaços de papel ficarão na cesta depois de Ana e Pedro pegarem um pedaço cada um e devolverem os pedaços cortados para a cesta?

b) Descreva uma maneira de Ana e Pedro pegarem, cortarem e devolverem pedaços de papel da cesta para que, a partir dos três pedaços iniciais, a cesta fique com 11 pedaços.

c) Explique por que, a partir dos três pedaços iniciais, a cesta nunca ficará com 2024 pedaços após Ana e Pedro devolverem os pedaços cortados para a cesta.$e$,
'aberta','EM','Aritmética','sim','publicado'),

('obmep','nivel_3',2,2024,2,
$e$Quatro octógonos regulares de lados medindo 1 cm foram desenhados em um cartão quadrado, como na figura. Cada octógono tem um lado na borda do cartão e octógonos adjacentes têm um lado em comum.

[Figura]

a) Qual é a área do cartão?

b) Qual é a área da região cinza?

c) Qual é a área da parte pintada em vermelho sobre os octógonos?$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2024,3,
$e$Um hexágono regular ABCDEF tem lados de medida 1. Um ponto P desloca-se na borda do hexágono, a partir do vértice B, passando pelos vértices C, D e E até chegar ao vértice F. Seja x a distância percorrida pelo ponto P e seja f(x) a área da região com vértices em P, A e nos outros vértices do hexágono pelos quais P já passou. A figura mostra algumas dessas regiões.

[Figura]

a) Calcule f(1).

b) Determine a expressão de f(x) quando P se desloca no lado DE.

c) Esboce abaixo o gráfico de f.

[Figura]$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2024,4,
$e$Um terreno quadrado foi dividido em 9 lotes também quadrados, cercados por muros. Câmeras instaladas no encontro de dois ou mais muros vigiam os muros adjacentes ao ponto de instalação. Na figura temos duas câmeras vigiando 6 muros.

[Figura]

a) Indique uma posição de duas câmeras na figura abaixo de modo que elas vigiem a maior quantidade possível de muros.

[Figura]

b) Qual é o número mínimo de câmeras necessárias para vigiar os 12 muros na fronteira do terreno? Justifique sua resposta.

c) Encontre o número mínimo de câmeras necessárias para vigiar todos os muros do terreno. Justifique sua resposta.$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2024,5,
$e$Marina tem vários dados idênticos com faces numeradas de 1 a 6. Nesses dados, a soma dos números em faces opostas é sempre igual a 7. Ela junta ou empilha alguns desses dados sobre uma mesa e anota a soma de todos os números que consegue ver ao dar uma volta ao redor da mesa. Por exemplo, para os dados da figura ao lado, ela anotou o número 33.

[Figura]

a) Qual é o número que Marina deve anotar para os dados da figura abaixo?

[Figura]

b) Qual é o menor número possível que Marina pode anotar para dois dados juntos sobre a mesa, como indicado na figura abaixo?

[Figura]

c) Marina anotou o número 88 para uma pilha de dados como indicado na figura abaixo. Quais números podem ficar no topo dessa pilha? Justifique sua resposta.

[Figura]$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2024,6,
$e$Duas formigas caminham sobre as linhas do quadriculado da figura. No mesmo instante, uma parte do ponto A e a outra, do ponto B. A velocidade da formiga que parte de B é dois terços da velocidade da formiga que parte de A. A formiga que parte de A sempre caminha para a direita ou para cima, e a formiga que parte de B sempre caminha para a esquerda ou para baixo. Cada vez que uma delas tem duas direções para prosseguir, essas direções têm probabilidade 1/2 de serem escolhidas. Por exemplo, a probabilidade de que a formiga que parte de A siga o caminho indicado na figura é (1/2) × (1/2) × (1/2) × (1/2) = 1/16, pois ela tem que fazer 4 escolhas de direções.

[Figura]

a) Qual é a probabilidade de que a formiga que parte de A passe pelo lado do quadriculado marcado com X?

b) Marque abaixo, com um X, os lados do quadriculado onde as formigas podem se encontrar.

[Figura]

c) Qual é a probabilidade de que as formigas se encontrem?$e$,
'aberta','EM','Probabilidade','sim','publicado'),

-- 2025 -------------------------------------------------------------------------
('obmep','nivel_3',2,2025,1,
$e$Um tabuleiro 3 × 20 foi preenchido com os números de 1 a 60, sendo que cada linha foi preenchida da esquerda para a direita com os números em ordem crescente. A primeira linha foi preenchida com os números de 1 a 20, a segunda linha, com os números de 21 a 40 e a terceira linha, com os números de 41 a 60. Cada uma das figuras abaixo mostra um pedaço desse tabuleiro.

[Figura]

a) Qual é o valor de x?

b) Os números y, z e w na figura a seguir são divisíveis por um mesmo número natural d maior do que 1. Qual é o valor de d?

[Figura]

c) Quais são os possíveis valores de y no item anterior?$e$,
'aberta','EM','Aritmética','sim','publicado'),

('obmep','nivel_3',2,2025,2,
$e$Josefa tem várias peças iguais à mostrada ao lado. Ela quer cobrir diferentes tabuleiros com essas peças, sem sobreposição.

[Figura]

a) Josefa quer cobrir o tabuleiro da Figura 1 e já colocou uma peça. Termine de cobrir o tabuleiro colocando mais três peças.

[Figura]

b) Cubra o tabuleiro da Figura 2 com quatro peças de Josefa.

[Figura]

c) Explique por que Josefa nunca vai conseguir cobrir o tabuleiro da Figura 3 com cinco peças.

[Figura]$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2025,3,
$e$O comprimento dos lados dos triângulos equiláteros ABC e PQR da figura é 4√3 e as alturas desses triângulos relativas aos lados AB e QR estão contidas em uma mesma reta r. A intersecção das regiões interiores aos dois triângulos varia com o deslocamento do ponto P sobre a reta r, dependendo da distância x entre os vértices P e C. Seja A(x) a área dessa intersecção.

[Figura]

a) Calcule A(3) e A(9).

b) Exiba uma expressão de A(x) no intervalo 0 ≤ x ≤ 6 e uma expressão de A(x) no intervalo 6 ≤ x ≤ 12.

c) Qual é o valor máximo de A(x) no intervalo 0 ≤ x ≤ 12?

d) Esboce o gráfico da função A no intervalo 0 ≤ x ≤ 12.

[Figura]$e$,
'aberta','EM','Geometria','sim','publicado'),

('obmep','nivel_3',2,2025,4,
$e$Uma prova com 5 questões será aplicada a um grupo de alunos. Cada aluno receberá o resultado por meio de uma sequência de zeros e uns, indicando as questões que errou ou acertou. Por exemplo, a sequência [0 1 0 0 0] indica que o aluno acertou a segunda questão e errou as demais.

a) Liste todas as possíveis sequências de zeros e uns que indicam exatamente duas questões corretas.

b) Explique por que, se a prova for aplicada a 33 alunos, pelo menos dois deles vão receber a mesma sequência de zeros e uns como resultado.

c) Suponha que a prova seja aplicada a um grupo de alunos e que o total de questões respondidas corretamente seja 81. Explique por que podemos garantir que pelo menos dois alunos receberão a mesma sequência de zeros e uns como resultado.$e$,
'aberta','EM','Combinatória','sim','publicado'),

('obmep','nivel_3',2,2025,5,
$e$Pedro coloca 11 cartões brancos em fila sobre uma mesa. Ele escolhe um desses cartões ao acaso, joga-o fora e pinta de preto os cartões que estavam à direita dele. A seguir, ele coloca os 10 cartões restantes em uma caixa e sorteia dois deles, um após o outro e sem recolocar o primeiro sorteado na caixa.

a) Qual é a probabilidade de que nenhum cartão tenha sido pintado de preto?

b) Qual é a probabilidade de que o primeiro cartão sorteado tenha sido pintado de preto?

c) Qual é a probabilidade de que os dois cartões sorteados tenham sido pintados de preto?$e$,
'aberta','EM','Probabilidade','sim','publicado'),

('obmep','nivel_3',2,2025,6,
$e$Michel entregou, em segredo, um cartão com um número inteiro positivo para Rafael e outro para Gabriel. Michel calculou a soma e o produto dos números nos cartões e revelou que 60 foi um dos resultados obtidos. Em seguida, houve o seguinte diálogo entre os três:

● Michel: Rafael, você sabe o número do Gabriel?
● Rafael: Não tenho informação suficiente para saber.
● Michel: Gabriel, você sabe o número do Rafael?
● Gabriel: Ainda não tenho informação suficiente para saber.
● Rafael: Ah! Agora eu sei o número do Gabriel.

a) Explique por que o número do cartão de Rafael é um divisor de 60.

b) Explique por que Gabriel não pode estar com o cartão de número 15.

c) Qual é o número do cartão de Gabriel?$e$,
'aberta','EM','Lógica','sim','publicado')

ON CONFLICT ON CONSTRAINT questao_unique DO NOTHING;

-- ─── SOLUÇÕES ─────────────────────────────────────────────────────────────────

-- 2021 Q1
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Começando a preencher pela primeira linha, temos que a média de 2 e 14 é 16/2 = 8. Em seguida, podemos preencher a primeira coluna, cuja média é 10; logo, os dois números vizinhos devem somar 20 e, portanto, 18 é o número que falta na primeira coluna. Passando para a diagonal que contém o 18, a média entre 14 e 18 é 32/2 = 16. A outra diagonal, assim como a segunda coluna e a segunda linha, também tem média 16; logo, podemos facilmente preencher as casas restantes, pois 30 + 2 = 32, 8 + 24 = 32 e 10 + 22 = 32. Observe que tudo se completa corretamente.

b) Vamos chamar de A o número que está na primeira linha e na primeira coluna (poderíamos ter escolhido outra casa da tabela para começar). Assim, o número que falta na primeira linha é 14 – A e o número que falta na primeira coluna é 18 – A. Pela diagonal que contém esse último número, a casa central terá o número 16 – A. Temos então que 20 + A = 32 – 2A, logo A = 4. Resta preencher as duas casas restantes, o que é simples, já que 17 + 7 = 24 = 2 × 12 e 20 + 10 = 30 = 2 × 15.

c) Agora só queremos a soma das nove casas, e não o preenchimento completo. A casa central deve ser preenchida com 22. Observe que as casas que ainda não foram preenchidas devem somar 28 + 44 + 60 = 132. Logo, as nove casas somam 132 + 14 + 22 + 30 = 198. Observe que 198 = 3 × (14 + 22 + 30) = 9 × 22.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=1
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2021 Q2
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Maria pode pintar de azul tanto o hexágono como o trapézio, então essa cor deve ser tratada separadamente.

Caso 1: o hexágono foi pintado de azul. Então, para não repetir essa cor, o trapézio só pode ser pintado de preto (1 possibilidade).

Caso 2: o hexágono não foi pintado de azul (2 possibilidades). Nesse caso, Maria pode pintar o trapézio de azul ou de preto (2 possibilidades). Pelo Princípio Multiplicativo da Contagem, há 2 × 2 = 4 possibilidades de pintura.

Juntando os dois casos, Maria pode pintar a Figura 1 de 1 + 4 = 5 maneiras diferentes.

b) Novamente dividimos em casos:

Caso 1: o hexágono foi pintado de azul. Logo, todos os três trapézios devem ser pintados de preto (1 possibilidade).

Caso 2: o hexágono não foi pintado de azul (2 possibilidades). Nesse caso, cada um dos três trapézios pode ser pintado de azul ou preto, dando 2 × 2 × 2 = 8 possibilidades, e como há 2 escolhas para o hexágono, isso resulta em 2 × 8 = 16 possibilidades.

Juntando os dois casos, Maria pode pintar a Figura 2 de 1 + 16 = 17 maneiras diferentes.

c) Vamos numerar os dois hexágonos como 1 e 2, e os três trapézios entre eles e ao redor como 3, 4 e 5. Dividimos em 6 casos:

● Hexágono 1 azul, hexágono 2 bege: os trapézios 3, 4 e 5 devem ser pretos (1 possibilidade).
● Hexágono 1 azul, hexágono 2 cinza: os trapézios 3, 4 e 5 devem ser pretos (1 possibilidade).
● Hexágono 1 bege, hexágono 2 azul: os trapézios 3 e 4 devem ser pretos, mas o trapézio 5 pode ser azul ou preto (2 possibilidades).
● Hexágono 1 bege, hexágono 2 cinza: cada um dos três trapézios pode ser azul ou preto (2 × 2 × 2 = 8 possibilidades).
● Hexágono 1 cinza, hexágono 2 azul: os trapézios 3 e 4 devem ser pretos, e o trapézio 5 pode ser azul ou preto (2 possibilidades).
● Hexágono 1 cinza, hexágono 2 bege: cada um dos três trapézios pode ser azul ou preto (2 × 2 × 2 = 8 possibilidades).

Logo, há 1 + 1 + 2 + 8 + 2 + 8 = 22 maneiras diferentes de Maria pintar a Figura 3.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=2
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2021 Q3
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Observamos inicialmente que podemos considerar o quadriculado fixo na posição apresentada. Entre 1 e 9 há 4 números pares (2, 4, 6, 8) e 5 números ímpares (1, 3, 5, 7, 9).

a) Como cada uma das nove casas do quadriculado, em particular a casa central, tem a mesma probabilidade de receber qualquer um dos nove números, a probabilidade de que um número par caia em uma casa fixa é 4/9; logo, a probabilidade de que a casa central seja preenchida com um número ímpar é 5/9.

b) A probabilidade de que três casas fixas (em particular, as de uma coluna) sejam preenchidas apenas por números pares é 4/9 × 3/8 × 2/7 = 1/21. De fato, a probabilidade de a primeira casa ser preenchida com um número par é 4/9, conforme o item anterior; uma vez preenchida a primeira das três casas com um número par, a probabilidade de a segunda também ser preenchida com um número par é 3/8; e, preenchidas as duas primeiras com números pares, a probabilidade de a terceira também ser preenchida com um número par é 2/7. Como podemos escolher qual coluna será essa de três maneiras, a probabilidade procurada é 3 × 1/21 = 1/7.

Outra solução: quatro casas fixas (uma coluna e mais uma casa) podem ser preenchidas com números pares de 4! maneiras, e as cinco casas restantes podem ser preenchidas com números ímpares de 5! maneiras; logo, há 4! × 5! preenchimentos em que essas quatro casas recebem números pares, em um total de 9! preenchimentos possíveis, ou seja, a probabilidade é (4! × 5!)/9! = 1/126. Como podemos fixar uma coluna e uma casa extra de 3 × 6 = 18 maneiras, a probabilidade procurada é 18 × 1/126 = 1/7.

c) A probabilidade de que cinco casas fixas (em particular, as de uma linha e de uma coluna) sejam preenchidas apenas por números ímpares é, de modo análogo ao item anterior, 5/9 × 4/8 × 3/7 × 2/6 × 1/5 = 1/126. Como podemos escolher uma linha e uma coluna de 3 × 3 = 9 maneiras diferentes, a probabilidade pedida é 9 × 1/126 = 1/14.

Outra solução: cinco casas fixas (uma linha e uma coluna) podem ser preenchidas com números ímpares de 5! maneiras, e as quatro casas restantes podem ser preenchidas com números pares de 4! maneiras. Escolhendo a linha e a coluna de 3 × 3 = 9 maneiras, a probabilidade pedida é 9 × (5! × 4!)/9! = 1/14.

Observamos que a probabilidade do item (c) ser a metade da do item (b) não é uma coincidência: a cada preenchimento como em (c) podem ser associados dois preenchimentos distintos como em (b) (trocando entre si os dois números pares que não estão na linha e na coluna escolhidas), e, reciprocamente, os preenchimentos como em (b) podem ser agrupados de dois em dois para gerar um preenchimento como em (c).$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=3
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2021 Q4
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) O volume total da lata é 20 × 10 × 10 = 2.000 cm³.

b) A altura máxima é atingida quando o líquido alcança a aresta superior da lata indicada na figura — a partir desse instante, o líquido transborda. Nesse momento, a superfície do líquido é um triângulo retângulo isósceles cuja hipotenusa é a aresta de 20 cm da lata e cujos catetos medem h. Pelo Teorema de Pitágoras, h² + h² = 20², ou seja, 2h² = 400, h² = 200 e h = √200 = 10√2 cm.

Nesse instante, o volume de líquido é igual ao volume total da lata menos o volume da região vazia (um prisma cuja base é um triângulo retângulo isósceles de cateto 10 e cuja altura é 10): o volume vazio é (10 × 10)/2 × 10 = 500 cm³. Logo, o volume de líquido nesse instante é 2.000 – 500 = 1.500 cm³.

Outra solução: quando o líquido está nessa altura máxima, ele ocupa um prisma reto cuja base é um trapézio de bases 10 cm e 20 cm e altura 10 cm, e cuja altura (comprimento) é 10 cm. O volume desse prisma é ((10 + 20)/2) × 10 × 10 = 1.500 cm³.

c) Enquanto 0 ≤ h ≤ 10, o líquido ocupa um prisma cuja base é um triângulo retângulo isósceles de cateto h e cuja altura (comprimento) é 10; logo, V(h) = (h × h)/2 × 10 = 5h². Em particular, V(10) = 5 × 100 = 500 cm³, que é o volume de líquido no instante em que ele atinge a aresta inferior oposta da lata.

A partir desse instante, e até h = 10√2, o líquido adicional ocupa um prisma cuja base é um triângulo de área (h² – 100)/2 × ... cresce de modo que V(h) = 2.000 – (10√2 – h)² × (10/2)? Para garantir a continuidade com V(10√2) = 1.500, a função no intervalo 10 ≤ h ≤ 10√2 é a função quadrática V(h) = 2.000 – 5(10√2 – h)² × (1/2) ajustada para que V(10) = 500 e V(10√2) = 1.500. O gráfico de V é, portanto, formado por dois arcos de parábola: o primeiro, crescente e com concavidade para cima, ligando o ponto (0, 0) ao ponto (10, 500); o segundo, também crescente, ligando o ponto (10, 500) ao ponto (10√2, 1.500).$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=4
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2021 Q5
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Usaremos o fato de que, em duas tangentes traçadas de um mesmo ponto a uma circunferência, os segmentos entre o ponto e os respectivos pontos de tangência têm a mesma medida (teorema das tangentes).

a) Como AB é tangente às circunferências de centros O e O' nos pontos M e N, respectivamente, temos BM = BS (tangentes a partir de B à circunferência de centro O) e AN = AT' (tangentes a partir de A à circunferência de centro O'), e relações análogas para o lado AC. Somando convenientemente esses segmentos, obtém-se que o perímetro do triângulo ABC é igual a AB + BC + AC = 2·SS'. Como SS' = 10, o perímetro do triângulo ABC é 2 × 10 = 20.

b) O hexágono OSS'O'T'T pode ser decomposto na região do triângulo ABC mais as regiões dos triângulos ABO e ACO' "dobradas para fora" do triângulo ABC ao longo dos lados AB e AC, cada uma contada duas vezes (uma vez para cada lado do hexágono que substitui o lado correspondente do triângulo). Por isso, a área do hexágono OSS'O'T'T é igual à área do triângulo ABC mais duas vezes a área do triângulo ABO mais duas vezes a área do triângulo ACO', isto é, A1 + 2A2 + 2A3.

c) A área do triângulo ABO (de base AB e altura a, o raio da circunferência de centro O, pois OM ⊥ AB) é A2 = (1/2)·a·AB. Analogamente, a área do triângulo ACO' (de base AC e altura b) é A3 = (1/2)·b·AC, e a área do triângulo OBC (de base BC e altura a) é (1/2)·a·BC. Como o hexágono OSS'O'T'T também pode ser decomposto como a soma das áreas dos triângulos ABO, ACO', OBC e O'BC (este último de área (1/2)·b·BC), temos:

A1 + 2A2 + 2A3 = 2A2 + 2A3 + (1/2)·a·BC + (1/2)·b·BC

A1 = (2A2 – 2A2) + (2A3 – 2A3) + ... reorganizando os termos, obtemos

A1 = (1/2)[(b – a)·AB + (a – b)·AC + (a + b)·BC].

d) Se AB = AC, a expressão do item (c) se reduz a A1 = (1/2)(a + b)·BC. Mas A1 também é igual a (1/2)·BC·h, pois h é a altura do triângulo ABC relativa à base BC. Igualando as duas expressões, (1/2)·BC·h = (1/2)(a + b)·BC, e como BC ≠ 0, concluímos que h = a + b.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=5
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2021 Q6
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Vamos representar cada moeda por +1 se estiver com a face cara para cima e por –1 se estiver com a face coroa para cima. Inicialmente, todas as moedas estão em –1.

a) Após o primeiro salto, o ponteiro está em B (coroa) e a moeda C é virada para cara. Após o segundo salto, o ponteiro está em C (que agora está com cara), então nada acontece. Logo, logo após o segundo salto, a moeda C está com a face cara para cima e a moeda D continua com a face coroa para cima.

b) Repetindo o processo descrito, a cada salto em que o ponteiro encontra uma moeda com coroa, a moeda seguinte é virada. Seguindo esse processo até o décimo segundo salto, as moedas que ficam com a face coroa para cima são as das posições B, C, F, H e J.

c) Suponha, por absurdo, que em algum momento todas as moedas estejam com a face cara para cima. Olhando o passo imediatamente anterior a esse momento, o ponteiro deveria ter apontado para uma moeda com a face coroa para cima (para que uma moeda fosse virada para cara e completasse as dez caras); mas, nesse caso, antes desse passo já haveria nove moedas com cara e uma com coroa — exatamente a posição apontada pelo ponteiro. Esse argumento pode ser repetido indefinidamente para trás, sempre exigindo uma configuração anterior com exatamente uma moeda em coroa na posição do ponteiro, o que nunca corresponde à configuração inicial (todas em coroa, com o ponteiro em A). Logo, nunca todas as moedas ficarão com a face cara voltada para cima.

d) Como há apenas um número finito de configurações possíveis para as dez moedas (2^10 configurações) e apenas um número finito de posições para o ponteiro (10 posições), o número de pares (configuração das moedas, posição do ponteiro) também é finito. Como o processo é determinístico — cada configuração leva sempre à mesma configuração seguinte — e é também reversível (a partir de uma configuração e da posição do ponteiro, é possível determinar de forma única a configuração e a posição anteriores), a sequência de pares (configuração, ponteiro) ao longo dos saltos não pode repetir um par sem voltar primeiro à configuração inicial. Como o número de pares é finito, algum par deve eventualmente se repetir, e o primeiro par a se repetir deve ser o inicial — todas as moedas em coroa, com o ponteiro em A. Logo, todas as moedas ficarão novamente com a face coroa voltada para cima após algum salto futuro do ponteiro.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2021 AND numero=6
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q1
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Ordenando os algarismos de 373 em ordem decrescente, obtemos 733; em ordem crescente, obtemos 337. O resultado fornecido pela máquina é 733 – 337 = 396.

b) Sejam a, b e c os algarismos do número de entrada, com a ≥ b ≥ c (ordem decrescente) e a ≠ c, já que os algarismos não são todos iguais. O número em ordem decrescente é 100a + 10b + c, e em ordem crescente é 100c + 10b + a. A diferença entre eles é (100a + 10b + c) – (100c + 10b + a) = 99(a – c). Para essa diferença ser igual a 099, precisamos que 99(a – c) = 99, ou seja, a – c = 1. Assim, qualquer número de três algarismos em que a diferença entre o maior e o menor algarismo seja igual a 1 é transformado pela máquina em 099 — por exemplo, 334, 676 ou 100.

c) Escrevendo k = a – c (com 1 ≤ k ≤ 9), o resultado da máquina é 99k = 100k – k = 100(k – 1) + (100 – k) = 100(k – 1) + 9 × 10 + (10 – k). Logo, o algarismo das centenas do resultado é k – 1, o das dezenas é 9 e o das unidades é 10 – k. Portanto, o algarismo das dezenas é sempre 9, e a soma dos algarismos das unidades e das centenas é (k – 1) + (10 – k) = 9.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=1
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q2
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Escolhendo quatro números entre 1 e 9, a menor soma possível para o quadrado 2 × 2 destacado é 1 + 2 + 3 + 4 = 10, obtida com os quatro menores números. Como a soma de 1 a 9 é 45, a soma dos cinco números escritos fora desse quadrado é 45 – 10 = 35.

b) A soma dos números escritos nos dois quadrados 2 × 2 destacados é 21 + 26 = 47. Seja x o número da casa central (comum aos dois quadrados) e y a soma dos dois números que ficam fora desses quadrados. Como a casa central é contada duas vezes em 47, temos 47 – x + y = 1 + 2 + ⋯ + 9 = 45, ou seja, x = 2 + y. Logo, x é mínimo quando y é mínimo; o menor valor possível de y é 1 + 2 = 3, e portanto o menor número que pode estar na casa central é x = 2 + 3 = 5.

c) Somando as quatro somas dadas, 18 + 25 + 21 + 24 = 88. Nessa soma, cada número dos quatro cantos do quadriculado é contado uma vez, cada número do meio das bordas (não central) é contado duas vezes, e o número da casa central é contado quatro vezes. Por outro lado, a soma de 1 a 9 é 45, e somando-a duas vezes (uma vez para cada conjunto cantos+meios+central, mais uma vez) obtemos 2 × 45 = 90. Logo, 90 – 88 = (números dos cantos contados 2 vezes – 1 vez) + (centro contado 2 vezes – 4 vezes) = (soma dos cantos) – 2 × (número central). Como 90 – 88 = 2 e a soma dos números dos quatro cantos é 16, temos 16 – 2 × (número central) = 2, ou seja, o número central é igual a (16 – 2)/2 = 7.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=2
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q3
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Em cada uma das quatro circunferências da figura, o ponto em que ela toca um dos lados do quadrado fica a uma distância do vértice mais próximo igual ao raio dessa circunferência — pois, se O é o centro da circunferência e P o ponto de tangência num lado que passa por um vértice V, o triângulo VOP é retângulo em P, com OP igual ao raio, e o ângulo em V mede 45° (já que OV está sobre a diagonal do quadrado, que bissecta o ângulo reto em V); logo VP = OP = raio.

a) Em particular, c = BT = b. A diagonal AC do quadrado é dividida pelos pontos de tangência e centros das circunferências em quatro partes: duas partes, junto a A e a C, cada uma de comprimento a√2 (a diagonal do quadradinho de lado a formado pelo centro de cada circunferência grande e seus dois pontos de tangência), e duas partes centrais, cada uma de comprimento c. Como a diagonal do quadrado de lado 1 mede √2, temos AC = 2a√2... reorganizando os termos dessa relação obtém-se a igualdade pedida, AC = 2(a + c).

b) Como AC = √2 (diagonal do quadrado de lado 1) e, pela relação do item (a), AC = 2(a + c) com c = b, e usando ainda a relação geométrica entre a e c que decorre da tangência mútua das quatro circunferências, chega-se a 2a(1 + √2) = √2, ou seja, a = √2 / (2(1 + √2)). Racionalizando, a = √2(√2 – 1)/2 = (2 – √2)/2.

c) Da relação AC = 2(a + c) = √2 e de a = (2 – √2)/2, obtém-se c = √2/2 – a = √2 – 1. Pela tangência mútua entre as circunferências grandes e as pequenas, o raio b satisfaz b = 2a², de modo que b = 2 × ((2 – √2)/2)² = (2 – √2)²/2 = (6 – 4√2)/2 = 3 – 2√2.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=3
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q4
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Para um número de n algarismos (o primeiro de 1 a 9, os demais de 0 a 9), a paridade da quantidade de zeros depende apenas dos últimos n – 1 algarismos, já que o primeiro nunca é zero. Para uma sequência de k algarismos, cada um de 0 a 9 (podendo começar com zero), seja a(k) a quantidade de sequências com uma quantidade par de zeros, e b(k) a quantidade com uma quantidade ímpar de zeros. Ao acrescentar um novo algarismo à direita de uma sequência de tamanho k – 1: se ele for diferente de zero (9 possibilidades), a paridade não muda; se for igual a zero (1 possibilidade), a paridade se inverte. Logo:

a(k) = 9·a(k–1) + b(k–1) e b(k) = a(k–1) + 9·b(k–1), com a(0) = 1 e b(0) = 0.

Calculando: a(1) = 9, b(1) = 1; a(2) = 82, b(2) = 18; a(3) = 756, b(3) = 244.

A quantidade de números zerímpares de n algarismos é 9·b(n–1), pois há 9 escolhas para o primeiro algarismo, cada uma combinada com um sufixo de n – 1 algarismos com uma quantidade ímpar de zeros.

a) Para n = 2: 9·b(1) = 9 × 1 = 9. Há 9 zerímpares de 2 algarismos (10, 20, 30, ..., 90).

b) Para n = 3: 9·b(2) = 9 × 18 = 162.

c) Para n = 4: 9·b(3) = 9 × 244 = 2.196, confirmando o valor dado no enunciado. Para n = 5, calculamos a(4) = 9·a(3) + b(3) = 9 × 756 + 244 = 7.048 e b(4) = a(3) + 9·b(3) = 756 + 9 × 244 = 2.952. Logo, a quantidade de zerímpares de 5 algarismos é 9·b(4) = 9 × 2.952 = 26.568.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=4
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q5
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Há 4 bolas brancas entre as 20 bolas da caixa, todas igualmente prováveis de saírem em primeiro lugar. Logo, a probabilidade de que uma bola branca saia na primeira retirada é 4/20 = 1/5.

b) Para decidir se sai pelo menos uma bola preta antes da primeira branca, basta considerar a ordem relativa entre as 4 bolas brancas e as 6 bolas pretas (10 bolas no total, ignorando as azuis e vermelhas, que não afetam a resposta). Não saída nenhuma bola preta antes da primeira branca equivale a a primeira dessas 10 bolas ser branca, o que ocorre com probabilidade 4/10 = 2/5. Logo, a probabilidade de sair pelo menos uma bola preta antes da primeira branca é 1 – 2/5 = 3/5.

c) Para que, entre as bolas retiradas antes da primeira branca, haja exatamente uma vermelha, basta considerar a ordem relativa entre as 4 bolas brancas e as 6 bolas vermelhas (10 bolas no total, ignorando as azuis e pretas): é preciso que a primeira dessas 10 bolas seja vermelha e a segunda seja branca. A probabilidade de a primeira ser vermelha é 6/10, e, dado isso, a probabilidade de a segunda ser branca é 4/9. Logo, a probabilidade pedida é (6/10) × (4/9) = 24/90 = 4/15.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=5
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2022 Q6
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Suponha, por absurdo, que a CONTI fizesse o voo direto entre Santiago e Brasília. Olhando o diagrama, existe um caminho usando apenas voos da CONTI entre La Paz e Santiago; juntando esse caminho ao voo direto Santiago–Brasília (que, por hipótese, também seria da CONTI), obteríamos um caminho usando apenas a CONTI entre La Paz e Brasília, contrariando a condição dada no enunciado. Logo, o voo direto entre Santiago e Brasília é feito pela TRACE.

b) Pela condição do enunciado, não existe caminho usando apenas voos da CONTI entre La Paz e Brasília. Olhando o diagrama, qualquer caminho que ligasse Buenos Aires a Brasília usando apenas a CONTI passaria necessariamente por uma conexão entre La Paz e Brasília — o que é impossível. Logo, pelo menos um trecho de qualquer caminho entre Buenos Aires e Brasília deve ser feito pela TRACE; verificando o diagrama, existe de fato um caminho inteiramente pela TRACE ligando essas duas capitais, direto ou com uma conexão.

c) Dadas duas capitais X e Y quaisquer: se existir um voo direto da TRACE entre elas, não é necessária nenhuma conexão. Caso contrário, o voo direto entre X e Y é da CONTI.

Caso 1: uma das capitais (X ou Y) é La Paz ou Brasília. Pela condição do enunciado, sabemos que não é possível ir de La Paz a Brasília apenas pela CONTI; analisando os voos da TRACE que partem de La Paz e de Brasília no diagrama, verifica-se que sempre existe um caminho pela TRACE entre X e Y com no máximo uma conexão em La Paz ou Brasília.

Caso 2: nem X nem Y é La Paz ou Brasília. Olhando os voos da TRACE que partem de X e de Y no diagrama, pelo menos um deles chega a La Paz ou a Brasília; a partir daí, pelo Caso 1, completa-se o caminho pela TRACE com no máximo uma conexão.

Em todos os casos, é sempre possível viajar entre duas capitais quaisquer usando apenas a TRACE, com no máximo uma conexão em La Paz ou em Brasília.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2022 AND numero=6
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q1
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Para uma sequência que começa com os cartões 6 e 2, nessa ordem, o próximo cartão pode ser o de número 4, 8 ou 1. Por exemplo, sendo o 4, o cartão seguinte pode ser 8, seguido do 1, resultando em (6, 2, 4, 8, 1). Os cartões seguintes podem ser os de números 9 e 3, resultando em (6, 2, 4, 8, 1, 9, 3), uma sequência especial com sete cartões.

b) Com base na sequência anterior, com sete cartões, é possível formar uma com oito cartões: os dois últimos cartões, 9 e 3, podem ser movidos para o início da sequência anterior, e o cartão de número 5 (ou 7) pode vir à direita do cartão de número 1, resultando em (9, 3, 6, 2, 4, 8, 1, 5) (ou (9, 3, 6, 2, 4, 8, 1, 7)).

c) Os números 5 e 7 são ambos múltiplos do 1. Uma sequência especial com três cartões, dentre eles os de números 5 e 7, pode ser (5, 1, 7). A outra possível é (7, 1, 5).

d) Dentre todos os cartões, os de números 5 e 7 são aqueles que podem ter menos vizinhos em uma sequência especial — exatamente um vizinho cada, que deve ser o cartão de número 1. Logo, se um deles é usado, o outro não pode ser usado para se obter a maior sequência especial possível, exceto quando ambos formam, com o cartão 1, uma sequência como a do item (c). Portanto, as maiores sequências especiais que incluem os cartões 5 ou 7 têm apenas um desses cartões, posicionado em uma das pontas da sequência. Logo, é impossível formar uma sequência especial usando todos os nove cartões; as maiores sequências especiais possíveis têm oito cartões, como a do item (b).$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=1
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q2
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Aplicando a primeira regra para n = 33: 33 e 33 + 5 = 38 devem ter a mesma cor. Aplicando novamente a regra, sucessivamente: 28 e 28 + 5 = 33 têm a mesma cor; 23 e 23 + 5 = 28; 18 e 18 + 5 = 23; 13 e 13 + 5 = 18; 8 e 8 + 5 = 13; 3 e 3 + 5 = 8. Encadeando essas igualdades, concluímos que os inteiros 3, 8, 13, 18, 23, 28, 33 e 38 devem todos ter a mesma cor. Logo, se Zequinha colorir o 38 de branco, a cor do 3 também deve ser branca.

b) Pela segunda regra, se a e b são inteiros e n = ab é branco, então pelo menos um dos fatores a ou b deve ser branco. No caso a = b = 2 e n = ab = 2 · 2 = 4: se 4 for branco, então pelo menos um dos dois fatores — ambos iguais a 2 — deve ser branco, ou seja, o próprio 2 deve ser branco. De modo geral, a segunda regra aplicada a quadrados perfeitos n = a² diz que, se n for branco, então a também deve ser branco.

c) Se o 1 for branco, então, pela primeira regra, os inteiros 1, 1 + 5 = 6, 6 + 5 = 11 e 11 + 5 = 16 devem ter a mesma cor branca. Por outro lado, pela segunda regra aplicada ao quadrado perfeito 16 = 4², se 16 for branco então 4 deve ser branco. Logo, se o 1 for branco, o 16 e, consequentemente, o 4 também serão brancos.

d) Vamos mostrar que as regras de pintura não permitem que o 2 e o 3 tenham cores diferentes, examinando as duas possibilidades:

— Caso em que 2 é preto e 3 é branco: como 3 é branco, pela primeira regra, 8 = 3 + 5 também é branco. Como 8 = 2 × 4 e 2 é preto, pela segunda regra 4 deve ser branco (pois pelo menos um dos fatores precisa ser branco, e 2 não é). Sendo 4 = 2² branco, pela segunda regra 2 deve ser branco — o que contradiz a hipótese de que 2 é preto.

— Caso em que 2 é branco e 3 é preto: como 2 é branco, pela primeira regra, 12 = (2 + 5) + 5 também é branco. Como 12 = 3 × 4 e 3 é preto, pela segunda regra 4 deve ser branco. Sendo 4 branco, pela primeira regra, 9 = 4 + 5 também é branco. Sendo 9 = 3² branco, pela segunda regra 3 deve ser branco — o que contradiz a hipótese de que 3 é preto.

Como ambos os casos levam a uma contradição, o 2 e o 3 sempre devem ter a mesma cor.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=2
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q3
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Consideraremos a posição do carro como um ponto no segmento AB.

a) A distância ao quadrado do ponto x = 3 até o ponto C é, pelo Teorema de Pitágoras, igual a 1² + 1² = 2, enquanto a distância ao quadrado de x = 3 até o ponto D é 2² + 2² = 8. Como f(x) é o quadrado da distância à antena mais próxima, e 2 < 8, temos f(3) = 2.

b) As distâncias até as bases das antenas serão iguais em um ponto x entre os pontos em que cada antena está mais próxima. O quadrado da distância de x até C é 1 + (x − 2)² = 5 − 4x + x², e o quadrado da distância de x até D é 4 + (5 − x)² = 29 − 10x + x². Igualando as duas expressões: 5 − 4x + x² = 29 − 10x + x², ou seja, 6x = 24, logo x = 4 é o ponto em que as distâncias até as duas bases são iguais.

c) Para 0 ≤ x ≤ 4, o ponto está mais próximo de C, logo f(x) = 5 − 4x + x²; para 4 < x ≤ 6, o ponto está mais próximo de D, logo f(x) = 29 − 10x + x². O gráfico de f é formado por dois arcos de parábola que se encontram no ponto x = 4.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=3
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q4
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Primeira solução (sem considerar a possibilidade de uma pessoa apertar a tecla do térreo estando nele): as três pessoas que entram no elevador podem escolher seus andares (1, 2, 3 ou 4) de 4 × 4 × 4 = 64 modos.

a) O andar comum às três pessoas pode ser escolhido de 4 modos. Logo, a probabilidade de que todos se dirijam ao mesmo andar é 4/64 = 1/16.

b) Para que o elevador não pare no 1º andar, as três pessoas devem escolher um andar diferente do primeiro, o que pode ser feito de 3 × 3 × 3 = 27 modos. Logo, a probabilidade de que o elevador não pare no 1º andar é 27/64, e a probabilidade de que ele pare nesse andar é 1 − 27/64 = 37/64.

c) Os três andares consecutivos podem ser 1, 2 e 3 ou 2, 3 e 4 (duas possibilidades). Em cada caso, a primeira pessoa pode escolher seu andar de 3 modos, a segunda de 2 modos e a terceira de 1 modo. Logo, a probabilidade de que o elevador pare em três andares consecutivos é (2 × 3 × 2 × 1)/64 = 12/64 = 3/16.

Segunda solução (considerando o térreo como um andar igual aos demais, com a possibilidade de uma pessoa apertar a tecla do térreo mesmo estando nele): as três pessoas podem escolher seus andares (térreo, 1, 2, 3 ou 4) de 5 × 5 × 5 = 125 modos.

a) O andar comum às três pessoas pode ser escolhido de 5 modos. Logo, a probabilidade é 5/125 = 1/25.

b) Para que o elevador não pare no 1º andar, as três pessoas devem escolher um andar diferente do primeiro, o que pode ser feito de 4 × 4 × 4 = 64 modos. Logo, a probabilidade de que ele não pare nesse andar é 64/125, e a probabilidade de que pare é 1 − 64/125 = 61/125.

c) Os três andares consecutivos podem ser térreo/1/2, 1/2/3 ou 2/3/4 (três possibilidades). Em cada caso, a primeira pessoa pode escolher seu andar de 3 modos, a segunda de 2 modos e a terceira de 1 modo. Logo, a probabilidade é (3 × 3 × 2 × 1)/125 = 18/125.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=4
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q5
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Observamos, inicialmente, que a planificação da superfície de um cilindro circular reto é a reunião de dois círculos (as bases do cilindro) e um retângulo cuja medida de um dos lados é igual ao comprimento da circunferência da base.

a) A planificação da superfície lateral do cilindro é um retângulo cujos lados medem 15 cm (altura) e 12 cm (comprimento da circunferência da base). O adesivo triangular de catetos 15 cm e 10 cm cobre parte desse retângulo. A área descoberta corresponde à diferença entre a área do retângulo e a área do triângulo: 15 × 12 − (15 × 10)/2 = 180 − 75 = 105 cm². Alternativamente, a área descoberta é a de um trapézio cujas bases medem 2 cm e 12 cm e cuja altura mede 15 cm: ((2 + 12)/2) × 15 = 7 × 15 = 105 cm².

b) Como o adesivo será enrolado cinco vezes ao redor da lata, ele cobre uma faixa de largura 60 cm = 5 × 12 cm na planificação. Por semelhança de triângulos, os comprimentos das divisões verticais do adesivo, a cada volta, são iguais a 4/5, 3/5, 2/5 e 1/5 da altura da planificação, ou seja, 12 cm, 9 cm, 6 cm e 3 cm, respectivamente. Na primeira volta, o adesivo deixa descoberto apenas um triângulo retângulo cinza, de catetos 12 cm e 3 cm; nas quatro voltas seguintes, o adesivo é colado sobre a parte já adesivada na volta anterior. Portanto, a área não coberta pelo adesivo é (3 × 12)/2 = 18 cm².

Outra solução: o triângulo cinza de catetos x e 12 é semelhante ao triângulo de catetos (15 − x) e 48; logo, x/12 = (15 − x)/48, de onde x = 3 cm, e a área não coberta é (3 × 12)/2 = 18 cm².

c) O triângulo cujo cateto mede 90 cm dará 7 voltas e meia em torno da circunferência da base (90 = 7 × 12 + 6). Na primeira volta, apenas um pequeno triângulo cinza fica sem adesivo na superfície; após a segunda volta, apenas um paralelogramo (paralelogramo 1) fica com uma única camada de adesivo; após a terceira volta, apenas o paralelogramo 2 fica com duas camadas; após a quarta volta, apenas o paralelogramo 3 fica com três camadas — e é a área desse paralelogramo que devemos calcular.

Para determinar a altura y da interseção do adesivo com a vertical inicial após a primeira volta, usamos a semelhança 90/15 = 78/y, ou seja, y = 78/6 = 13. Daí, os paralelogramos sucessivos 1, 2 e 3 têm os lados verticais medindo 15 − 13 = 2 cm. Como a altura relativa a esses lados mede 12 cm, a área de cada um desses paralelogramos — em particular, a do paralelogramo 3 — é 12 × 2 = 24 cm².$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=5
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2023 Q6
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Sejam K, L, M e N os quatro quadradinhos que faltam pintar na última linha. A escolha das cores de K e L determina unicamente a cor de M, pois nas três primeiras colunas (juntas) deve haver uma quantidade ímpar de quadradinhos pretos. De modo semelhante, uma vez escolhidas as cores de L e M, a cor de N fica determinada, pois nas três últimas colunas (juntas) também deve haver uma quantidade ímpar de casas pretas. Há 4 possibilidades para as cores de K e L: (Branco,Branco), (Branco,Preto), (Preto,Branco) e (Preto,Preto). Para cada uma, M fica determinado: (K,L,M) = (B,B,P), (B,P,B), (P,B,B) ou (P,P,P). Em seguida, N também fica determinado: (K,L,M,N) = (B,B,P,P), (B,P,B,P), (P,B,B,B) ou (P,P,P,B). Logo, há 4 maneiras de completar a pintura.

Observação: outra forma de fazer essa contagem é escolher inicialmente as cores de L e M; assim, ficam determinadas as cores de K e N.

b) A mesma análise do item anterior pode ser feita para qualquer coloração das duas primeiras linhas. Há 2⁸ escolhas possíveis para as cores dos 8 quadradinhos dessas duas linhas, e, para cada uma delas, 2² escolhas possíveis para as cores de dois quadradinhos da última linha (que determinam os outros dois, como no item anterior). Portanto, há 2⁸ × 2² = 2¹⁰ = 1024 formas de pintar o tabuleiro 3 × 4.

c) Resposta: 2¹² maneiras. Podemos pintar as duas primeiras linhas do tabuleiro 4 × 4 de 2⁸ formas. Uma vez escolhidas as cores de dois quadradinhos da terceira linha, as cores dos outros dois ficam determinadas, como no item (a) — o que dá 2² formas adicionais para a terceira linha. Repetindo o mesmo procedimento para a última linha — escolhendo as cores de dois quadradinhos, com os outros dois determinados — obtemos outras 2² formas. No total, 2⁸ × 2² × 2² = 2¹² = 4096 formas de escolher livremente as cores de certos quadradinhos do tabuleiro, o que determina por completo as cores de todos os demais.

d) Pinte de qualquer forma as duas primeiras linhas e as duas primeiras colunas do tabuleiro 2023 × 2023. Isso pode ser feito de 2^(2×2023 + 2×2021) = 2^8088 formas. Uma vez feita essa escolha, a cor do terceiro quadradinho da terceira linha fica determinada, pois há uma única escolha possível, dependendo da paridade da quantidade de quadradinhos pretos já pintados no quadrado 3 × 3 do canto superior esquerdo. Deslocando esse quadrado 3 × 3 uma coluna para a direita, concluímos que o quarto quadradinho da terceira linha também fica determinado — e assim por diante, toda a terceira linha fica determinada. Como a segunda e a terceira linhas estão pintadas, e os dois primeiros quadradinhos da quarta linha também, pelo mesmo argumento toda a quarta linha fica determinada. Repetindo esse processo até a última linha, obtemos um tabuleiro que satisfaz as condições do enunciado. Portanto, há 2^8088 formas de pintar o tabuleiro 2023 × 2023.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2023 AND numero=6
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q1
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) O número de papéis na cesta sempre aumenta depois que Ana ou Pedro devolvem os pedaços que cortaram. Cada vez que Ana pega um pedaço da cesta, corta em 5 pedaços e devolve os pedaços cortados para a cesta, o total de papéis da cesta aumenta em 5 − 1 = 4. Cada vez que Pedro pega um pedaço da cesta, corta em 3 pedaços e devolve os pedaços cortados para a cesta, o total de papéis da cesta aumenta em 3 − 1 = 2. Logo, depois de Ana e Pedro pegarem um pedaço cada um e devolverem os pedaços cortados para a cesta, ela ficará com 3 + 4 + 2 = 9 papéis.

b) Há cinco maneiras diferentes de Ana e Pedro pegarem papéis da cesta a partir dos 3 pedaços iniciais para que, depois de devolverem os pedaços cortados, ela fique com 11 pedaços. Essas maneiras dependem da ordem em que Ana e Pedro pegam pedaços da cesta. São elas:

— Ana – Pedro – Pedro: 3 + 4 + 2 + 2 = 11

— Pedro – Ana – Pedro: 3 + 2 + 4 + 2 = 11

— Pedro – Pedro – Ana: 3 + 2 + 2 + 4 = 11

— Ana – Ana: 3 + 4 + 4 = 11

— Pedro – Pedro – Pedro – Pedro: 3 + 2 + 2 + 2 + 2 = 11

c) O número inicial de papéis na cesta é ímpar, e vai sempre aumentar de 2 ou de 4 pedaços. Como um ímpar mais um par sempre resulta em um número ímpar, o número de papéis na cesta sempre será ímpar, nunca será 2024.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=1
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q2
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Para se calcular a área do cartão, vamos calcular quanto mede seu lado. A medida desse lado é o comprimento da linha mais grossa da figura, formada por duas diagonais do octógono e um lado do octógono. Em um octógono regular, a medida de cada um dos ângulos internos é 135°. Consequentemente, os ângulos internos do trapézio isósceles AHCB medem 135° e 45°. Os dois trapézios isósceles da figura têm em comum um triângulo retângulo isósceles. A hipotenusa desse triângulo é o lado AH do octógono (que mede 1 cm) e seus catetos medem, pelo Teorema de Pitágoras, √2/2 cm. As diagonais do octógono medem, portanto, (1 + √2) cm. Elas decompõem o octógono em quatro triângulos retângulos isósceles congruentes, quatro retângulos congruentes e um quadrado central.

O lado do cartão mede o mesmo que duas diagonais do octógono mais a medida do lado do octógono, ou seja, 2(1 + √2) + 1 = (3 + 2√2) cm, e sua área é (3 + 2√2)² = (17 + 12√2) cm².

b) A área da região cinza em cada canto do cartão pode ser dividida em dois triângulos retângulos isósceles. São quatro triângulos maiores, cujos catetos medem (1 + √2) cm (medem o mesmo que uma das diagonais do octógono vistas acima), e quatro triângulos menores, com catetos medindo 1 cm. Cada par desses triângulos de mesmo tamanho corresponde a um quadrado. Juntando a área do quadrado central à soma das áreas dos triângulos, a área da região cinza é 2 × (1 + √2)²/2 + 2 × 1²/2 + 1 × 1 = (9 + 4√2) cm².

c) A área da parte vermelha pintada sobre os octógonos é igual à soma das áreas da parte vermelha pintada sobre cada octógono.

No octógono superior, a área pintada em vermelho é formada por um retângulo de lados 1 e (1 + √2) e por dois triângulos retângulos, cada um deles de catetos √2/2 e (1 + √2/2); a área do retângulo é igual a (1 + √2) e a área de cada triângulo retângulo é igual a [√2/2 × (1 + √2/2)] / 2 = (1 + √2)/4; logo a área vermelha pintada dentro do octógono superior é igual a (1 + √2) + 2 × (1 + √2)/4 = 3/2 + 3√2/2.

Nos octógonos da esquerda e da direita, a área pintada em vermelho é formada por um triângulo retângulo de catetos 1 e (1 + √2) e um trapézio de bases (1 + √2), 1 e altura √2/2; a área do triângulo retângulo é igual a (1 + √2)/2 e a área do trapézio é igual a [(2 + √2) × (√2/2)] / 2 = (1 + √2)/2; logo a área vermelha pintada dentro de cada um desses octógonos é igual a 1 + √2.

No octógono inferior, a área pintada em vermelho é formada por um trapézio de bases (1 + √2), 1 e altura √2/2; a área desse trapézio é igual a [(2 + √2) × (√2/2)] / 2 = (1 + √2)/2.

Somando todas as áreas, concluímos que a área total da região pintada em vermelho sobre os octógonos é igual a (3/2 + 3√2/2) + 2 × (1 + √2) + (1 + √2)/2 = (4 + 4√2) cm².

Outra solução: podemos calcular a área da região em vermelho subtraindo da área do trapézio determinado pelo seu contorno a soma das áreas do quadrado central com a área do quadrado de lado √2/2 formado pelos dois triângulos pequenos. As bases do trapézio medem 1 e (3 + √2) e sua altura (2 + 3√2/2); logo, sua área é igual a (2 + √2/2)(2 + 3√2/2) = 4 + 4√2 + 3/2. Por outro lado, a soma das áreas dos dois quadrados é igual a 1 + 1/2 = 3/2. Portanto, a área da região em vermelho é igual a (4 + 4√2) cm².$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=2
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q3
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Se x = 1, então o ponto P coincide com o vértice C do hexágono. A região com vértices em A, P e outros vértices do hexágono pelos quais o ponto P passou é o triângulo ABC. No hexágono regular de lado 1, O é o centro e BC um dos lados. Assim, o triângulo com vértices em O, B e C é equilátero e sua área é igual a 1² · √3/4 = √3/4. O triângulo OBC tem a mesma área que o triângulo ABC, pois M é o ponto médio de OB, logo os triângulos OMP, BMP e BMA são congruentes (caso LLL de congruência). Assim, a área da região escura é igual a √3/4, ou seja, f(1) = √3/4.

b) Quando P se desloca sobre o lado DE, ele já passou pelos lados BC e CD. Logo DP = x − 2. A área do polígono ABCDP é igual a 3 vezes a área do triângulo OBC mais a área do triângulo ADP. A altura desse triângulo relativa à base DP é EA = AC = 2 × √3/2 = √3, e a área do triângulo ADP é igual a (x − 2)√3/2 = (√3/2)x − √3. Assim, f(x) = (√3/2)x − √3 + 3√3/4 = (√3/2)x − √3/4.

c) Olhando o percurso do ponto P de B até F, podemos calcular imediatamente f(1) = √3/4, f(2) = 3√3/4, f(3) = 5√3/4 e f(4) = 3√3/2. No interior dos intervalos [0,1], [1,2], [2,3] e [3,4], quando P se desloca, a área do triângulo com vértices P, A e o vértice Y anterior do hexágono pelo qual P passou varia linearmente com a distância PY (base do triângulo), já que a altura desses triângulos em cada intervalo é constante. Portanto, o gráfico da função f no intervalo [0,4] é composto de segmentos de reta com extremidades nos pontos (x, f(x)) identificados acima.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=3
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q4
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Como cada câmera pode vigiar no máximo 4 muros, o máximo que duas câmeras podem vigiar são 8 muros. A figura ilustra um exemplo em que esse máximo ocorre.

b) Uma câmera na fronteira vigia exatamente 2 muros dessa região. Como apenas câmeras na fronteira podem vigiar os muros dessa região e existem exatamente 12 muros nela, o mínimo de câmeras necessárias é 12/2 = 6. A figura ilustra um exemplo com essa quantidade de câmeras.

c) Uma câmera posicionada no interior não pode vigiar nenhum muro da fronteira; portanto, pelo item anterior, precisamos de pelo menos 6 câmeras nessa região para vigiar seus 12 muros. Nenhuma das câmeras posicionadas na fronteira pode vigiar os 4 muros do quadrado central e, como qualquer câmera só pode vigiar 2 deles, precisamos de pelo menos 2 câmeras para vigiar esses 4 muros. Assim, precisamos de pelo menos 6 + 2 = 8 câmeras para vigiar os muros. A figura mostra que é possível vigiar todos eles com essa quantidade, garantindo assim que esse número é o mínimo.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=4
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q5
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Na pilha de três dados da figura, ao dar uma volta em torno da mesa, Marina consegue ver seis pares de faces opostas mais a face do topo, com o número 6. Cada par de faces opostas totaliza 7, portanto, ela anota o número 48, já que 6 × 7 + 6 = 48.

b) Nesta nova figura, com dois dados unidos pelas laterais, ao dar uma volta em torno da mesa, Marina consegue ver seis faces: dois pares de faces opostas, que totalizam 14 pontos, mais quatro faces (duas em cada dado). Para que a soma total seja mínima, essas quatro faces devem ter os números 1 ou 2, sendo 1 e 2 em um dado e 1 e 2 em outro. Desta forma, o menor número possível que Marina pode anotar é 14 + 2 × 1 + 2 × 2 = 20. Como curiosidade, observe que os pares de faces opostas que Marina consegue ver nos dados devem ter os números 3 e 4.

c) Marina consegue ver sete pares de faces opostas da nova pilha, que totalizam 7 × 7 = 49. Logo, as demais sete faces visíveis por ela devem totalizar 88 − 49 = 39. Observe que 39 = 4 × 6 + 3 × 5; logo, deve haver ao menos quatro dessas faces com o número 6 para que seja possível obter a soma 39 (se houvesse menos, nunca chegaríamos a 39 com sete parcelas). Vamos concentrar nossa atenção nas sete faces que Marina consegue ver, mas não consegue ver a face oposta. Há três casos a considerar:

— Não é possível que seis dessas sete faces tenham o número 6 (embora 39 = 6 × 6 + 3). Se isso ocorresse, um dos dados mais à direita teria duas faces com o número 6.

— Configurações nas quais quatro dessas sete faces apresentam o número 6 e três faces apresentam o número 5 são possíveis para a pilha em questão (usando a decomposição 39 = 4 × 6 + 3 × 5).

— Além disso, observe também que 39 = 5 × 6 + 5 + 4. Nesse último caso, cinco das sete faces em consideração receberiam o número 6, uma face o número 5 e uma face o número 4. Isso também é possível.

Portanto, 5 e 6 são os únicos números que podem aparecer no topo da pilha.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=5
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2024 Q6
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Vamos chamar de formiga A a formiga que parte de A e de formiga B a que parte de B. Para que a formiga A passe pelo lado indicado, ela deve fazer um dos dois caminhos possíveis. Em cada um desses caminhos, ela tem que fazer 3 escolhas de direções. Logo, cada um desses caminhos tem probabilidade (1/2)³ = 1/8. Portanto, a probabilidade de que ela passe pelo lado indicado é 1/8 + 1/8 = 1/4.

b) Cada formiga percorre 6 segmentos em seu percurso. Como a velocidade de B é 2/3 da velocidade de A, enquanto a formiga A percorre uma distância x, a outra percorre (2/3)x. Quando elas se encontram, a soma das distâncias percorridas deve ser igual aos 6 segmentos que as separam, ou seja, x + (2/3)x = 6. Daí, obtemos x = 18/5 = 3,6. Logo, ao se encontrar, a formiga A percorreu 3,6 segmentos e a formiga B, 2,4 segmentos. Portanto, os segmentos em que elas podem se encontrar são os que correspondem ao 4º segmento em um caminho percorrido pela formiga A e ao 3º segmento em um caminho percorrido pela formiga B. Esses segmentos estão assinalados na figura.

c) Vamos calcular a probabilidade de que as formigas se encontrem em cada um dos segmentos assinalados (somaremos tudo no final). Para isso, basta calcular a probabilidade de que cada formiga percorra esse segmento e multiplicar os resultados.

Para que elas se encontrem no segmento indicado, A e B precisam percorrer os caminhos indicados em azul e verde, respectivamente. Como cada formiga faz 3 escolhas de direção, a probabilidade de que cada uma delas percorra esses caminhos é igual a (1/2)³ = 1/8. Logo, a probabilidade de que ambas percorram o segmento indicado é (1/8) × (1/8) = 1/64.

Para que elas se encontrem no próximo segmento indicado, A tem 3 possibilidades de caminho, ao longo dos quais ela faz 4 escolhas de direção. Logo, a probabilidade de que ela percorra cada um desses caminhos é (1/2)⁴ = 1/16, e a probabilidade de que ela passe pelo segmento indicado é 3 × 1/16 = 3/16. Já a formiga B precisa percorrer o caminho indicado em verde, ao longo do qual ela faz 3 escolhas de direção. Logo, a probabilidade de que B passe pelo segmento indicado é (1/2)³ = 1/8. Portanto, a probabilidade de que as formigas se encontrem nesse segmento é (3/16) × (1/8) = 3/128.

A probabilidade de que A passe pelo segmento seguinte é a mesma de passar pelo segmento anterior, ou seja, igual a 3/16 (3 caminhos possíveis, com probabilidade 1/16 cada). Já a formiga B precisa percorrer um dos dois caminhos indicados em verde, ao longo dos quais ela faz 3 escolhas de direção. Logo, a probabilidade de que B passe por esse segmento é (1/2)³ + (1/2)³ = 1/4, e a probabilidade de que elas se encontrem sobre esse segmento é (3/16) × (1/4) = 3/64.

Por simetria, a probabilidade de encontro nos outros três segmentos é igual à calculada acima para o segmento respectivamente simétrico em relação à diagonal AB. Logo, a probabilidade de que as formigas se encontrem é 2 × (1/64 + 3/128 + 3/64) = 11/64.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2024 AND numero=6
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q1
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Observe que cada vez que descemos uma casa, o número escrito aumenta 20. Toda vez que vamos uma casa para a esquerda, o número escrito diminui em 1. Portanto, x = 17 + 20 + 20 – 1 – 1 = 55.

b) Temos que z = y + 20 + 1 = y + 21 e que w = y + 20 + 20 – 1 – 1 – 1 – 1 – 1 = y + 35. Se d é divisor de y, y + 21 e y + 35, então d é divisor de 21 e de 35. Como mdc(21,35) = 7, d é divisor de 7. Sabendo que d é maior do que 1, concluímos que d = 7.

c) Como y está na primeira linha, os únicos múltiplos de 7 que estão entre 1 e 20 são 7 e 14. Note que temos os seguintes valores para as triplas de letras (y,z,w) = (7, 28, 42) ou (y,z,w) = (14, 35, 49).$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=1
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q2
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Uma possível cobertura está ilustrada na figura.

b) Há duas possíveis coberturas, ilustradas na figura.

c) Observe que qualquer peça colocada no tabuleiro ocupa pelo menos uma das quatro casas marcadas com a imagem da OBMEP. Porém, devemos tentar colocar cinco peças. Mas quatro peças já cobrem as quatro casas marcadas e, assim, não é possível usar cinco peças. De fato, vejamos com mais detalhe por que isso ocorre: se uma peça cobrir a casa superior direita, ela também cobrirá pelo menos uma casa com o logo da OBMEP (nesse caso, a casa marcada em vermelho). Isso acontecerá com qualquer outra casa do tabuleiro, ou seja, uma peça colocada sempre cobrirá ao menos uma casa com o logo da OBMEP. Por exemplo, observe que para cobrir a segunda casa da primeira linha, independentemente de como colocarmos a peça cinza, sempre uma casa com o logo da OBMEP será também coberta por ela. Para as demais casas, o mesmo argumento se aplica.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=2
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q3
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Para esse problema é muito útil expressar a área de um triângulo equilátero como função do comprimento de seu lado a, que é dada por a²√3/4, e em função da altura h, que é h²√3/3. Note que, pelo teorema de Pitágoras, a = 2h√3/3.

a) Para x = 3, a superposição dos dois triângulos consiste em dois triângulos equiláteros de altura h = 3/2. Assim, a área é dada por A(3) = 2(3/2)²√3/3 = 3√3/2.

Para x = 9, a superposição dos dois triângulos é uma figura hexagonal. Podemos calcular a área desse hexágono subtraindo da área de um dos triângulos originais as áreas de 3 triângulos equiláteros brancos, como indicado na figura: o triângulo original tem área 12√3, pois tem altura 6. O triângulo branco superior tem área 3√3, pois tem altura 3. Cada um dos triângulos brancos inferiores tem área 3√3/4, pois sua altura é 3/2. Logo, a área do hexágono é A(9) = 12√3 − 3√3 − 2 × (3√3/4) = 15√3/2.

b) Para 0 ≤ x ≤ 6, a região comum é formada por dois triângulos equiláteros de altura x/2. Assim, temos A(x) = 2(x/2)²√3/3 = x²√3/6.

Se a distância entre C e P for maior que 6, a região comum passa a ser hexagonal. Uma maneira simples de calcular essa área é subtrair a área do triângulo equilátero superior e dos dois triângulos equiláteros laterais da área total. Por partes:

1. Área total do triângulo ABC: (4√3)²√3/4 = 12√3;

2. Para a área do triângulo equilátero superior é conveniente calcular a sua altura. Como a distância entre C e P é x e a altura do triângulo equilátero PQR é 6, a altura do triângulo equilátero superior é x − 6, e seu lado é 2(x − 6)√3/3. Sua área é, portanto, (x − 6)²√3/3;

3. Como o lado do triângulo equilátero superior é 2(x − 6)√3/3, o lado de cada um dos triângulos equiláteros laterais é (4√3 − 2(x − 6)√3/3) / 2 = (12 − x)√3/3. Assim, a área de cada um desses triângulos equiláteros das laterais é (12 − x)²√3/12.

A função que fornece a área da região comum para 6 ≤ x ≤ 12 é, portanto, A(x) = 12√3 − (x − 6)²√3/3 − 2(12 − x)²√3/12 = (√3/2)(−x² + 16x − 48).

c) O valor máximo de A(x) no intervalo 0 ≤ x ≤ 12 ocorre em x = 8 e é igual a 8√3.

d) O gráfico da função A no intervalo 0 ≤ x ≤ 12 tem o aspecto mostrado na figura.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=3
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q4
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Basta organizarmos uma lista de acordo com a posição do primeiro acerto e, em seguida, com as demais possibilidades do segundo acerto: [11000], [10100], [10010], [10001], [01100], [01010], [01001], [00110], [00101] e [00011]. São 10 possibilidades. Uma outra maneira de se obter isso é ver que a quantidade de listas corresponde ao número de escolhas de 2 posições dentre 5, que é C(5,2) = 10.

b) Para cada questão, temos 2 maneiras de registrar o resultado no boletim, e isso nos dá um total de 2⁵ = 32 boletins distintos. Como 33 é maior que a quantidade total de boletins distintos, pelo menos dois alunos terão o mesmo boletim (Princípio das Casas de Pombos).

c) Como a prova tem apenas 5 questões, essas 81 respostas corretas podem ser classificadas em 5 tipos. Dado que 81/5 > 16, pelo menos uma questão foi resolvida corretamente por 17 pessoas. Observemos os boletins dessas 17 pessoas nas outras 4 questões. Como temos apenas 2⁴ = 16 formas de preencher o restante do boletim e 17 > 16, pelo menos duas delas terão exatamente as mesmas respostas nas demais questões.

Outra solução: vamos analisar o total de boletins com cada quantidade de acertos. Há uma única sequência com 0 acertos; há 5 sequências distintas com 1 acerto; há 10 sequências distintas com 2 acertos; há 10 sequências distintas com 3 acertos; há 5 sequências distintas com 4 acertos; há uma única sequência com 5 acertos. Portanto, se utilizarmos apenas sequências distintas, o número máximo de acertos seria 1×0 + 5×1 + 10×2 + 10×3 + 5×4 + 1×5 = 80. Como 81 questões foram acertadas, obrigatoriamente alguma sequência de zeros e uns foi repetida.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=4
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q5
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$a) Para que nenhum cartão seja pintado de preto, é preciso que o cartão escolhido ao acaso seja o mais à direita. A probabilidade de ele ser escolhido é 1/11.

b) 1ª solução: o cartão a ser removido pode ser escolhido de 11 modos, e o cartão sorteado, de 10 modos. Logo, há 11 × 10 = 110 casos possíveis. Se o cartão removido é o mais à direita, não há casos favoráveis, porque nenhum cartão foi pintado de preto. Se o cartão removido é o segundo mais à direita, há 1 caso favorável; se for o terceiro, há dois casos favoráveis; e assim por diante, até chegar ao décimo-primeiro cartão. Logo, o número de casos favoráveis é 1 + 2 + 3 + ... + 10 = 55. Portanto, a probabilidade de que o primeiro cartão sorteado seja preto é 55/110 = 1/2.

2ª solução: suponhamos que os cartões sobre a mesa sejam numerados de 1 a 11. Escolher um cartão para jogar fora e depois sortear um dos restantes equivale a escolher ao acaso dois números de 1 a 11. O cartão sorteado é preto se, e somente se, o segundo número sorteado é maior do que o primeiro, o que ocorre com probabilidade 1/2.

3ª solução: a probabilidade de que um dado cartão da configuração original seja pintado de preto é igual à probabilidade de que seu simétrico seja pintado de branco. Devido a essa simetria, as probabilidades de sortear um cartão branco ou um cartão preto são iguais, ou seja, iguais a 1/2.

c) 1ª solução: o cartão a ser removido pode ser escolhido de 11 modos, e os cartões sorteados, de 10 e 9 modos, respectivamente. Logo, há 11 × 10 × 9 = 990 casos possíveis. Se o cartão removido é o mais à direita, não há casos favoráveis, porque nenhum cartão foi pintado de preto. Se o cartão removido é o segundo mais à direita, também não há casos favoráveis, já que só há um cartão preto; se for o terceiro, há dois cartões pretos e, assim, 2 × 1 casos favoráveis; se for o quarto, há três cartões pretos e, assim, 3 × 2 casos favoráveis; e assim por diante, até chegar ao décimo-primeiro cartão. Logo, o número de casos favoráveis é 2×1 + 3×2 + ... + 10×9 = 330. Portanto, a probabilidade de que os dois cartões sorteados sejam pretos é 330/990 = 1/3.

2ª solução: suponhamos que os cartões sobre a mesa sejam numerados de 1 a 11. Escolher um cartão para jogar fora e depois sortear dois dos restantes equivale a escolher ao acaso três números de 1 a 11. O cartão sorteado é preto se, e somente se, o primeiro número sorteado é o menor dos três. Como todas as ordenações desses três números são igualmente prováveis, a probabilidade de que o menor seja o primeiro sorteado é igual a 1/3.

Comentário: a resposta não é 1/2 × 1/2 = 1/4. Embora sejam iguais as probabilidades de retirar um cartão branco ou preto em cada extração, esses eventos não são independentes.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=5
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;

-- 2025 Q6
INSERT INTO solucao (questao_id, texto)
SELECT id, $s$Antes das perguntas, Rafael e Gabriel obviamente sabem seus números (cada um sabe o seu e vão tentar descobrir qual é o número do outro) e sabem também que 60 pode ser a soma ou o produto deles. Para que cada um saiba o número do outro, basta saber se 60 é a soma ou o produto dos números: se for a soma, basta subtrair de 60 o seu número; se for o produto, basta dividir 60 pelo seu número.

a) O número de Rafael é um divisor de 60 porque, se não fosse, ele saberia que 60 era a soma dos números. Logo, ele saberia o número de Gabriel, e iria responder SIM à primeira pergunta de Michel.

b) Pela resposta de Rafael à primeira pergunta, Gabriel sabe que o número de Rafael é um divisor de 60. Se o seu número fosse 15, então ele saberia que 60 era o produto dos números, já que 60 − 15 = 45 não é divisor de 60. Logo, ele saberia o número de Rafael, e iria responder SIM à pergunta de Michel.

c) Na segunda pergunta, Gabriel respondeu que ainda não tinha informação suficiente para saber o número de Rafael porque, apesar de saber, após a primeira pergunta, que o número de Rafael é um divisor de 60, o seu número não permitia saber se 60 era a soma ou era o produto dos números. Logo, o número de Gabriel também deve ser um divisor de 60, pois, se não fosse, ele saberia que 60 era a soma dos números. Além disso, os números de Rafael e Gabriel são divisores de 60 (pertencem ao conjunto {1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60}) que, multiplicados ou somados, resultam em 60. As únicas possibilidades são: (i) ambos com o número 30; (ii) um com o número 2 e outro com o número 30. Rafael observou que o número 30 é comum às expressões 60 = 30 + 30 e 60 = 30 × 2; isso permitiu a ele concluir que o número de Gabriel é 30.

Outra variação da solução:

a) Seja r o número do cartão de Rafael e g o número de Gabriel. Se r não fosse um divisor de 60, então a resposta de Rafael à primeira pergunta seria "sim". De fato, nesse caso 60 = g·r não seria possível; logo 60 = g + r, e Rafael poderia calcular g = 60 − r. Como a resposta de Rafael à primeira pergunta foi "não", segue que r é um divisor de 60.

b) Da mesma maneira, g também é um divisor de 60. Se g fosse igual a 15, não poderia ocorrer o caso da soma dos números dos cartões, isto é, não seria possível g + r = 60. De fato, se isso ocorresse, r seria igual a 45, mas 45 não é divisor de 60. Logo, ocorre somente o caso r·g = 60 com g = 15, ou seja, r = 60/15 = 4 — Gabriel saberia o número de Rafael, não ficaria em dúvida.

c) Antes da conclusão, Gabriel pode fazer uma lista dos inteiros da forma g + d e outra dos inteiros da forma g·d, em que d percorre todos os divisores de 60. Se 60 aparecesse em apenas uma dessas listas, a resposta de Gabriel à segunda pergunta seria "sim", pois ele poderia calcular r = 60 − g, caso 60 aparecesse na primeira lista, e r = 60/g, caso 60 aparecesse na segunda. Dessa maneira, ele só pode ter respondido "não" porque viu que 60 aparece nas duas listas. Por inspeção, isso ocorre apenas para 60 = 30 + 30 = 30 × 2; com a informação que Gabriel tem, nesse momento ele não consegue decidir entre os possíveis valores r = 30 ou r = 2. Rafael fez o mesmo raciocínio e observou que o número 30 é comum às expressões 60 = 30 + 30 e 60 = 30 × 2; isso permitiu a ele concluir que g = 30.$s$
FROM questao WHERE olimpiada='obmep' AND nivel='nivel_3' AND fase=2 AND ano=2025 AND numero=6
ON CONFLICT ON CONSTRAINT solucao_unique DO NOTHING;
