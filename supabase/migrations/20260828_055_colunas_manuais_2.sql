-- 055 — Colunas manuais que a 052 não cobriu (comparação POR TABELA do dump do
-- projeto antigo × migrations, 2026-08-28).
--
-- A busca por palavra da 052 foi enganada pelo texto de questões dentro das
-- migrations ("…em blocos de 5 pessoas…"), e outras colunas casaram com tabelas
-- diferentes. Estas quatro nunca tiveram migration:
--
--   solucao.blocos            jsonb   resoluções com imagem (917 linhas no antigo)
--   resposta_aluno.contexto   text    'banco' | 'aula' | 'simulado' — gravada em TODA resposta
--   resposta_aluno.aula_id    uuid    FK preparacao_aula, on delete set null
--   meta_marca.criado_em      timestamptz default now()
--
-- No Aurora a ausência de resposta_aluno.contexto derrubou o deploy de 28/08 na
-- 054 (índice sobre a coluna) e, pior, faz o INSERT de resposta_aluno falhar em
-- silêncio: respostas de alunos não estão sendo gravadas lá desde a migração.
--
-- Constraints reproduzem as do projeto antigo. Idempotente; roda ANTES da 056/057.

alter table solucao add column if not exists blocos jsonb;

alter table resposta_aluno add column if not exists contexto text not null default 'banco';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'resposta_aluno_contexto_check'
  ) then
    alter table resposta_aluno
      add constraint resposta_aluno_contexto_check
      check (contexto in ('banco', 'aula', 'simulado'));
  end if;
end $$;

alter table resposta_aluno
  add column if not exists aula_id uuid references preparacao_aula (id) on delete set null;

create index if not exists idx_resposta_contexto on resposta_aluno (aluno_id, contexto);

alter table meta_marca add column if not exists criado_em timestamptz not null default now();

-- Down:
--   drop index if exists idx_resposta_contexto;
--   alter table meta_marca     drop column if exists criado_em;
--   alter table resposta_aluno drop column if exists aula_id;
--   alter table resposta_aluno drop column if exists contexto;
--   alter table solucao        drop column if exists blocos;
