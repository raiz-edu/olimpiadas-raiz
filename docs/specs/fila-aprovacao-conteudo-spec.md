# SPEC — Fila de Aprovação de Conteúdo

**Data:** 2026-06-30 · **Autor:** Helio Barbosa · **Status:** Implementado

## Objetivo

Proteger o conteúdo da plataforma do aluno: o **Gestor de Conteúdo** pode criar e
editar questões, simulados e projetos, mas a **publicação é exclusiva do `raiz`**.
Conteúdo criado/editado por não-raiz fica em fila de aprovação e só chega ao aluno
após o raiz aprovar.

## Modelo de estados por tipo

| Tipo     | Tabela                              | Campo de publicação      | Estado pendente      | Estado publicado |
| -------- | ----------------------------------- | ------------------------ | -------------------- | ---------------- |
| Questão  | `questao`                           | `status_cadastro` (text) | `aguardando_revisao` | `publicado`      |
| Simulado | `preparacao_aula` (tipo=`simulado`) | `publicada` (bool)       | `false`              | `true`           |
| Projeto  | `preparacao_projeto`                | `publicado` (bool)       | `false`              | `true`           |
| Aula     | `preparacao_aula`                   | `publicada` (bool)       | `false`              | `true`           |

## Regras

1. **Criar (não-raiz):** entra pendente. `criarQuestao` e `criarQuestaoParaAula` →
   `aguardando_revisao`; `criarSimulado` → `publicada=false`; projeto/aula nascem
   despublicados (default do banco).
2. **Criar (raiz):** pode publicar direto.
3. **Editar (não-raiz):** devolve para pendente — `atualizarQuestao` força
   `aguardando_revisao`; `atualizarSimulado` força `publicada=false`.
4. **Editar (raiz):** mantém o estado de publicação atual.
5. **Publicar/despublicar:** exclusivo do raiz —
   `aprovarQuestao`, `publicar/despublicarSimulado`,
   `publicar/despublicarProjeto`, `publicar/despublicarAula`.
6. **Visibilidade do aluno:** treino exibe apenas `status_cadastro='publicado'`
   (além de `ativo=true`). Simulado/projeto já filtravam `publicada/publicado=true`.

## Decisões

- **Quem aprova:** apenas `raiz` (Helio/Hugo). Não delegado a `diretor_marca`.
- **Escopo:** questões, simulados e projetos.
- **Edição de publicado volta para pendente** (revisão obrigatória após mudança).

## UI

- Banco de questões: contador de pendentes, filtro por status, badge e botão
  **Aprovar** (só raiz) — já existia, agora alimentado pelo backend.
- Simulado/Projeto: controles de publicar visíveis só para raiz; não-raiz vê
  badge "Aguardando aprovação".

## Enforcement

Servidor (server actions) é a fronteira de segurança; a UI apenas esconde
controles. Toda checagem de publicação valida `session.user.role === "raiz"`.
