# Runbook — migração para AWS + Supabase da Raiz

**Data do diagnóstico:** 2026-08-28 · **Sintoma:** `/aluno/treino` sem imagens e preso em "Carregando alternativas…" · **Ambiente:** https://olimpiadas.raizeducacao.com.br

## 0. Atualização de 28/08 (tarde) — o alvo real é Aurora + S3 + Cognito

O que o repositório revelou depois do diagnóstico da manhã: a produção roda a branch **`aws`** (workflow "Deploy AWS", ECS Fargate), com **Aurora PostgreSQL** acessado por um **PostgREST** no mesmo task, **S3** servido por `/api/storage/<bucket>/<caminho>` e **Cognito** no lugar do Supabase Auth. Não existe projeto Supabase novo — a pergunta "qual é o `NEXT_PUBLIC_SUPABASE_URL`" não tem resposta porque a variável não existe lá.

Consequências para este runbook:

- **Alternativas vazias**: o Aurora foi criado pelas migrations do repositório (`infra/migration/bootstrap-aurora.mjs`) e o snapshot foi importado com `jsonb_populate_record`, que descarta colunas inexistentes. As colunas manuais (052) faltam e os valores de `imagem_largura` foram perdidos — a **056** os restaura a partir do backup.
- **Imagens**: os arquivos JÁ estão no S3 (`migrate-storage.mjs`); faltava reescrever as URLs no banco para `/api/storage/…` (**055**) e liberar o host do S3 no CSP, porque a rota responde com redirect para URL assinada e o CSP vale no destino (`next.config.ts`).
- **Como as migrations chegam ao Aurora**: pelo deploy da branch `aws` — o runner aplica, em ordem, todo arquivo de `supabase/migrations/` ainda não registrado em `migration.schema_migrations`. Logo, tudo que está em `master` precisa ser mergeado em `aws` (PR `merge/master-into-aws`).
- **Segredos**: `olimpiadas-raiz/prd/runtime` no Secrets Manager precisa ganhar `OPENAI_API_KEY` e `CREDENCIAIS_MASTER_KEY`; o workflow só injeta as chaves listadas em `aws-deploy.yml` (já incluídas no PR).
- **Auth**: Cognito. O Passo 2 abaixo (Supabase Auth) não se aplica; o cliente OAuth do Google usado em produção é o do Cognito.
- Os Passos 1, 3 e 4 abaixo descrevem o cenário "outro projeto Supabase" e ficam como referência histórica; os scripts `copiar-storage.mjs`/`02-reescrever-urls-storage.sql` não se aplicam ao S3/Aurora. Os de backup (`baixar-storage.mjs`, `exportar-tabelas.mjs`, `exportar-schema.mjs`) continuam válidos para o projeto antigo.

**Sequência real para colocar tudo no ar:**

1. Mergear o PR `merge/master-into-aws` na `aws` → o deploy sobe a imagem nova e o runner aplica 051 (níveis nomeados), 052, 053, 054, 055 e 056.
2. Antes do deploy, gravar no Secrets Manager (`olimpiadas-raiz/prd/runtime`): `OPENAI_API_KEY` e `CREDENCIAIS_MASTER_KEY`.
3. Depois do deploy: `/aluno/treino` com imagens e alternativas; `/configuracoes/credenciais` → Testar conexão / Testar modelos → Salvar.
4. Projeto antigo: com o backup local íntegro e os arquivos no S3, ele só serve como rollback. Manter até a verificação final (seção 3) ficar verde.

## 1. O que aconteceu

O app saiu da Vercel para a AWS (CloudFront na frente) e o banco saiu do projeto Supabase pessoal do Helio (`ebdazvyyunilbkygtevn`) para o projeto Supabase da Raiz Educação. Três coisas ficaram para trás:

| #   | Problema                                                                                                                                                                                                                                                               | Evidência                                                                                                                                  | Efeito                                                                                                                                  |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | O CSP servido pelo CloudFront **não tem host nenhum do Supabase** em `img-src` e `connect-src`                                                                                                                                                                         | Header ao vivo vs `next.config.ts`; violações `securitypolicyviolation` no navegador; a mesma URL de imagem responde 200 fora do navegador | Toda imagem de questão some; qualquer `fetch` do navegador ao Supabase é recusado (login do staff pelo Google usa isso desde o PR #152) |
| 2   | O schema do projeto novo **não tem o que foi criado à mão** no antigo (sem migration): `alternativa.imagem_largura`, `solucao.imagem_largura`, `usuario.admin_marca`, `preparacao_aula.modalidade_online`, tabelas `simulado_sessao`, `serie_classificacao`, `feriado` | Server Action devolve `1:[]` na AWS; a mesma query no projeto antigo devolve 5 linhas; inventário OpenAPI × migrations                     | Alternativas nunca carregam; simulado cronometrado não abre; Preparação quebra ao salvar aula                                           |
| 3   | As URLs de imagem gravadas no banco **apontam para o Storage do projeto antigo** (3.101 objetos no bucket `questoes`)                                                                                                                                                  | 715 + 713 + 874 + 40 + 1178 linhas com o host antigo                                                                                       | Mesmo com CSP certo, as imagens só existem no projeto antigo                                                                            |

