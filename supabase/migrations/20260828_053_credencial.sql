-- 053 — credencial: chaves de integração cifradas, geridas em /configuracoes/credenciais.
--
-- Issue #159. A chave da IA (e as próximas) sai da env var e passa a viver aqui,
-- cifrada com AES-256-GCM. A chave-mestra (CREDENCIAIS_MASTER_KEY, 32 bytes em
-- base64) fica SÓ em env var no servidor — um dump deste banco, sozinho, não abre
-- nada. Formato de valor_cifrado: "v1:<iv>:<tag>:<ciphertext>" (base64).
--
-- Só o servidor lê (admin client / service_role): RLS ligado, sem policies.
-- A tela mostra apenas `ultimos4`; o valor nunca vai ao navegador.
-- Auditoria: audit_log (entidade = 'credencial', entidade_id = credencial.id).

create table if not exists credencial (
  id             uuid        primary key default gen_random_uuid(),
  chave          text        not null unique,   -- ver lib/credenciais/catalogo.ts (ex.: openai_api_key)
  valor_cifrado  text        not null,
  ultimos4       text        not null,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid        references usuario(id) on delete set null
);

create index if not exists idx_credencial_atualizado_por on credencial (atualizado_por);

alter table credencial enable row level security;

-- Down:
--   drop table if exists credencial;
