# Implantação AWS da Olimpíadas Raiz

Esta branch prepara uma cópia independente da aplicação atual na AWS, sem alterar a `master` e sem desligar o ambiente Vercel existente.

## Arquitetura desta primeira onda

- Route 53, CloudFront, WAF e ACM para `olimpiadas.raizeducacao.com.br`;
- Application Load Balancer privado para a borda CloudFront;
- aplicação Next.js em duas tarefas ECS Fargate, distribuídas entre duas zonas de disponibilidade;
- imagens imutáveis no ECR;
- segredos no AWS Secrets Manager;
- logs no CloudWatch;
- Supabase mantido temporariamente como banco e autenticação, evitando migração big bang;
- deploy manual pela branch `aws`, autenticado no GitHub Actions por OIDC, sem chaves AWS permanentes.

O DNS público só deve ser criado depois de `/api/health` responder com sucesso no ALB. A `master` e o ambiente Vercel permanecem como rollback operacional.

## Stacks

- `olimpiadas-raiz-prd-foundation`, em `sa-east-1`: rede, ALB, ECS, ECR, logs, segredos e papel OIDC.
- `olimpiadas-raiz-prd-edge`, em `us-east-1`: certificado do domínio, CloudFront, WAF e registros Route 53.

## Configuração obrigatória

O segredo `olimpiadas-raiz/prd/runtime` deve conter, no mínimo:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SESSION_SIGNING_SECRET`

As integrações opcionais podem usar `GROQ_API_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `RAIZ_DATA_ENGINE_URL` e `RAIZ_DATA_ENGINE_TOKEN`.

Não registre valores de segredos em arquivos, commits, outputs ou logs. O workflow interrompe o deploy quando uma configuração obrigatória está ausente.

## Sequência de ativação

1. Implantar e validar a stack de fundação.
2. Copiar os valores do ambiente atual para o Secrets Manager.
3. Criar no GitHub o Environment protegido `aws-production` e executar manualmente o workflow `Deploy AWS` na branch `aws`.
4. Confirmar duas tarefas saudáveis e testar o domínio de origem.
5. Implantar a stack de borda.
6. Validar login Google, perfis, inscrições, resultados, upload/download e integrações.
7. Manter Vercel e `master` intactos até o aceite funcional.

## Rollback

Antes do domínio público, basta atualizar o serviço ECS para a task definition anterior. Depois da ativação, a reversão imediata é restaurar o registro DNS para o ambiente anterior ou remover os aliases da nova distribuição, mantendo os dados no Supabase compartilhado durante esta primeira onda.