Além disso, o build na AWS é **anterior ao PR #152 (10/08)** — o bundle de `/login` não contém o cliente Supabase que o código atual importa. Faltam pelo menos #152–#156.

## 2. Ordem de execução

Cada passo diz quem executa. Não pule o 0: ele devolve as imagens hoje, sem depender do resto.

### Passo 0 — CSP com os dois hosts (Infra AWS, imediato)

Onde quer que o header esteja sendo definido (Response Headers Policy do CloudFront, `next.config.ts` alterado no build, ou proxy), o valor deve ser:

```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://ebdazvyyunilbkygtevn.supabase.co https://<REF_RAIZ>.supabase.co; media-src 'self' https:; frame-src 'self' https://www.youtube.com https://player.vimeo.com; connect-src 'self' https://ebdazvyyunilbkygtevn.supabase.co https://<REF_RAIZ>.supabase.co https://vitals.vercel-insights.com; font-src 'self'; frame-ancestors 'self' https://painel-pedagogico-raiz-rho.vercel.app
```

A partir deste PR o `next.config.ts` monta esses hosts sozinho: o do projeto vem de `NEXT_PUBLIC_SUPABASE_URL`; os extras (o antigo, durante a transição) vêm de `NEXT_PUBLIC_CSP_EXTRA_ORIGINS=https://ebdazvyyunilbkygtevn.supabase.co`. **Se o CloudFront sobrescreve o header, o `next.config.ts` não adianta** — a política do CloudFront tem que ser editada ou removida.

### Passo 1 — Schema no projeto da Raiz (Helio, SQL Editor)

1. Conferir se todas as migrations até a 051 foram aplicadas (`supabase/migrations/`). Se o projeto foi criado por dump, provavelmente sim.
2. Rodar, nesta ordem, `supabase/migrations/20260828_052_schema_manual_nao_versionado.sql`, `20260828_053_credencial.sql` e `20260828_054_indices_e_enum_manuais.sql` — todas idempotentes. (A 054 veio do dump de schema do projeto antigo via `exportar-schema.mjs`: 7 índices e 3 valores de enum criados à mão.)
3. Rodar `supabase/scripts/migracao-raiz/01-verificar-schema.sql` bloco a bloco: A e B têm que dar tudo `ok`; D mostra se a cópia de dados está completa; G mostra se o staff vai conseguir logar.

Isso sozinho resolve as alternativas (problema 2).

### Passo 2 — Auth do staff (Helio, Dashboard do projeto novo)

- `usuario.id` **é** o id em `auth.users`. O bloco G do script mostra `usuarios_sem_auth`; se for > 0, os auth users não vieram com os mesmos UUIDs — importar `auth.users` do projeto antigo (dump do schema `auth`) ou recriar os usuários e atualizar `usuario.id`.
- Authentication → Providers → Google: mesmo Client ID/Secret do app (`GOOGLE_CLIENT_ID/SECRET`).
- No Google Cloud Console, adicionar `https://<REF_RAIZ>.supabase.co/auth/v1/callback` às Redirect URIs.
- Authentication → URL Configuration: Site URL `https://olimpiadas.raizeducacao.com.br`; Redirect URLs `https://olimpiadas.raizeducacao.com.br/auth/callback` e `https://olimpiadas.raizeducacao.com.br/auth/popup-callback`.

### Passo 3 — Storage e URLs (Helio, local)

1. No `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`/`ANON`/`SERVICE_ROLE` = projeto da Raiz; `OLD_SUPABASE_URL` + `OLD_SUPABASE_SERVICE_ROLE_KEY` = projeto antigo.
2. `node supabase/scripts/migracao-raiz/copiar-storage.mjs --dry-run` → conferir contagens → rodar sem `--dry-run`. Pode interromper e retomar.
3. Abrir no navegador `https://<REF_RAIZ>.supabase.co/storage/v1/object/public/questoes/enunciados/CANGURU2021_J_Q02_fig01.png`.
4. Rodar `supabase/scripts/migracao-raiz/02-reescrever-urls-storage.sql` (preencher `new_host`). O Passo 1 do script deve zerar depois.
5. Só então tirar o host antigo do CSP (`NEXT_PUBLIC_CSP_EXTRA_ORIGINS` vazio / política do CloudFront).

