# Acompanhamento pedagógico — visualização e análise de desempenho

Data: 16/10/2026. Benchmark: repositório local `intensivo-enem`.
Escopo confirmado pelo solicitante: somente visualização e análise para a equipe
pedagógica; sem alterar login, área do aluno, coleta de dados ou regras de acesso.

## Problema e resultado esperado

O painel acadêmico mostra somente os vinte mais ativos por marca, exclui alunos
sem login e combina frequência recente com resultados acumulados. A gestão ainda
chama contagens de autenticação de frequência e presume presença a partir de um
login recente. Professores e coordenadores precisam enxergar o conjunto dos alunos,
identificar falta de participação e dificuldades, e escolher onde intervir.

## Escopo desta entrega

- Substituir o ranking limitado por acompanhamento de todos os alunos ativos,
  com filtros de marca, unidade, série, período, nome e situação; paginação na tela.
- Exibir cobertura de estudo, dias de prática, volume, correção com denominador,
  contexto (treino, aula e simulado), tendência diária e tópicos para revisão.
- Destacar ausência de acesso, acesso sem estudo, necessidade de retomada e
  dificuldade com base mínima de cinco respostas corrigidas.
- Manter premiações como histórico, identificado separadamente do período.
- Paginar as consultas e tratar falha como indisponibilidade, sem transformar
  erros em turmas sem alunos ou resultados iguais a zero.
- Reutilizar o tema, componentes e dependências já instalados. Não adicionar serviço.

## Contrato das métricas

- Períodos de 7, 30 ou 90 dias-calendário, incluindo hoje, em São Paulo;
  eventos futuros/invalidáveis são ignorados. Totais do desempenho usam esse período.
- Dias de prática: dias distintos com respostas. Progresso em aula participa
  da última evidência de estudo e dos ativos, mas seu registro mutável não permite
  reconstituir cada visita histórica; não inventar dias nem minutos assistidos.
- Tentativas: todas as respostas no período. Taxa de acerto: última resposta
  por aluno, questão, contexto e aula no período. Repetições contam no volume,
  não repetidamente no denominador de desempenho.
- Respostas abertas sem feedback de correção ficam pendentes, fora da taxa de
  acerto; ausência de dados é "Sem respostas corrigidas", nunca 0% de desempenho.
- Percentual de grupo = soma dos acertos / soma das respostas corrigidas.
- Retomar: última evidência anterior aos sete dias-calendário mais recentes.
  Apoio pedagógico: menos de 50% em ao menos cinco respostas corrigidas no período.
- Login é autenticação. Não afirmar presença online, visitas, sessões ou tempo
  de estudo com base em `login_count`, `last_login_at` ou duração cadastrada de aula.
- Premiações são acumuladas e não entram nas métricas do período.

## Arquitetura e acesso

Server Component → autorização → consultas paginadas → agregador puro → painel
renderizado no servidor. Somente o filtro da URL define o recorte visual; nunca
concede autorização. Manter o gate `aluno:read` e o escopo de leitura vigente da
página. Filtros apenas recortam os dados já disponíveis; não alterar a matriz de
permissões ou a arquitetura de autenticação nesta entrega.

Base: padrões locais de dashboard e do Intensivo (`gestao-desempenho.ts`,
`acessos.ts`, `paginacao.ts`). A biblioteca externa `~/Codex/assets/design-library`
não está disponível nesta máquina; usar tokens e componentes do próprio projeto.

## Plano e critérios de aceite

1. Registrar benchmark e definições. Revisar casos adversos antes de implementar:
   sessão persistente, aluno sem login, aula sem histórico diário, respostas
   repetidas, aberta não corrigida, marcas sem vínculo, falha em página de dados.
2. Implementar consulta, agregação e painel; preservar premiações e autorização.
3. Conferir clareza dos indicadores e das explicações no próprio painel.
4. Verificar cálculos, fuso, paginação além de mil registros, recortes e acesso
   com testes; executar typecheck, lint e suíte. Conferir desktop e celular no
   navegador, com dados de teste claramente identificados fora da aplicação.

Aceite: toda a coorte aparece; filtros e navegação funcionam; cada percentual tem
base; zero, ausência e pendência são distinguíveis; falhas não geram números
plausíveis; nenhuma alteração de login, coleta, banco ou produção.

## Continuidade

Sessões de uso, primeiro acesso guiado para completar vínculos, presença por
encontro e histórico imutável de aulas exigem desenho e implantação próprios.
O benchmark já possui sessão de uso com intervalo de trinta minutos; a Olímpica
usa cookie próprio do aluno, portanto sua RPC baseada em `auth.uid()` não pode ser
copiada diretamente. Esta entrega não depende de nova migration.

Rollback: reverter os arquivos desta entrega; não há mudança de banco ou provedor.
