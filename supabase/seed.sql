-- =============================================================================
-- Seed: dados iniciais de desenvolvimento
-- Sistema de Gestão de Olimpíadas do Conhecimento — Raiz Educação
-- =============================================================================
-- ATENÇÃO: Este seed é para desenvolvimento local.
-- Para produção, os usuários são criados via fluxo de convite (handle_new_user).
-- As marcas são dados reais e devem ser aplicados em todos os ambientes.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 6 Marcas do grupo Raiz Educação
-- ---------------------------------------------------------------------------

INSERT INTO marca (id, nome, slug, cor_primaria, ativo) VALUES
  ('11111111-0000-0000-0000-000000000001', 'Apogeu',          'apogeu',         '#1E40AF', true),
  ('11111111-0000-0000-0000-000000000002', 'Matriz Educação', 'matriz-educacao', '#7C3AED', true),
  ('11111111-0000-0000-0000-000000000003', 'QI Bilíngue',     'qi-bilingue',     '#059669', true),
  ('11111111-0000-0000-0000-000000000004', 'União',           'uniao',           '#DC2626', true),
  ('11111111-0000-0000-0000-000000000005', 'Unificado',       'unificado',       '#D97706', true),
  ('11111111-0000-0000-0000-000000000006', 'Americano',       'americano',       '#0891B2', true)
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Unidades de exemplo (desenvolvimento)
-- Para produção: carregar via planilha de onboarding (SPEC §decisões pendentes)
-- ---------------------------------------------------------------------------

INSERT INTO unidade (id, marca_id, nome, cidade, estado, ativo) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Apogeu Barra da Tijuca',   'Rio de Janeiro', 'RJ', true),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'Apogeu Botafogo',          'Rio de Janeiro', 'RJ', true),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'Matriz Centro',            'Rio de Janeiro', 'RJ', true),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'Matriz Niterói',           'Niterói',        'RJ', true),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003', 'QI Bilíngue Recreio',      'Rio de Janeiro', 'RJ', true),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000004', 'União Tijuca',             'Rio de Janeiro', 'RJ', true),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000005', 'Unificado São Gonçalo',    'São Gonçalo',    'RJ', true),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000006', 'Americano Méier',          'Rio de Janeiro', 'RJ', true)
ON CONFLICT (marca_id, nome) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Turmas de exemplo (unidade Apogeu Barra da Tijuca)
-- ---------------------------------------------------------------------------

INSERT INTO turma (id, unidade_id, nome, serie, ano_letivo, ativo) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '5A', '5º ano', 2026, true),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', '6A', '6º ano', 2026, true),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', '9A', '9º ano', 2026, true),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', '1EM-A', '1º EM', 2026, true),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', '3EM-A', '3º EM', 2026, true)
ON CONFLICT (unidade_id, nome, ano_letivo) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Olimpíadas de exemplo (2026)
-- ---------------------------------------------------------------------------

INSERT INTO olimpiada (
  id, nome, area_conhecimento, classificacao,
  organizacao_promotora, premiacao,
  series_elegiveis, faixa_etaria_min, faixa_etaria_max,
  ano_letivo, ativo
) VALUES
  (
    '44444444-0000-0000-0000-000000000001',
    'OBMEP — Olimpíada Brasileira de Matemática das Escolas Públicas e Privadas',
    'Matemática', 'obrigatoria',
    'IMPA / SBM',
    'Medalha de Ouro, Prata, Bronze, Menção Honrosa + bolsas de estudo',
    ARRAY['6º ano','7º ano','8º ano','9º ano','1º EM','2º EM','3º EM'],
    11, 19,
    2026, true
  ),
  (
    '44444444-0000-0000-0000-000000000002',
    'OBI — Olimpíada Brasileira de Informática',
    'Informática', 'facultativa',
    'Instituto de Computação — UNICAMP',
    'Medalhas + possibilidade de representar o Brasil em competições internacionais',
    ARRAY['7º ano','8º ano','9º ano','1º EM','2º EM','3º EM'],
    12, 19,
    2026, true
  ),
  (
    '44444444-0000-0000-0000-000000000003',
    'OBFE — Olimpíada Brasileira de Física para as Escolas',
    'Física', 'facultativa',
    'Sociedade Brasileira de Física',
    'Medalhas de Ouro, Prata, Bronze',
    ARRAY['8º ano','9º ano','1º EM','2º EM','3º EM'],
    13, 19,
    2026, true
  )
ON CONFLICT DO NOTHING;

-- Associar OBMEP e OBI às 6 marcas, OBFE só a Apogeu e Matriz (exemplo)
INSERT INTO olimpiada_marca (olimpiada_id, marca_id)
SELECT '44444444-0000-0000-0000-000000000001', id FROM marca
ON CONFLICT DO NOTHING;

INSERT INTO olimpiada_marca (olimpiada_id, marca_id)
SELECT '44444444-0000-0000-0000-000000000002', id FROM marca
ON CONFLICT DO NOTHING;

INSERT INTO olimpiada_marca (olimpiada_id, marca_id) VALUES
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000001'),
  ('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Fases da OBMEP 2026
INSERT INTO olimpiada_fase (olimpiada_id, tipo, nome, data_inicio, data_fim, ordem) VALUES
  ('44444444-0000-0000-0000-000000000001', 'inscricao',  'Inscrições OBMEP 2026',    '2026-05-01', '2026-06-30', 1),
  ('44444444-0000-0000-0000-000000000001', 'prova_1',    '1ª Fase — OBMEP 2026',     '2026-08-15', '2026-08-15', 2),
  ('44444444-0000-0000-0000-000000000001', 'prova_2',    '2ª Fase — OBMEP 2026',     '2026-10-10', '2026-10-10', 3),
  ('44444444-0000-0000-0000-000000000001', 'divulgacao', 'Divulgação Resultados',    '2026-12-01', '2026-12-01', 4)
ON CONFLICT DO NOTHING;

-- Fases da OBI 2026
INSERT INTO olimpiada_fase (olimpiada_id, tipo, nome, data_inicio, data_fim, ordem) VALUES
  ('44444444-0000-0000-0000-000000000002', 'inscricao', 'Inscrições OBI 2026',        '2026-04-01', '2026-05-31', 1),
  ('44444444-0000-0000-0000-000000000002', 'prova_1',   'Fase Regional OBI 2026',    '2026-07-12', '2026-07-12', 2),
  ('44444444-0000-0000-0000-000000000002', 'final',     'Final OBI 2026',             '2026-09-20', '2026-09-21', 3)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- NOTA: usuário admin_rede não é criado aqui.
-- Em desenvolvimento: criar via Supabase Dashboard ou CLI com:
--
--   supabase auth admin create-user \
--     --email admin@raizeducacao.com.br \
--     --password <senha-segura> \
--     --email-confirm
--
-- E depois inserir manualmente em public.usuario:
--   INSERT INTO usuario (id, nome, email, role)
--   VALUES ('<uuid-do-auth-user>', 'Admin Rede', 'admin@raizeducacao.com.br', 'admin_rede');
-- ---------------------------------------------------------------------------
