-- =============================================================================
-- Migration: 050 — Lote CONVIDADOS RT (2026-08-06)
--
-- 1) Cria as marcas que faltavam: Global Tree, Colégio Sarah Dawsey e a própria
--    Raiz Educação (a rede passa a ser uma marca, para vincular a equipe dela).
--    GOV e Franquias NÃO viram marca (decisão do Helio): as pessoas dessas áreas
--    ficam no Apogeu, que é o domínio de origem delas.
--
-- 2) Registra os 110 convidados como CONVITE pendente com a marca correta. O
--    convite é o registro do que a gestão previu: quando a pessoa entra pelo
--    Google (liberado neste mesmo PR), lib/auth/primeiro-acesso.ts usa a marca e
--    o papel do convite em vez de deduzir pelo domínio — é isso que faz as 3
--    pessoas que usam e-mail de outra marca caírem na marca certa.
--
-- Fora do lote (5 pendências reportadas ao Helio): 3 gmail, 1 yahoo e 1 e-mail
-- repetido (Rafael Santos com o endereço do Rodrigo Reis).
-- =============================================================================

INSERT INTO marca (nome, slug, ativo) VALUES
  ('Global Tree',           'global-tree',   true),
  ('Colégio Sarah Dawsey',  'sarah-dawsey',  true),
  ('Raiz Educação',         'raiz-educacao', true)
ON CONFLICT (slug) DO NOTHING;

-- Convites: papel professor, validade de 1 ano (o vínculo é consumido no 1º login).
INSERT INTO convite (email, role, marca_id, expires_at) VALUES
  ('andre.marinho@colegioqi.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('arilce@colegioqi.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('dely.antunes@colegioqi.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('lucas.benjamin@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('vanessa.costa@colegioqi.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('vagner.coelho@colegioqi.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('rubem.corso@unificado.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'unificado'), now() + interval '1 year'),
  ('augusto.junior@unificado.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'unificado'), now() + interval '1 year'),
  ('lucia.lopez@colegiouniao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'uniao'), now() + interval '1 year'),
  ('luisa.canella@unificado.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'unificado'), now() + interval '1 year'),
  ('carolina.cunha@unificado.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'unificado'), now() + interval '1 year'),
  ('flavio.rocha@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('carlos.felicio@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('renata.goudar@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('izabela.oliveira@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('rafael.xavier@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('emanuely.silva@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('victor.avila@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('kelly.pitanca@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('ronaldo.conceicao@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('djan.souza@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('fabiana.schulte@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('rachel.macena@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('virginia.lima@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('ronaldo.nascimento@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('eduardo.xavier@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('daniele.gomes@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('lua.marins@matrizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'matriz-educacao'), now() + interval '1 year'),
  ('ricardo.nunes@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('luana.modesto@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('guilherme.calderano@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('keila.martins@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('dalton.silva@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('erik.chaves@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'qi-bilingue'), now() + interval '1 year'),
  ('karina.barreto@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('juliana.ponciano@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('camila.christo@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('tiago.simoes@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('mariana.lopes@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('aline.gusman@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('allan.jayme@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('anapaula.figueiredo@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('carla.cidade@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('eliane.faravelli@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('juliana.toscano@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'global-tree'), now() + interval '1 year'),
  ('helcio.alvim@sapereira.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sa-pereira'), now() + interval '1 year'),
  ('vanessa@sapereira.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sa-pereira'), now() + interval '1 year'),
  ('joao@sapereira.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sa-pereira'), now() + interval '1 year'),
  ('luciana.soares@escolasap.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'escola-sap'), now() + interval '1 year'),
  ('joyce.santoro@escolasap.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'escola-sap'), now() + interval '1 year'),
  ('jose.junior@cubo.global', 'professor', (SELECT id FROM marca WHERE slug = 'cubo-global'), now() + interval '1 year'),
  ('rodrigo.reis@cubo.global', 'professor', (SELECT id FROM marca WHERE slug = 'cubo-global'), now() + interval '1 year'),
  ('camila.oro@cubo.global', 'professor', (SELECT id FROM marca WHERE slug = 'cubo-global'), now() + interval '1 year'),
  ('ana.balieiro@crecheglobaltree.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'cubo-global'), now() + interval '1 year'),
  ('marcia.silva@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('ivone.fracalossi@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('roberta.fraga@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('aline.konig@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('fabiana.santos@professores.colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('joana.wurdig@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('roxane.duarte@colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('sabrina.disarz@professores.colegioleonardodavinci.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'colegio-leonardo-da-vinci'), now() + interval '1 year'),
  ('claudia@sarahdawsey.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sarah-dawsey'), now() + interval '1 year'),
  ('bernardo@sarahdawsey.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sarah-dawsey'), now() + interval '1 year'),
  ('andreluiz@sarahdawsey.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'sarah-dawsey'), now() + interval '1 year'),
  ('andre.gusman@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('yuri.barbeito@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('adriana.hassin@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('fernanda.pontes@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('mariana.oliveira@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('lanna.santos@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('giovani.fiorin@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('luciana.itho@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('gabriela.cardoso@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('johnny.machado@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('luisa.lopes@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('madelainne.bastos@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('thiago.damasco@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('reinaldo.donadio@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('rodrigo.coutinho@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('renata.werneck@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('rayanne.nogueira@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('alfredo.portugal@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('hugo.carvalho@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('dayara.rodrigues@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('marcelo.costa@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('makerley@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('rodrigo.cruz@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('alyne.paiva@colegioapogeu.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('frederico.melo@apggov.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('ana.bernardino@apggov.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('max.leopoldo@apggov.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('daiana.duarte@apggov.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('maycon.amaral@apggov.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'apogeu'), now() + interval '1 year'),
  ('cynthia.muniz@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('diogo.soares@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('eloa.mangueira@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('enzo.silva@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('gabriel.araujo@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('joao.azambuja@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('leonardo.fernandes@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('mariana.sa@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('viliana.berto@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('marcia.gomes@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('marcelo.saraiva@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('edmilson.serafim@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('amanda.teixeira@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('gustavo.fagundes@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('rodrigo.vieira@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year'),
  ('jorge.carolino@raizeducacao.com.br', 'professor', (SELECT id FROM marca WHERE slug = 'raiz-educacao'), now() + interval '1 year')
ON CONFLICT DO NOTHING;

-- Conferência:
--   SELECT m.nome, count(*) FROM convite c JOIN marca m ON m.id = c.marca_id
--    WHERE c.aceito_em IS NULL GROUP BY m.nome ORDER BY 2 DESC;

-- Down:
--   DELETE FROM convite WHERE aceito_em IS NULL AND email IN (...lista do lote...);
--   DELETE FROM marca WHERE slug IN ('global-tree','sarah-dawsey','raiz-educacao');