### Passo 4 — Variáveis de ambiente na AWS (Infra)

`NEXT_PUBLIC_*` são **inlined no build** — precisam existir na hora do `next build` (build args do Docker), não só no runtime do container.

| Variável                                              | Build | Runtime | Valor                                                                                                  |
| ----------------------------------------------------- | ----- | ------- | ------------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                            | ✅    | ✅      | `https://<REF_RAIZ>.supabase.co`                                                                       |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                       | ✅    | ✅      | projeto da Raiz                                                                                        |
| `NEXT_PUBLIC_APP_URL`                                 | ✅    | ✅      | `https://olimpiadas.raizeducacao.com.br`                                                               |
| `NEXT_PUBLIC_CSP_EXTRA_ORIGINS`                       | ✅    | —       | `https://ebdazvyyunilbkygtevn.supabase.co` até o Passo 3 terminar; depois vazio                        |
| `NEXT_PUBLIC_SENTRY_DSN`                              | ✅    | ✅      | opcional                                                                                               |
| `SUPABASE_SERVICE_ROLE_KEY`                           | —     | ✅      | projeto da Raiz (segredo)                                                                              |
| `SESSION_SIGNING_SECRET`                              | —     | ✅      | o mesmo de antes, senão todo aluno é deslogado                                                         |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`            | —     | ✅      |                                                                                                        |
| `CREDENCIAIS_MASTER_KEY`                              | —     | ✅      | `openssl rand -base64 32`; cifra a tabela `credencial` (issue #159). Guardar também no cofre da equipe |
| `GROQ_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | —     | ✅      | Groq e OpenAI podem vir da tela `/configuracoes/credenciais`; a env é fallback                         |
| `RAIZ_DATA_ENGINE_URL`, `RAIZ_DATA_ENGINE_TOKEN`      | —     | ✅      | se a sincronização estiver ativa                                                                       |
| `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`   | ✅    | —       | só para upload de sourcemaps                                                                           |

### Passo 5 — Deploy do master (Infra)

Buildar o `master` atual (≥ PR #156). Enquanto não houver pipeline, **cada merge precisa de um build manual na AWS** — o repositório só tem CI (`.github/workflows/ci.yml`). Recomendação: GitHub Actions no push em `master` → build da imagem → deploy, para que "mergeado" volte a significar "no ar".

### Passo 6 — Ferramentas locais (Helio)

O pipeline de carga de questões (`recortador-populador` → `gerar_sql` + upload no Storage) lê o `.env.local`. Até o Passo 3.1, **toda carga iria para o projeto antigo**. Conferir antes da próxima prova (Mandacaru Cajuína/Lampião).

## 3. Verificação final

- [ ] `/aluno/treino?olimpiada=canguru` — imagem do enunciado aparece; alternativas carregam; responder registra
- [ ] Questão discursiva com foto — avaliação por IA responde
- [ ] Simulado cronometrado abre, pausa e retoma (`simulado_sessao`)
- [ ] `/login` — "Entrar com Google" (staff) conclui e cai no dashboard com o papel certo
- [ ] `/aluno/login` — Google do aluno conclui
- [ ] `/academico/banco-questoes` — preview de questão com imagem; upload de imagem nova vai para o bucket do projeto novo
- [ ] `/academico/apostilas` — PDF gerado abre (bucket `apostilas`)
- [ ] `/usuarios` — convite envia e-mail
- [ ] Sentry recebe evento de teste

## 4. Rollback e retenção

- **Rollback** (enquanto o projeto antigo existir): apontar as env vars da AWS de volta para `ebdazvyyunilbkygtevn` e rebuildar. Nada neste PR impede isso — a migration 052 é no-op lá.
- **Não apagar nem pausar o projeto antigo** até: Storage copiado, URLs reescritas, verificação final verde e 30 dias de operação.

## 5. Inventário do projeto antigo (2026-08-28)

36 tabelas/views, 11 RPCs (todas versionadas). Linhas: questao 1914 · alternativa 8030 · solucao 950 · aluno 155 · usuario 32 · usuario_marca 26 · marca 13 · unidade 32 · turma 240 · olimpiada 33 · olimpiada_fase 95 · convite 104 · resposta_aluno 630 · apostila_questao 72 · audit_log 46439. Storage: `questoes` (público) 3101 objetos — enunciados 2040, solucoes 994, alternativas 43, questoes 6; `apostilas` 4; `preparacao-materiais` 1; `planilhas-olimpiadas` 0.

Para repetir o inventário em qualquer projeto: `node supabase/scripts/migracao-raiz/inventario-projeto.mjs [--prefix OLD_] saida.json`; para comparar dois: `--diff antigo.json novo.json`.
