// Regras de ingresso em universidades a partir de resultados em olimpíadas
// científicas — conteúdo curado manualmente a partir de editais e páginas
// oficiais. Atualizar a cada ciclo (editais saem entre outubro e janeiro).

export const VERIFICADO_EM = "16/07/2026";

export type CategoriaIngresso = "publica" | "privada" | "internacional" | "apoio";

export type InstituicaoIngresso = {
  sigla: string;
  nome: string;
  categoria: CategoriaIngresso;
  local: string;
  programa: string;
  destaque?: string;
  beneficio: string;
  olimpiadas: string;
  regras: string[];
  inscricao?: string;
  links: { label: string; url: string }[];
  pendencia?: string;
};

export const INSTITUICOES: InstituicaoIngresso[] = [
  // ── Públicas — ingresso direto ──────────────────────────────────────────────
  {
    sigla: "UNESP",
    nome: "Universidade Estadual Paulista",
    categoria: "publica",
    local: "SP · Estadual · 23 cidades",
    programa: "Olimpíadas Científicas Unesp 2026 (Vunesp VNSP2510)",
    destaque: "451 vagas — maior volume do país",
    beneficio: "451 vagas adicionais, sem vestibular; 1ª chamada + 4 chamadas adicionais",
    olimpiadas:
      "Matemática, física, química, biologia, informática, astronomia, história e outras — medalhas ouro/prata/bronze ou menção",
    regras: [
      "Vagas adicionais às do vestibular regular",
      "Inscrição gratuita",
      "Lista exata de olimpíadas e validade das medalhas: consultar o edital Vunesp",
    ],
    inscricao: "17/11/2025 a 04/01/2026 (ciclo 2026)",
    links: [
      { label: "Edital Vunesp", url: "https://www.vunesp.com.br/VNSP2510" },
      { label: "Vestibular Unesp", url: "https://vestibular.unesp.br/" },
    ],
    pendencia: "Lista completa de olimpíadas aceitas e validade não confirmadas no edital",
  },
  {
    sigla: "USP",
    nome: "Universidade de São Paulo",
    categoria: "publica",
    local: "SP · Estadual · 7 campi",
    programa: "Competições do Conhecimento 2026 (Fuvest)",
    destaque: "234 vagas em 100+ cursos",
    beneficio: "234 vagas adicionais, sem prova",
    olimpiadas:
      "Nacionais: OBMEP, OBM, ONC, OBA, OBF, OBFEP, OBQ, OBB, ONHB, OLP, OBI, FEBRACE, OBR, OBG. Internacionais: IMO, IPhO, IChO, IOAA, IBO, IOI, EGMO, EGOI e ibero-americanas (nem toda medalha vale para todo curso — ver Anexo I)",
    regras: [
      "Só medalhas individuais: bronze 1 pt (nacional) / 4 pts (internacional); prata 2/5; ouro 3/6",
      "Pontuação mínima varia por curso (definida no edital)",
      "Valem premiações dos 2 últimos anos, obtidas durante o Ensino Médio",
    ],
    inscricao: "05/01 a 16/01/2026, gratuita (ciclo 2026)",
    links: [{ label: "Fuvest — Olimpíadas", url: "https://www.fuvest.br/olimpiadas/" }],
  },
  {
    sigla: "UNICAMP",
    nome: "Universidade Estadual de Campinas",
    categoria: "publica",
    local: "SP · Estadual",
    programa: "Edital Vagas Olímpicas 2026 (Comvest)",
    destaque: "133 vagas em 37 cursos",
    beneficio: "133 vagas, sem vestibular",
    olimpiadas:
      "28 competições aceitas (OBM, OBMEP, OBF, OBFEP, OBQ, OBI, ONHB, OBB, IMO, IChO, IOI e outras) — pontuação por medalha e abrangência (regional/nacional/internacional)",
    regras: ["Pontuação definida no Quadro de Pontuações do edital", "Inscrição gratuita"],
    inscricao: "01/12/2025 a 12/01/2026 — prorrogado (ciclo 2026)",
    links: [
      {
        label: "Comvest — Vagas Olímpicas",
        url: "https://www.comvest.unicamp.br/ingresso-2026/vagas-olimpicas-2026/",
      },
    ],
  },
  {
    sigla: "IMPA Tech",
    nome: "Instituto de Matemática Pura e Aplicada — Tecnologia e Inovação",
    categoria: "publica",
    local: "Rio de Janeiro · Federal/OS",
    programa: "Processo Seletivo 2026",
    destaque: "Até 80% das vagas exclusivas para medalhistas",
    beneficio:
      "Até 80 das ~100 vagas do Bacharelado em Matemática da Tecnologia e Inovação; 100% gratuito, com alojamento, bolsa alimentação e passagem aérea",
    olimpiadas:
      "OBMEP N3 (premiação nacional), OBM N3, OBFEP níveis B/C nacional, OBQ modalidades A/B, OBI programação níveis 1/2 (EM)",
    regras: [
      "Seleção em 2 etapas: dinâmicas em grupo + entrevistas",
      "Curso único, dedicação integral",
    ],
    inscricao: "Até 23/12/2025 (ciclo 2026)",
    links: [
      {
        label: "Edital IMPA Tech 2026 (PDF)",
        url: "https://impatech.edu.br/wp-content/uploads/2025/10/Edital-IMPA-Tech-2026-versao-final-2025-10-23site.pdf",
      },
    ],
  },
  {
    sigla: "UFC",
    nome: "Universidade Federal do Ceará",
    categoria: "publica",
    local: "Ceará · Federal",
    programa: "Vestibular Vagas Olímpicas 2026",
    destaque: "104 vagas em 41 cursos",
    beneficio: "104 vagas em cursos presenciais, sem prova",
    olimpiadas:
      "Ao menos 1 medalha (ouro/prata/bronze) em olimpíada ou competição científica — âmbito local, nacional ou internacional",
    regras: [
      "Valem medalhas de 2022 a 2025 (janela de 4 anos)",
      "Certificado de mérito só é aceito acompanhado de medalha física",
    ],
    inscricao: "06 a 12/01/2026, gratuita (ciclo 2026)",
    links: [{ label: "UFC — Vagas Olímpicas", url: "https://olimpiadas.prograd.ufc.br" }],
  },
  {
    sigla: "UFABC",
    nome: "Universidade Federal do ABC",
    categoria: "publica",
    local: "SP · Federal",
    programa: "Edital nº 58/2025 — Vagas Olímpicas (ingresso 2026)",
    beneficio:
      "20 vagas nos Bacharelados e Licenciaturas Interdisciplinares (BC&T, BC&H) — entra em ciência e se especializa depois",
    olimpiadas: "Premiados em Olimpíadas do Conhecimento e Competições Científicas",
    regras: ["Valem premiações de 2023, 2024 e 2025 (3 anos)", "Inscrição gratuita"],
    inscricao: "Até 10/02/2026 (ciclo 2026)",
    links: [
      {
        label: "Edital UFABC 58/2025 (PDF)",
        url: "https://prograd.ufabc.edu.br/pdf/edital_58_2025_ingresso_vagas_olimpicas_2026.pdf",
      },
    ],
  },
  {
    sigla: "UNIFEI",
    nome: "Universidade Federal de Itajubá",
    categoria: "publica",
    local: "MG · Federal",
    programa: "Vagas Olímpicas (pioneira entre as federais)",
    beneficio: "Última edição ofertou 43 vagas; processo combina vagas olímpicas + nota do ENEM",
    olimpiadas:
      "24 olimpíadas/competições aceitas (internacionais, ibero-americanas, brasileiras e de escolas públicas)",
    regras: ["Edital anual publicado normalmente em outubro"],
    links: [
      { label: "UNIFEI — Vagas Olímpicas", url: "https://prg.unifei.edu.br/cops/vagas-olimpicas/" },
    ],
    pendencia: "Parâmetros da edição 2026 ainda não publicados",
  },
  {
    sigla: "UFMS",
    nome: "Universidade Federal de Mato Grosso do Sul",
    categoria: "publica",
    local: "MS · Federal",
    programa: "Ingresso — Olimpíadas do Conhecimento",
    beneficio: "Ingresso sem prova, inscrição gratuita",
    olimpiadas: "Definidas em edital anual",
    regras: ["1 inscrição por CPF", "Segue as cotas da Lei 12.711"],
    links: [
      { label: "UFMS — Olimpíadas", url: "https://ingresso.ufms.br/olimpiadas-conhecimento/" },
    ],
    pendencia: "Edição 2026 ainda não detalhada na página oficial",
  },
  {
    sigla: "UnB",
    nome: "Universidade de Brasília",
    categoria: "publica",
    local: "DF · Federal",
    programa: "Vagas extraordinárias para medalhistas (Resolução CEPE 129/2026)",
    destaque: "Aprovado em julho/2026 — primeiro edital a sair",
    beneficio:
      "Vagas extraordinárias para medalhistas ouro/prata/bronze de olimpíadas nacionais/internacionais obtidas no Ensino Médio",
    olimpiadas: "Olimpíadas científicas nacionais e internacionais (lista sairá no edital)",
    regras: [
      "Exige nota de redação (ENEM, PAS 3 ou vestibular UnB dos últimos 8 anos)",
      "Adesão opcional por curso; máximo de 3 vagas extraordinárias por curso/processo",
    ],
    links: [
      {
        label: "Notícia oficial UnB",
        url: "https://noticias.unb.br/ensino/8634-unb-institui-vagas-extraordinarias-para-medalhistas-de-competicoes-do-conhecimento-e-atletas-de-alto-rendimento",
      },
    ],
    pendencia: "Primeiro edital ainda não publicado (vagas e olimpíadas por definir)",
  },

  // ── Privadas — ingresso e bolsas ────────────────────────────────────────────
  {
    sigla: "Insper",
    nome: "Insper",
    categoria: "privada",
    local: "São Paulo · Privada",
    programa: "Seleção Olímpica (Edital Unificado)",
    beneficio:
      "Via de admissão diferenciada: medalhistas fazem apenas a redação Insper (dispensa da prova completa). Bolsas de 100/75/50% existem em programa separado, por renda",
    olimpiadas:
      "Categorias: Escolas Públicas (OBMEP, OBFEP — só nível nacional), Brasileiras 1 e 2, e Internacionais — apenas certificados oficiais das organizadoras",
    regras: [
      "Medalha obtida em categoria de Ensino Médio, enquanto matriculado no EM",
      "Janela de premiações muda por edição (2027.1 aceita 2024 a 2026) — confirmar no edital vigente",
      "Taxa de inscrição: R$ 380",
    ],
    inscricao: "2026.2: 02/03 a 13/05/2026",
    links: [
      {
        label: "Edital Insper 2026.2 (PDF)",
        url: "https://www.insper.edu.br/content/dam/insper-portal/documentos/vestibular/vestibular-26-2/Edital%202026-2.pdf",
      },
    ],
  },
  {
    sigla: "FGV",
    nome: "Fundação Getulio Vargas",
    categoria: "privada",
    local: "SP e RJ · Privada",
    programa: "Modalidade Olimpíadas do Conhecimento + Seleção de Talentos (CDMC)",
    destaque: "Bolsa de 100% para os melhores colocados",
    beneficio:
      "Via de ingresso em Economia (EESP) e Administração/Adm. Pública (EPPG) + bolsa mérito de 100% ao 1º colocado da modalidade (nota final ≥ 74). O CDMC convida medalhistas nacionais para o vestibular das escolas FGV-RJ com bolsa de 100% na graduação",
    olimpiadas: "Olimpíadas do conhecimento com premiação nacional",
    regras: ["Taxa de inscrição: R$ 250 (edital unificado)"],
    inscricao: "1º/2026: até 02/01/2026",
    links: [
      {
        label: "FGV — Olimpíadas do Conhecimento",
        url: "https://vestibular.fgv.br/en/undergraduate/admission-forms/knowledge-olympics",
      },
      { label: "FGV CDMC — Seleção de Talentos", url: "https://cdmc.fgv.br/selecao-de-talentos" },
    ],
  },

  // ── Internacional ───────────────────────────────────────────────────────────
  {
    sigla: "MIT",
    nome: "Massachusetts Institute of Technology",
    categoria: "internacional",
    local: "EUA",
    programa: "Admissão holística — sem vaga reservada, mas com histórico forte de olímpicos",
    destaque: "Need-blind + bolsa integral para internacionais",
    beneficio:
      "Financial aid need-blind e full-need para TODOS, inclusive internacionais — renda familiar < US$ 100 mil (com ativos típicos) paga contribuição parental zero",
    olimpiadas:
      'IMO, IPhO, IChO, IOI, IBO e afins como sinal fortíssimo no processo holístico (o blog oficial celebra seus "MIT Olympians")',
    regras: [
      "Nada é automático: medalha não garante admissão",
      "Casos reais: medalhistas da OBMEP Pedro Sponchiado (ouro IMO 2018) e Orisvaldo Salviano Neto (bronze IChO) admitidos no MIT em 2019 com bolsa integral",
    ],
    links: [
      {
        label: "MIT Olympians (blog oficial)",
        url: "https://mitadmissions.org/blogs/entry/mit_olympians/",
      },
      { label: "Need-blind FAQ", url: "https://mitadmissions.org/help/faq/need-blind-admissions/" },
      {
        label: "Brasileiros no MIT (IMPA)",
        url: "https://impa.br/notices/obmep-medalists-are-accepted-into-the-prestigious-mit/?lang=en",
      },
    ],
  },
  {
    sigla: "EUA elite",
    nome: "Harvard · Princeton · Caltech · Stanford",
    categoria: "internacional",
    local: "EUA",
    programa: "Admissão holística",
    beneficio:
      "Harvard e Princeton: need-blind para internacionais com 100% da necessidade coberta (Princeton sem empréstimos). Caltech e Stanford: need-aware para internacionais, mas cobrem 100% da necessidade de quem é admitido",
    olimpiadas:
      "Olimpíadas internacionais contam como distinção acadêmica de topo no processo holístico — nenhuma publica regra formal por medalha",
    regras: [
      "Sem estatísticas oficiais de aceitação por credencial — desconfie de números de consultorias",
    ],
    links: [
      {
        label: "Caltech — aid internacional",
        url: "https://www.finaid.caltech.edu/applying/international-students",
      },
    ],
  },
  {
    sigla: "Reino Unido",
    nome: "Cambridge · Oxford · Imperial",
    categoria: "internacional",
    local: "Reino Unido",
    programa: "Exame de admissão + entrevista",
    beneficio:
      "Olimpíada ajuda indiretamente: o estilo de problema é o mesmo do STEP (Cambridge Maths), MAT (Oxford) e TMUA (Imperial, desde 2025) e das entrevistas",
    olimpiadas:
      "BMO/IMO valorizadas, mas NÃO substituem o exame — a oferta é condicionada ao STEP/MAT/TMUA",
    regras: [
      "Cambridge Maths: oferta típica A*A*A + STEP 2 e 3 com grade 1,1",
      "Fees integrais ~£40 mil+/ano para internacionais, quase sem aid na graduação",
    ],
    links: [
      {
        label: "Cambridge — STEP",
        url: "https://www.undergraduate.study.cam.ac.uk/apply/after/sixth-term-exam-STEP",
      },
    ],
  },
  {
    sigla: "ETH / EPFL",
    nome: "ETH Zurich · EPFL",
    categoria: "internacional",
    local: "Suíça",
    programa: "Exame de admissão por diploma",
    destaque: "Atenção: medalha olímpica NÃO conta",
    beneficio:
      "Custo baixíssimo (~CHF 730–780/semestre), mas a ETH afirma que prêmios de olimpíada NÃO são considerados na admissão ao bachelor",
    olimpiadas:
      "Zero peso formal — o que vale é o certificado de conclusão do ensino médio por país",
    regras: [
      "Ensino médio brasileiro em geral exige exame de admissão (ETH: reduzido 4 matérias ou completo 8; EPFL: examen d'admission ou ano preparatório CMS)",
      "ETH: primeiro ano em alemão",
    ],
    links: [
      {
        label: "ETH — FAQ admissão",
        url: "https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/faq.html",
      },
    ],
  },
  {
    sigla: "NUS",
    nome: "National University of Singapore",
    categoria: "internacional",
    local: "Singapura",
    programa: "Aptitude-Based Admissions (regra explícita)",
    destaque: "Medalha internacional citada nominalmente na regra",
    beneficio:
      "O esquema oficial lista medalhas das olimpíadas internacionais (Matemática, Física, Química, Informática, Biologia) como evidência de aptidão; a NUS Computing dá consideração especial + isenção de disciplinas a medalhistas de IOI/NOI",
    olimpiadas: "IMO, IPhO, IChO, IOI, IBO (e NOI para Computing)",
    regras: ["Fees subsidiadas com bond de serviço em Singapura (avaliar contrato)"],
    links: [
      {
        label: "NUS — Aptitude-Based Admissions",
        url: "https://www.nus.edu.sg/oam/admissions/aptitude-based-admissions",
      },
      {
        label: "NUS Computing — Olympiad Medallists",
        url: "https://www.comp.nus.edu.sg/programmes/ug/exemptions/olympiad/",
      },
    ],
  },
  {
    sigla: "Waterloo",
    nome: "University of Waterloo",
    categoria: "internacional",
    local: "Canadá",
    programa: "Contests oficiais como critério documentado",
    beneficio:
      'Euclid e CCC são "an asset" documentado e podem decidir casos borderline em Computer Science/Software Engineering, além de bolsas',
    olimpiadas: "Euclid (matemática) e CCC (computação) — organizados pela própria Waterloo",
    regras: ["CS tem aceitação ~4–5% — o contest é diferencial real"],
    links: [
      {
        label: "Waterloo CS — admissions",
        url: "https://cs.uwaterloo.ca/future-undergraduate-students/applying-admissions",
      },
    ],
  },

  // ── Apoio pós-ingresso ──────────────────────────────────────────────────────
  {
    sigla: "IME-USP",
    nome: "Instituto de Matemática e Estatística da USP",
    categoria: "apoio",
    local: "SP",
    programa: "Programa iCEM — Iniciação Científica para Estudantes Medalhistas",
    beneficio:
      "Não é via de ingresso: apoia medalhistas já aprovados nos 2 primeiros anos do IME com bolsa de iniciação científica, mentoria acadêmica e preparação para intercâmbio",
    olimpiadas: "OBM, OBMEP, OBI, OBF e outras",
    regras: ["Foco em diversidade e representatividade feminina"],
    links: [{ label: "iCEM", url: "https://www.ime.usp.br/icem/" }],
  },
];

// PL 3943/2023 — vagas olímpicas obrigatórias nas federais
export const PL_3943 = {
  titulo: "PL 3943/2023 — vagas olímpicas obrigatórias nas federais",
  status:
    "Aprovado na Comissão de Educação da Câmara (13/11/2024); parecer favorável na CCJC (25/06/2025); pronto para pauta — ainda não votado, não chegou ao Senado",
  resumo:
    "Altera a Lei de Cotas (12.711/2012) para obrigar as universidades federais a reservar vagas para participantes de olimpíadas científicas dos 2 anos anteriores à seleção, com lista de olimpíadas, número de vagas e pontuação publicados por edital",
  link: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2380083",
};
