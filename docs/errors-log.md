# Registro de correções

## 2026-09-16 — Retirada da lista de questões das aulas

- **Sintoma:** a “Lista de questões” continuava aparecendo abaixo do vídeo na
  página do projeto. A correção anterior tratou apenas do player; o usuário
  esclareceu que a retirada desejada era desse bloco de exercícios.
- **Correção:** retirar a lista e seu contador nas aulas do projeto e também a
  seção equivalente na página individual de aula. Essas páginas deixam de buscar
  questões e alternativas e de carregar o componente de treino.
- **Validação:** suíte com 244 testes aprovados, 3 ignorados e 14 pendentes,
  concluída com exit 0. Lint em `app`, `components`, `lib` e `tests` sem erros,
  com apenas um aviso anterior em `treino-client.tsx`. A busca nas páginas de aula
  e projeto confirmou a retirada das referências à lista, ao treino e às
  consultas de questões e alternativas. Prettier e `git diff --check` aprovados.
- **Escopo:** apresentação das aulas no portal do aluno. Vídeos e materiais de
  apoio continuam disponíveis. Não há exclusão de dados; o banco de questões, o
  menu avulso e a área própria de simulados mantêm seus fluxos.

## 2026-09-16 — Vídeos do Drive abriam fora da aula

- **Sintoma:** aulas gravadas com link `drive.google.com/file/d/.../view` exibiam
  “Esta aula acontece em uma plataforma externa” e “Entrar na aula”.
- **Causa:** `AulaPlayer` reconhecia apenas YouTube. O CSP também não autorizava
  frames de `drive.google.com`.
- **Correção:** converter links de arquivo do Drive para `/preview`, preservando
  `resourcekey`, e liberar somente a origem necessária no `frame-src`. O projeto
  informa a modalidade ao player para diferenciar a aula ao vivo da gravação.
- **Validação:** 26 testes de regressão do player; suíte com 244 testes aprovados,
  3 ignorados e 14 pendentes; typecheck e build com Webpack aprovados; lint dos
  arquivos alterados aprovado. Smoke em Chrome isolado carregou o arquivo real
  `OBMEP_F2_N1_Q01.mp4` no iframe, sem erro de CSP, em desktop e largura móvel.
  O início efetivo da reprodução não foi confirmado pela automação.
- **Limitação anterior:** lint geral aponta quatro usos de `any` em
  `app/aluno/(area)/aula/[id]/page.tsx` (linhas 93–95 e 193), reproduzidos no commit
  base. Há também um aviso anterior em `treino-client.tsx`.
- **Questões:** o módulo segue implementado na gestão, navegação do aluno e
  exercícios das aulas. O histórico contém a renomeação do menu, sem evidência
  de remoção completa. Nenhuma retirada foi incluída nesta correção.

Alguns arquivos compartilhados exigem a chave do link original; por isso o player
preserva esse parâmetro. [Referência do Google Drive](https://developers.google.com/workspace/drive/api/guides/resource-keys).
