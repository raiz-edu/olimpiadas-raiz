export type Segmento = "EFAI" | "EFAF" | "EM";

export type AreaSlug =
  | "matematica"
  | "astronomia"
  | "fisica"
  | "quimica"
  | "biologia"
  | "historia"
  | "geografia"
  | "linguistica"
  | "informatica"
  | "portugues"
  | "ciencias"
  | "stem"
  | "ambiente"
  | "economia"
  | "robotica"
  | "filosofia";

export type Fase = {
  nome: string;
  formato: string;
  data?: string;
  local: string;
};

export type OlimpiadaCatalogo = {
  sigla: string;
  nome: string;
  edicao?: string;
  area: string;
  areaSlug: AreaSlug;
  organizador: string;
  site: string;
  portalInscricao: string;
  usaPlanilha: boolean;
  segmentos: Segmento[];
  series: string;
  custo: string;
  gratuita: boolean;
  inscricoes: {
    periodo?: string;
    descricao: string;
    como: string;
  };
  fases: Fase[];
  premiacao: string[];
  notas?: string;
  avisoFases?: string;
};

export const AREA_CONFIG: Record<
  AreaSlug,
  { label: string; bg: string; text: string; border: string }
> = {
  matematica: {
    label: "Matemática",
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    border: "border-amber-400/30",
  },
  astronomia: {
    label: "Astronomia",
    bg: "bg-sky-400/10",
    text: "text-sky-400",
    border: "border-sky-400/30",
  },
  fisica: {
    label: "Física",
    bg: "bg-blue-400/10",
    text: "text-blue-400",
    border: "border-blue-400/30",
  },
  quimica: {
    label: "Química",
    bg: "bg-purple-400/10",
    text: "text-purple-400",
    border: "border-purple-400/30",
  },
  biologia: {
    label: "Biologia",
    bg: "bg-green-400/10",
    text: "text-green-400",
    border: "border-green-400/30",
  },
  historia: {
    label: "História",
    bg: "bg-orange-400/10",
    text: "text-orange-400",
    border: "border-orange-400/30",
  },
  geografia: {
    label: "Geografia",
    bg: "bg-teal-400/10",
    text: "text-teal-400",
    border: "border-teal-400/30",
  },
  linguistica: {
    label: "Linguística",
    bg: "bg-pink-400/10",
    text: "text-pink-400",
    border: "border-pink-400/30",
  },
  informatica: {
    label: "Informática",
    bg: "bg-indigo-400/10",
    text: "text-indigo-400",
    border: "border-indigo-400/30",
  },
  portugues: {
    label: "Português",
    bg: "bg-rose-400/10",
    text: "text-rose-400",
    border: "border-rose-400/30",
  },
  ciencias: {
    label: "Ciências",
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    border: "border-emerald-400/30",
  },
  stem: {
    label: "STEM",
    bg: "bg-violet-400/10",
    text: "text-violet-400",
    border: "border-violet-400/30",
  },
  ambiente: {
    label: "Meio Ambiente",
    bg: "bg-lime-400/10",
    text: "text-lime-400",
    border: "border-lime-400/30",
  },
  economia: {
    label: "Economia",
    bg: "bg-yellow-400/10",
    text: "text-yellow-400",
    border: "border-yellow-400/30",
  },
  robotica: {
    label: "Robótica",
    bg: "bg-cyan-400/10",
    text: "text-cyan-400",
    border: "border-cyan-400/30",
  },
  filosofia: {
    label: "Filosofia",
    bg: "bg-fuchsia-400/10",
    text: "text-fuchsia-400",
    border: "border-fuchsia-400/30",
  },
};

export const SEGMENTO_CONFIG: Record<Segmento, { label: string; bg: string; text: string }> = {
  EFAI: { label: "EFAI (1º–5º)", bg: "bg-emerald-400/10", text: "text-emerald-400" },
  EFAF: { label: "EFAF (6º–9º)", bg: "bg-blue-400/10", text: "text-blue-400" },
  EM: { label: "Ens. Médio", bg: "bg-purple-400/10", text: "text-purple-400" },
};

export const CATALOGO: OlimpiadaCatalogo[] = [
  {
    sigla: "OBA",
    nome: "Olimpíada Brasileira de Astronomia e Astronáutica",
    edicao: "29ª edição (2026)",
    area: "Astronomia",
    areaSlug: "astronomia",
    organizador: "Sociedade Astronômica Brasileira (SAB) — apoio MCTI/CNPq",
    site: "http://www.oba.org.br",
    portalInscricao: "https://app.oba.org.br",
    usaPlanilha: false,
    segmentos: ["EFAI", "EFAF", "EM"],
    series: "Nível 1: 1º–3º EF · Nível 2: 4º–5º EF · Nível 3: 6º–9º EF · Nível 4: Ensino Médio",
    custo: "Gratuita (pública e privada)",
    gratuita: true,
    inscricoes: {
      periodo: "23/02 a 01/05/2026 (encerradas)",
      descricao:
        "Inscrições encerradas em 01/05/2026. Mais de 1,5 milhão de participantes em 2025 (8,2% acima de 2024).",
      como: "Professor/escola cadastra-se em app.oba.org.br e inscreve as turmas. Não há lista nominal de alunos — a escola informa o total por nível.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato:
          "7 questões de Astronomia + 3 de Astronáutica (objetivas e dissertativas por nível)",
        data: "15/05/2026 (10h–15h)",
        local: "Na própria escola",
      },
      {
        nome: "Divulgação dos resultados",
        formato: "Site oficial",
        data: "Final de agosto de 2026",
        local: "Online",
      },
      {
        nome: "2ª Fase — Seletiva Internacional",
        formato: "~150 alunos selecionados; provas online + presencial",
        data: "Após divulgação dos resultados",
        local: "Polos regionais / nacional",
      },
    ],
    premiacao: [
      "Mais de 90.000 medalhas (ouro, prata, bronze, menção honrosa)",
      "Melhores da 2ª Fase representam o Brasil na IOAA (Olimpíada Internacional de Astronomia e Astrofísica)",
      "Certificados digitais para todos os participantes",
    ],
    notas:
      "29ª edição em 2026. Mais de 1,5 milhão de participantes em 2025 (8,2% acima de 2024). Seleciona os melhores para a IOAA (Olimpíada Internacional de Astronomia e Astrofísica).",
  },
  {
    sigla: "OBAFOG",
    nome: "Olimpíada Brasileira de Foguetes",
    edicao: "Edição 2026",
    area: "Astronomia",
    areaSlug: "astronomia",
    organizador: "Sociedade Astronômica Brasileira (SAB) / Agência Espacial Brasileira (AEB)",
    site: "http://www.oba.org.br",
    portalInscricao: "https://app.oba.org.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "6º ao 9º EF e Ensino Médio — equipes de até 3 alunos",
    custo: "Gratuita (registro unificado com a OBA)",
    gratuita: true,
    inscricoes: {
      periodo: "23/02 a 01/05/2026 (encerradas) — mesmo prazo da OBA",
      descricao:
        "Competição experimental realizada no mesmo dia da OBA (15/05). Registro unificado — escola inscrita na OBA participa automaticamente da OBAFOG.",
      como: "Inscrição via app.oba.org.br junto com a OBA. Equipes de até 3 alunos constroem e lançam foguetes com garrafa PET e materiais recicláveis.",
    },
    fases: [
      {
        nome: "Fase Escolar",
        formato: "Construção e lançamento de foguete PET na escola",
        data: "15/05/2026",
        local: "Na própria escola",
      },
      {
        nome: "Jornadas de Foguetes (Final Nacional)",
        formato: "As 3 melhores equipes por escola competem presencialmente",
        data: "Após divulgação dos resultados OBA",
        local: "Barra do Piraí (RJ)",
      },
    ],
    premiacao: [
      "As 3 melhores equipes por escola são convidadas para as Jornadas de Foguetes",
      "Certificados de participação para todas as equipes",
    ],
    notas:
      "Competição inteiramente experimental; alunos constroem foguetes com garrafas PET e materiais recicláveis. Incentiva engenharia, física aplicada e trabalho em equipe.",
  },
  {
    sigla: "OBMEP",
    nome: "Olimpíada Brasileira de Matemática das Escolas Públicas",
    edicao: "21ª edição (2026)",
    area: "Matemática",
    areaSlug: "matematica",
    organizador: "IMPA (Instituto de Matemática Pura e Aplicada) / SBM — apoio MCTI",
    site: "https://www.obmep.org.br",
    portalInscricao: "http://www.obmep.org.br/selecaoEscola.do",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "Nível 1: 6º–7º EF · Nível 2: 8º–9º EF · Nível 3: Ensino Médio",
    custo: "Escolas públicas: gratuita · Escolas privadas: a partir de R$ 200/nível",
    gratuita: false,
    inscricoes: {
      periodo: "04/02 a 16/03/2026 (encerradas)",
      descricao:
        "Inscrições encerradas em 16/03/2026. Boleto para escolas privadas: a partir de R$ 200 por nível (proporcional ao número de alunos).",
      como: "Escola realiza cadastro no obmep.org.br e inscreve os alunos por nível. Todos os alunos dos níveis correspondentes podem ser inscritos — sem seleção prévia. A lista de alunos é gerenciada pelo sistema.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "20 questões objetivas (cartão-resposta)",
        data: "09/06/2026",
        local: "Na própria escola",
      },
      {
        nome: "Divulgação dos classificados para 2ª Fase",
        formato: "Site oficial",
        data: "03/08/2026",
        local: "Online",
      },
      {
        nome: "Locais da 2ª Fase divulgados",
        formato: "Site oficial",
        data: "28/08/2026",
        local: "Online",
      },
      {
        nome: "2ª Fase",
        formato: "6 questões discursivas",
        data: "17/10/2026",
        local: "Locais externos (polos municipais)",
      },
      {
        nome: "Divulgação dos premiados",
        formato: "Site oficial",
        data: "15/12/2026",
        local: "Online",
      },
    ],
    premiacao: [
      "8.450 medalhas nacionais: 650 ouro, 1.950 prata, 5.850 bronze",
      "51.000 certificados de menção honrosa",
      "Mais de 20.000 medalhas estaduais",
      "Medalhistas nacionais de escolas públicas: convite para o Programa PIC Jr. (IMPA) com bolsa CNPq de R$ 300/mês por até 12 meses",
    ],
    notas:
      "Aberta a escolas privadas, mas premiações com bolsa CNPq são exclusivas para alunos de escolas públicas.",
  },
  {
    sigla: "OBMEP MIRIM",
    nome: "Olimpíada Mirim — OBMEP",
    edicao: "5ª edição (2026)",
    area: "Matemática",
    areaSlug: "matematica",
    organizador: "IMPA — mesma organização da OBMEP",
    site: "https://olimpiadamirim.obmep.org.br",
    portalInscricao: "https://olimpiadamirim.obmep.org.br",
    usaPlanilha: false,
    segmentos: ["EFAI"],
    series: "Mirim 1: 2º e 3º ano EF · Mirim 2: 4º e 5º ano EF",
    custo: "Escolas públicas: gratuita · Escolas privadas: taxa (consultar site)",
    gratuita: false,
    inscricoes: {
      periodo: "Até 08/06/2026",
      descricao:
        "Inscrições abertas até 08/06/2026. Mais de 15 milhões de participantes acumulados nas primeiras edições. Novidade 2026: lançamento da 1ª Olimpíada de Professores Mirim (inscrições 04 a 29/05/2026).",
      como: "Escola cadastra-se no site e informa o total de alunos por nível. Não há lista nominal prévia — os cartões-resposta são gerados no dia da prova.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "15 questões de múltipla escolha (classificatória)",
        data: "25/08/2026",
        local: "Na própria escola",
      },
      {
        nome: "2ª Fase",
        formato: "15 questões de múltipla escolha",
        data: "10/11/2026",
        local: "Na própria escola",
      },
    ],
    premiacao: [
      "Certificados digitais equivalentes a ouro, prata e bronze (sem medalhas físicas)",
      "Premiação também para professores participantes da edição especial docentes",
    ],
    notas:
      "Olimpíada especialmente desenhada para os anos iniciais do EF. 5ª edição em 2026. Excelente porta de entrada para a cultura olímpica desde cedo.",
  },
  {
    sigla: "OBM",
    nome: "Olimpíada Brasileira de Matemática",
    edicao: "47ª edição (2025/2026)",
    area: "Matemática",
    areaSlug: "matematica",
    organizador: "Associação Olimpíada Brasileira de Matemática (AOBM) / SBM",
    site: "https://www.obm.org.br",
    portalInscricao: "https://www.obm.org.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "Nível 1: 6º–7º EF · Nível 2: 8º–9º EF · Nível 3: Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Inscrição por convite, baseada em desempenho na OBMEP e em competições regionais. Competição discursiva de alto nível — prepara os melhores alunos brasileiros para olimpíadas internacionais.",
      como: "Alunos são convocados pelas comissões estaduais com base em resultados da OBMEP e de olimpíadas regionais. Não há inscrição direta.",
    },
    fases: [
      {
        nome: "Fase Estadual",
        formato: "Provas discursivas aplicadas pelos estados",
        data: "Ao longo do ano letivo",
        local: "Polos estaduais",
      },
      {
        nome: "Fase Nacional",
        formato: "Provas discursivas de alto nível",
        data: "Final do ano letivo",
        local: "Sede nacional (itinerante)",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Melhores integram a seleção para a IMO (Olimpíada Internacional de Matemática)",
      "Bolsas e prêmios acadêmicos",
    ],
    notas:
      "A OBM é a principal seletiva para a IMO. Diferente da OBMEP (escolas públicas, múltipla escolha), a OBM é aberta a todos e usa provas discursivas de maior dificuldade.",
    avisoFases:
      "As datas exatas das fases 2026 ainda não foram divulgadas oficialmente pela OBM. Verifique em obm.org.br antes de comunicar aos alunos.",
  },
  {
    sigla: "Canguru",
    nome: "Concurso Canguru de Matemática Brasil",
    edicao: "Edição 2026",
    area: "Matemática",
    areaSlug: "matematica",
    organizador:
      "Associação Canguru de Matemática Brasil (parceiro internacional: Association Kangourou sans Frontières)",
    site: "https://www.cangurudematematicabrasil.com.br",
    portalInscricao: "https://www.cangurudematematicabrasil.com.br",
    usaPlanilha: true,
    segmentos: ["EFAI", "EFAF", "EM"],
    series:
      "Nível P: 3º–4º EF · Nível E: 5º–6º EF · Nível B: 7º–8º EF · Nível C: 9º EF · Nível J: 1º–2º EM · Nível S: 3º EM",
    custo:
      "Escolas públicas: Pacote Padrão R$ 169 / Pacote VIP R$ 343 · Escolas privadas: Pacote Padrão R$ 419 / Pacote VIP R$ 787 (por escola, independente do número de alunos)",
    gratuita: false,
    inscricoes: {
      periodo: "01/12/2025 a 16/03/2026 (encerradas)",
      descricao:
        "Edição 2026 já realizada (prova em 19/03/2026). Inscrições abertas de dezembro a março. Próxima edição: abre inscrições em novembro de 2026.",
      como: "Escola realiza inscrição pelo sistema do Canguru informando o código MEC/INEP. A prova pode ser feita online ou presencialmente na escola. Taxa cobrada por escola (não por aluno).",
    },
    fases: [
      {
        nome: "Prova única",
        formato: "30 questões objetivas com 5 alternativas, 75 minutos",
        data: "19/03/2026",
        local: "Na escola (presencial ou online)",
      },
      {
        nome: "Lista de possíveis premiados",
        formato: "Divulgação online",
        data: "A definir",
        local: "Online",
      },
      {
        nome: "Resultados gerais",
        formato: "Divulgação online",
        data: "A definir",
        local: "Online",
      },
    ],
    premiacao: [
      "1% ouro, 2% prata, 3% bronze, 4% honra ao mérito — por nível, âmbito nacional",
      "Certificados digitais para todos",
      "Medalhas físicas disponíveis para compra pelas escolas",
    ],
    notas:
      "Concurso internacional com foco em raciocínio lógico-matemático e contexto lúdico. Não há eliminatórias — todos os inscritos fazem a prova única. Ideal como atividade de engajamento massivo. Para 2027, inscrições abrem em novembro de 2026.",
  },
  {
    sigla: "OBF",
    nome: "Olimpíada Brasileira de Física",
    edicao: "Edição 2026",
    area: "Física",
    areaSlug: "fisica",
    organizador: "Sociedade Brasileira de Física (SBF)",
    site: "https://www1.fisica.org.br/olimpiada/",
    portalInscricao: "https://app.graxaim.org/obf/2026",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series:
      "Júnior: 6º–7º EF · Nível I: 8º–9º EF · Nível II: 1ª–2ª série EM · Nível III: 3ª série EM",
    custo:
      "R$ 50 cadastro da escola + taxa por aluno por fase · Escolas públicas: isenção total disponível · OBFEP (só públicas): gratuita",
    gratuita: false,
    inscricoes: {
      periodo: "Encerradas (mar–mai/2026)",
      descricao:
        "Inscrições encerradas. A OBF tem duas modalidades paralelas: OBF geral (públicas e privadas, paga) e OBFEP — Olimpíada Brasileira de Física das Escolas Públicas (gratuita, exclusiva para públicas). Inscrições OBFEP: até 25/05/2026.",
      como: "Escola cadastra-se no site e inscreve os alunos nominalmente por nível. Para a OBFEP, inscrições via fisica.org.br/~obfep. A 1ª Fase da OBF ocorre online com janela de 4 horas; a OBFEP tem prova presencial.",
    },
    fases: [
      {
        nome: "OBF — 1ª Fase (online)",
        formato: "Janela de 4 horas entre 7h do dia 12/06 e 23h59 do dia 13/06",
        data: "12–13/06/2026",
        local: "Online (escola ou casa)",
      },
      {
        nome: "OBF — 2ª Fase (presencial)",
        formato: "Questões discursivas, 13h30–17h30",
        data: "15/08/2026",
        local: "Polos estaduais",
      },
      {
        nome: "OBFEP — 1ª Fase (presencial)",
        formato: "Questões objetivas",
        data: "12/08/2026",
        local: "Polo estadual",
      },
      {
        nome: "OBFEP — 2ª Fase (presencial + experimental)",
        formato: "Questões discursivas + avaliação experimental",
        data: "31/10/2026",
        local: "Polo estadual",
      },
    ],
    premiacao: [
      "Medalhas de ouro, prata e bronze por nível",
      "Cerimônias estaduais de premiação",
      "Medalhistas do Nível III integram a seleção para a IPhO (Olimpíada Internacional de Física)",
    ],
    notas:
      "A OBFEP (fisica.org.br/~obfep) é exclusiva para alunos de escolas públicas e totalmente gratuita. Para escolas privadas, a participação é pela OBF geral com as taxas indicadas.",
  },
  {
    sigla: "OBI",
    nome: "Olimpíada Brasileira de Informática",
    edicao: "Edição 2026",
    area: "Informática",
    areaSlug: "informatica",
    organizador: "SBC (Sociedade Brasileira de Computação) + IC-Unicamp",
    site: "https://olimpiada.ic.unicamp.br",
    portalInscricao: "https://olimpiada.ic.unicamp.br",
    usaPlanilha: false,
    segmentos: ["EFAI", "EFAF", "EM"],
    series:
      "Iniciação Júnior: 4º–5º EF · Iniciação 1: 6º–7º EF · Iniciação 2: 8º–9º EF · Programação Júnior: até 8º EF · Programação Sênior: 9º EF ao 3º EM",
    custo: "Gratuita (inscrição por escola, sem taxa)",
    gratuita: true,
    inscricoes: {
      periodo:
        "Abertura 06/03/2026 · Iniciação: competidores até 26/05 · Programação: escolas até 06/06, competidores até 08/06",
      descricao:
        "Duas modalidades: Iniciação (sem programação prévia, lógica e papel) e Programação (exige computador por participante). Há também a CF-OBI — Competição Feminina (inscrições de escolas até 08/09, competidoras até 09/09/2026). IOI 2026 em Tashkent, Uzbequistão (09–16/08).",
      como: "Escola cadastra-se no site e inscreve alunos por modalidade e nível. Modalidade Iniciação: alunos resolvem questões de lógica sem computador. Modalidade Programação: alunos escrevem programas num computador.",
    },
    fases: [
      {
        nome: "Fase 1 — Iniciação (Local)",
        formato: "Prova presencial de lógica e raciocínio computacional",
        data: "27–29/05/2026",
        local: "Escola / polo local",
      },
      {
        nome: "Fase 1 — Programação (Local)",
        formato: "Prova presencial de programação",
        data: "10–12/06/2026",
        local: "Escola / polo local",
      },
      {
        nome: "Fase 2 — Iniciação (Estadual)",
        formato: "Prova presencial",
        data: "06–07/08/2026",
        local: "Polo estadual",
      },
      {
        nome: "Fase 2 — Programação (Estadual)",
        formato: "Prova presencial",
        data: "20–21/08/2026",
        local: "Polo estadual",
      },
      {
        nome: "Fase 3 — Iniciação (Nacional)",
        formato: "Prova presencial, 10h–12h",
        data: "26/09/2026",
        local: "IC-Unicamp, Campinas (SP)",
      },
      {
        nome: "Fase 3 — Programação (Nacional)",
        formato: "Prova presencial, 8h–18h",
        data: "03/10/2026",
        local: "IC-Unicamp, Campinas (SP)",
      },
      {
        nome: "CF-OBI — Competição Feminina",
        formato: "Prova presencial",
        data: "11/09/2026",
        local: "Polo nacional",
      },
      {
        nome: "Semana Olímpica",
        formato: "Cursos, treinamentos e premiação",
        data: "29/11 a 05/12/2026",
        local: "IC-Unicamp, Campinas (SP)",
      },
    ],
    premiacao: [
      "Medalhas de ouro, prata e bronze por modalidade e nível",
      "Classificados convidados para a Semana Olímpica no IC-Unicamp",
      "Medalhistas de Programação Sênior integram a seleção para a IOI 2026 (Tashkent, Uzbequistão)",
    ],
    notas:
      "Modalidade Iniciação: ideal para alunos sem experiência com computação — exige apenas lógica e raciocínio. CF-OBI é a competição feminina, com inscrições em setembro.",
  },
  {
    sigla: "OBR",
    nome: "Olimpíada Brasileira de Robótica",
    edicao: "Edição 2026",
    area: "Robótica",
    areaSlug: "robotica",
    organizador: "RoboCup Brasil — apoio MCTI/CNPq",
    site: "https://obr.robocup.org.br",
    portalInscricao: "https://obr.robocup.org.br",
    usaPlanilha: false,
    segmentos: ["EFAI", "EFAF", "EM"],
    series: "Categoria 1 (6–10 anos), Categoria 2 (11–14 anos), Categoria 3 (15–19 anos)",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Mais de 220 mil participantes em 2025. Duas modalidades: Teórica (prova individual) e Prática (equipe constrói robô de resgate ou dança). Fases regional/estadual e final nacional.",
      como: "Inscrição via obr.robocup.org.br por professor responsável. Modalidade teórica: individual. Modalidade prática: equipes de 2–4 alunos.",
    },
    fases: [
      {
        nome: "Fase Regional/Estadual",
        formato: "Prova teórica + eliminatórias práticas",
        data: "Primeiro semestre",
        local: "Polos regionais",
      },
      {
        nome: "Final Nacional",
        formato: "Competição prática presencial",
        data: "Segundo semestre",
        local: "Sede nacional (itinerante)",
      },
    ],
    premiacao: [
      "Medalhas e troféus por modalidade e categoria",
      "Melhor equipe prática representa o Brasil na RoboCup (competição internacional)",
      "Certificados para todos os participantes",
    ],
    notas:
      "Uma das maiores olimpíadas de STEM do Brasil. Modalidade Prática inclui Robótica de Resgate (robô autônomo em labirinto) e Robótica Artística (dança coreografada).",
  },
  {
    sigla: "ONIA",
    nome: "Olimpíada Nacional de Inteligência Artificial",
    edicao: "2ª edição (2025/2026)",
    area: "Informática",
    areaSlug: "informatica",
    organizador: "EduSpace / H2IA UFPel / Instituto IA LNCC",
    site: "https://www.oniabrasil.com.br",
    portalInscricao: "https://www.oniabrasil.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "Categoria Junior: 5º ao 9º EF · Categoria Sênior: Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Seleciona os representantes do Brasil para a IOAI (Olimpíada Internacional de Inteligência Artificial). Quatro fases totalmente online e gratuitas.",
      como: "Inscrição individual via oniabrasil.com.br. Não é necessário conhecimento prévio de programação — a olimpíada ensina os conceitos ao longo das fases.",
    },
    fases: [
      {
        nome: "1ª Fase — Conceitos de IA",
        formato: "Prova online de múltipla escolha",
        data: "Primeiro semestre",
        local: "Online",
      },
      {
        nome: "2ª Fase — Aplicações de IA",
        formato: "Prova online com problemas práticos",
        data: "Primeiro semestre",
        local: "Online",
      },
      {
        nome: "3ª Fase — Final Nacional",
        formato: "Prova avançada online",
        data: "Segundo semestre",
        local: "Online",
      },
      {
        nome: "Seletiva Internacional (IOAI)",
        formato: "Prova presencial",
        data: "Segundo semestre",
        local: "A definir",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Melhores integram a seleção para a IOAI (Olimpíada Internacional de IA)",
    ],
    notas:
      "Única seletiva brasileira para a IOAI. Foco em conceitos de machine learning, redes neurais e ética em IA — sem exigir programação avançada.",
  },
  {
    sigla: "OBQ",
    nome: "Olimpíada Brasileira de Química",
    edicao: "Edição 2026 (novo regulamento)",
    area: "Química",
    areaSlug: "quimica",
    organizador:
      "ABQ (Associação Brasileira de Química); coordenação por universidades federais (UFC, UFPI)",
    site: "https://obquimica.org",
    portalInscricao: "https://inscricoes.obquimica.org",
    usaPlanilha: false,
    segmentos: ["EM"],
    series: "Modalidade A: 1ª e 2ª série EM · Modalidade B: 3ª série EM",
    custo:
      "Gratuita para inscrição · Recurso sobre gabarito: R$ 75/questão (isento para escolas públicas)",
    gratuita: true,
    inscricoes: {
      periodo: "Até 29/05/2026",
      descricao:
        "Novo regulamento aprovado em novembro de 2025, em vigor a partir de 2026. Inscrição automática para medalhistas de ouro do ano anterior. Mínimo de 20 vagas para escolas públicas garantido por estado.",
      como: "Professor responsável inscreve a escola e os alunos via site obquimica.org. Inscrição coordenada por estado.",
    },
    fases: [
      {
        nome: "Fase Estadual",
        formato: "Seletiva estadual",
        data: "Antes de 29/05/2026",
        local: "Polo estadual",
      },
      {
        nome: "Prova Nacional",
        formato: "Prova discursiva, 4 horas, presencial",
        data: "28/08/2026",
        local: "Polo nacional / universidade parceira",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Diploma de Honra ao Mérito (todos os aprovados) e Diploma de Mérito Educacional (medalhistas de ouro, chancelado por UFC/UFPI)",
      "Cerimônia em Fortaleza (geralmente novembro)",
      "Melhores integram a seleção para a IChO (Olimpíada Internacional de Química)",
    ],
    notas:
      "Novo regulamento 2026 inclui vagas garantidas para escolas públicas por estado. Para alunos do EF, ver OBQJr.",
  },
  {
    sigla: "OBQJr",
    nome: "Olimpíada Brasileira de Química Júnior",
    edicao: "Edição 2026",
    area: "Química",
    areaSlug: "quimica",
    organizador: "ABQ (Associação Brasileira de Química) — mesma organização da OBQ",
    site: "https://obqjr.obquimica.org",
    portalInscricao: "https://obqjr.obquimica.org",
    usaPlanilha: false,
    segmentos: ["EFAF"],
    series: "6º ao 9º ano do EF",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      periodo: "Maio a agosto de 2026",
      descricao:
        "Voltada exclusivamente para o Ensino Fundamental Anos Finais. Calendário separado da OBQ. Novo regulamento 2026 inclui vagas garantidas para escolas públicas por estado.",
      como: "Professor responsável inscreve a escola e os alunos via obqjr.obquimica.org. Inscrição coordenada por estado.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "Prova objetiva",
        data: "Junho 2026",
        local: "Na escola / polo estadual",
      },
      {
        nome: "2ª Fase",
        formato: "Prova",
        data: "Agosto 2026",
        local: "Polo estadual",
      },
    ],
    premiacao: ["Medalhas ouro, prata, bronze", "Diploma de Honra ao Mérito (todos os aprovados)"],
    notas:
      "Olimpíada de Química voltada para o EFAF (6º ao 9º ano), com calendário independente da OBQ (Ensino Médio).",
  },
  {
    sigla: "OBBio",
    nome: "Olimpíada Brasileira de Biologia",
    edicao: "22ª edição (2026)",
    area: "Biologia",
    areaSlug: "biologia",
    organizador: "Instituto Butantan + ESIB",
    site: "https://olimpiadasdebiologia.butantan.gov.br",
    portalInscricao: "https://obb-sistema.butantan.gov.br/cadastro",
    usaPlanilha: false,
    segmentos: ["EM"],
    series: "Qualquer série do Ensino Médio (escolas públicas e privadas)",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      periodo: "15/01 a 25/02/2026 (encerradas)",
      descricao:
        "Inscrições encerradas em 25/02/2026. Competição já em fase avançada. Escola baixa a prova digitalmente e aplica internamente — sem deslocamento dos alunos nas primeiras fases.",
      como: "Escola realiza cadastro no site e inscreve os alunos nominalmente. A prova da 1ª Fase é enviada por e-mail para a escola aplicar no dia marcado.",
    },
    fases: [
      {
        nome: "Fase 1",
        formato: "25 questões múltipla escolha, 1h30 (download da prova em 02/03)",
        data: "03/03/2026",
        local: "Na própria escola",
      },
      {
        nome: "Fase 2",
        formato: "30 questões múltipla escolha (conteúdo aprofundado)",
        data: "A definir",
        local: "Na escola",
      },
      {
        nome: "Fase 3",
        formato: "25 questões verdadeiro/falso (formato internacional) via software, 2 horas",
        data: "14/04/2026",
        local: "Na escola (via software)",
      },
      {
        nome: "Seletiva Internacional — Virtual",
        formato: "Provas e atividades online",
        data: "07–08/05/2026",
        local: "Online",
      },
      {
        nome: "Seletiva Internacional — Presencial",
        formato: "Atividades práticas e teóricas em laboratório",
        data: "11–16/05/2026",
        local: "Instituto Butantan, São Paulo (SP)",
      },
    ],
    premiacao: [
      "Top 20 participam da Seletiva Internacional no Instituto Butantan (SP)",
      "Top 4 representam o Brasil na IBO (Olimpíada Internacional de Biologia) 2026",
      "5º ao 8º lugar: OIAB (Olimpíada Ibero-americana de Biologia)",
    ],
    notas:
      "Uma das maiores olimpíadas do Brasil. Foco exclusivo no Ensino Médio. A 3ª Fase usa software especializado e o formato de questões V/F simula o padrão da IBO (internacional).",
  },
  {
    sigla: "OBBiotec",
    nome: "Olimpíada Brasileira de Biotecnologia",
    edicao: "4ª edição (2026)",
    area: "Biologia",
    areaSlug: "biologia",
    organizador: "UFVJM — apoio CNPq",
    site: "https://www.obbiotec.com.br",
    portalInscricao: "https://www.obbiotec.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "8º e 9º ano do EF e Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Aborda biotecnologia, biologia molecular e suas aplicações na saúde, agropecuária e meio ambiente. Organizada pela UFVJM com apoio do CNPq.",
      como: "Inscrição via obbiotec.com.br por professor responsável ou individualmente.",
    },
    fases: [
      {
        nome: "1ª Fase — Online",
        formato: "Prova objetiva online",
        data: "Primeiro semestre",
        local: "Online",
      },
      {
        nome: "2ª Fase — Online",
        formato: "Prova objetiva avançada",
        data: "Segundo semestre",
        local: "Online",
      },
    ],
    premiacao: ["Medalhas ouro, prata, bronze", "Certificados de participação"],
    notas:
      "Olimpíada focada em biotecnologia aplicada — DNA recombinante, transgênicos, biocombustíveis, terapia gênica. Incentiva vocações para as ciências biológicas e da saúde.",
  },
  {
    sigla: "OBN",
    nome: "Olimpíada Brasileira de Neurociências",
    edicao: "14ª edição (2026)",
    area: "Ciências",
    areaSlug: "ciencias",
    organizador: "Sociedade Brasileira de Neurociências (SBNeC) e afiliadas",
    site: "https://brazilianbrainbee.org",
    portalInscricao: "https://brazilianbrainbee.org",
    usaPlanilha: false,
    segmentos: ["EM"],
    series: "Ensino Médio (14 a 19 anos)",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Seleciona o campeão brasileiro para a International Brain Bee (IBB). Modelo baseado na competição mundial; aborda neuroanatomia, neurologia clínica, fisiologia e neurociência comportamental.",
      como: "Inscrição via brazilianbrainbee.org. Fases local (em polos universitários) e final nacional.",
    },
    fases: [
      {
        nome: "Fase Local",
        formato: "Prova teórica em polo universitário parceiro",
        data: "Primeiro semestre",
        local: "Polos universitários em diversas cidades",
      },
      {
        nome: "Final Nacional",
        formato: "Prova teórica presencial",
        data: "Segundo semestre",
        local: "Sede nacional",
      },
    ],
    premiacao: [
      "Campeão nacional representa o Brasil na International Brain Bee",
      "Medalhas e certificados",
    ],
    notas:
      "A única olimpíada brasileira de neurociências para o EM. Seletiva para a IBB (International Brain Bee), competição realizada anualmente em diferentes países.",
  },
  {
    sigla: "OBG",
    nome: "Olimpíada Brasileira de Geografia",
    edicao: "11ª edição (2026)",
    area: "Geografia",
    areaSlug: "geografia",
    organizador: "IFRN e universidades parceiras",
    site: "https://obgeografia.com.br",
    portalInscricao: "http://sistema.obgeografia.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "9º ano EF ao 3º (ou 4º) ano EM · Equipes de 3 alunos da mesma escola",
    custo: "Escolas públicas: gratuita · Escolas privadas: R$ 65 por equipe",
    gratuita: false,
    inscricoes: {
      periodo: "09/04 a 19/06/2026",
      descricao:
        "Inscrições abertas até 19/06/2026. Modalidade em equipes de 3 alunos + 1 professor orientador. Escolas privadas: R$ 65 por equipe.",
      como: "Professor cria conta no site obgeografia.com.br, inscreve a escola e forma equipes de 3 alunos. As fases online são realizadas coletivamente pela equipe dentro das janelas de datas.",
    },
    fases: [
      {
        nome: "Fase 1 Online",
        formato: "Prova estadual online (equipe)",
        data: "04–06/08/2026",
        local: "Online",
      },
      {
        nome: "Fase 2 Online",
        formato: "Prova online (equipe)",
        data: "11–13/08/2026",
        local: "Online",
      },
      {
        nome: "Fase 3 Online",
        formato: "Prova online (equipe)",
        data: "18–19/08/2026",
        local: "Online",
      },
      {
        nome: "Classificados para a Final",
        formato: "Divulgação",
        data: "01/09/2026",
        local: "Online",
      },
      {
        nome: "Fase Final Presencial",
        formato: "Prova presencial individual + equipe",
        data: "Última semana de novembro/2026",
        local: "Sede nacional designada",
      },
    ],
    premiacao: [
      "Certificados e medalhas para os classificados",
      "Melhores equipes representam o Brasil na iGeo (Olimpíada Internacional de Geografia)",
      "Vagas olímpicas em USP, Unesp, Unicamp, Unifei para medalhistas",
    ],
    notas:
      "Modalidade em equipes de 3 alunos — diferente da maioria das olimpíadas. As fases online ocorrem em janelas de datas, e a equipe resolve junto remotamente.",
  },
  {
    sigla: "OBCT",
    nome: "Olimpíada Brasileira de Ciências da Terra",
    edicao: "Edição 2025/2026",
    area: "Ciências",
    areaSlug: "ciencias",
    organizador: "UNIFAL-MG / UNICAMP — realizada em conjunto com a OBG",
    site: "https://obgeografia.org",
    portalInscricao: "https://obgeografia.org",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "9º ano do EF e Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Realizada em conjunto com a OBG (Olimpíada Brasileira de Geografia). Foca em geologia, pedologia, paleontologia, meteorologia e ciências ambientais.",
      como: "Inscrição via obgeografia.org junto com a OBG. Escola inscrita na OBG pode participar da OBCT no mesmo processo.",
    },
    fases: [
      {
        nome: "1ª Fase — Online",
        formato: "Prova objetiva online",
        data: "Primeiro semestre",
        local: "Online",
      },
      {
        nome: "2ª Fase — Presencial",
        formato: "Prova discursiva presencial",
        data: "Segundo semestre",
        local: "Sede nacional",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Melhores integram a seleção para a IESO (Olimpíada Internacional de Ciências da Terra)",
    ],
    notas:
      "Seletiva para a IESO (International Earth Science Olympiad). Realizada em conjunto com a OBG no mesmo portal e calendário.",
  },
  {
    sigla: "ONHB",
    nome: "Olimpíada Nacional em História do Brasil",
    edicao: "18ª edição (2026)",
    area: "História",
    areaSlug: "historia",
    organizador: "UNICAMP (Depto. de História) + ANPUH + CNPq + MCTI",
    site: "https://www.olimpiadadehistoria.com.br",
    portalInscricao: "https://inscricoes.olimpiadadehistoria.com.br/inscricoes/onhb_18/new",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "7º ao 9º ano EF · 1º ao 3º ano EM · Equipes de 3 alunos + 1 professor de História",
    custo:
      "Escolas públicas: gratuita · Escolas privadas: R$ 90/equipe (até 13/03) ou R$ 130/equipe (14/03 a 24/04)",
    gratuita: false,
    inscricoes: {
      periodo: "15/02 a 24/04/2026",
      descricao:
        "Inscrições: públicas gratuitas. Privadas: R$ 90 (1º período, até 13/03) ou R$ 130 (2º período, até 24/04) por equipe. Equipes de 3 alunos + professor orientador formado em História.",
      como: "Professor cria conta no site, inscreve a escola e cadastra equipes de 3 alunos + 1 professor orientador. O professor precisa ser formado em História.",
    },
    fases: [
      {
        nome: "Fases 1 e 2 Online",
        formato: "Questões objetivas + tarefas colaborativas (equipe)",
        data: "04/05/2026",
        local: "Online",
      },
      {
        nome: "Fase 3 Online",
        formato: "Questões + tarefas",
        data: "18–23/05/2026",
        local: "Online",
      },
      {
        nome: "Fase 4 Online",
        formato: "Questões + tarefas",
        data: "25–30/05/2026",
        local: "Online",
      },
      {
        nome: "Fase 5 Online",
        formato: "Questões + tarefas",
        data: "08–13/06/2026",
        local: "Online",
      },
      {
        nome: "Classificados para a Final",
        formato: "Divulgação",
        data: "19/06/2026",
        local: "Online",
      },
      { nome: "Medalhistas estaduais", formato: "Divulgação", data: "26/06/2026", local: "Online" },
      {
        nome: "Grande Final Presencial",
        formato: "Prova dissertativa (300 equipes)",
        data: "29/08/2026",
        local: "UNICAMP, Campinas (SP)",
      },
      {
        nome: "Cerimônia de Premiação",
        formato: "Entrega de medalhas",
        data: "30/08/2026",
        local: "UNICAMP, Campinas (SP)",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze para melhores equipes da final",
      "Vagas Olímpicas Unicamp: medalhistas habilitados a ingressar na Unicamp sem vestibular (~90 vagas)",
      "Bolsas IC Jr. CNPq de R$ 300/mês por 12 meses para alunos de escolas públicas premiados",
    ],
    notas:
      "Fases online semanais consecutivas exigem comprometimento durante semanas seguidas. A presença de professor formado em História é obrigatória. Valor atualizado para 2026: R$ 90 (inscrição antecipada) ou R$ 130 (período normal).",
  },
  {
    sigla: "OBL",
    nome: "Olimpíada Brasileira de Linguística",
    edicao: "14ª edição — ciclo 2025–2026 (Ojidu)",
    area: "Linguística",
    areaSlug: "linguistica",
    organizador: "Comissão da OBL (universidades brasileiras de Linguística)",
    site: "https://obling.org",
    portalInscricao: "https://app.obling.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "Categoria Mirim: EF · Categoria Regular: EF e EM · Categoria Aberta: qualquer pessoa",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      periodo: "Fases competitivas da 14ª edição ocorreram em 2025",
      descricao:
        "A 14ª edição (tema Ojidu — palavra warou para buriti) é um ciclo 2025-2026. As fases F1 e F2 foram realizadas em 2025. Em 2026 ocorrem: ELO (Escola de Linguística) em fev/mar/abr, seleção da delegação em abril, treinamento até julho, e a IOL em Bucareste (Romênia) em julho de 2026. A 15ª edição ainda não foi anunciada.",
      como: "Inscrição individual pelo estudante via obling.org (sem mediação obrigatória da escola). A nova edição abrirá inscrições quando anunciada — acompanhe o site oficial.",
    },
    fases: [
      {
        nome: "15ª ELO — Escola de Linguística",
        formato: "Atividades avançadas para melhores da Cat. Regular",
        data: "Fevereiro–Abril 2026",
        local: "Polo nacional",
      },
      {
        nome: "Seleção da delegação internacional",
        formato: "Processo seletivo",
        data: "Abril 2026",
        local: "Online / nacional",
      },
      {
        nome: "Treinamento da delegação",
        formato: "Preparação intensiva",
        data: "Maio–Julho 2026",
        local: "Nacional",
      },
      {
        nome: "IOL 2026 — Olimpíada Internacional de Linguística",
        formato: "Competição internacional",
        data: "Final de julho 2026",
        local: "Bucareste, Romênia",
      },
    ],
    premiacao: [
      "Insígnias simbólicas: pedra, argila, papiro, pergaminho (em lugar de medalhas convencionais)",
      "Certificados de participação",
      "Categoria Regular: classificação para a ELO e representação do Brasil na IOL",
    ],
    notas:
      "Olimpíada única: não exige conhecimento específico de Português ou outras línguas — avalia raciocínio sobre estruturas linguísticas. Qualquer aluno, de qualquer área, pode participar. A 15ª edição será anunciada no site oficial.",
    avisoFases:
      "O calendário da edição 2025-2026 está em atualização. As datas das fases podem estar incompletas — consulte obling.org para informações oficiais antes de comunicar aos alunos.",
  },
  {
    sigla: "ONFIL",
    nome: "Olimpíada Nacional de Filosofia",
    edicao: "3ª edição (2025/2026)",
    area: "Filosofia",
    areaSlug: "filosofia",
    organizador: "UFSM — financiamento MCTI/CNPq; rede de universidades parceiras",
    site: "https://onfilbr.org",
    portalInscricao: "https://onfilbr.org",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "EF Anos Finais e Ensino Médio (até 19 anos)",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Única seletiva brasileira para a IPO (Olimpíada Internacional de Filosofia). Prova de redação filosófica em português. Fases escolar, regional e nacional.",
      como: "Inscrição via onfilbr.org por professor responsável ou individualmente.",
    },
    fases: [
      {
        nome: "Fase Escolar",
        formato: "Redação filosófica (tema dado no dia)",
        data: "Primeiro semestre",
        local: "Na escola",
      },
      {
        nome: "Fase Regional",
        formato: "Redação filosófica",
        data: "Segundo semestre",
        local: "Polos regionais",
      },
      {
        nome: "Final Nacional",
        formato: "Redação filosófica de alto nível",
        data: "Final do ano",
        local: "Sede nacional",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Melhores representam o Brasil na IPO (Olimpíada Internacional de Filosofia)",
    ],
    notas:
      "A ONFIL é a única competição nacional de filosofia com vínculo institucional universitário e seletiva para olimpíada internacional.",
  },
  {
    sigla: "OBS",
    nome: "Olimpíada Brasileira de Sociologia",
    edicao: "1ª edição (2026)",
    area: "História",
    areaSlug: "historia",
    organizador: "Sociedade Brasileira de Sociologia (SBS) e parceiros",
    site: "https://olimpiadadesociologia.com.br",
    portalInscricao: "https://olimpiadadesociologia.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "8º e 9º ano do EF e Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "1ª edição em 2026. Competição em equipes de três alunos + professor orientador. Cinco fases (três virtuais + duas presenciais no RJ). Inclui vídeos, jogos de tabuleiro e projetos de intervenção social.",
      como: "Inscrição via olimpiadadesociologia.com.br por professor responsável. Equipes de 3 alunos.",
    },
    fases: [
      {
        nome: "Fases Virtuais (1ª a 3ª)",
        formato: "Vídeo, jogo de tabuleiro, projeto de intervenção social",
        data: "Primeiro e segundo semestre",
        local: "Online",
      },
      {
        nome: "Semifinal Presencial",
        formato: "Apresentação de projeto",
        data: "Segundo semestre",
        local: "Rio de Janeiro (RJ)",
      },
      {
        nome: "Final Presencial",
        formato: "Apresentação final + cerimônia",
        data: "Final do ano",
        local: "Rio de Janeiro (RJ)",
      },
    ],
    premiacao: [
      "Medalhas e troféus para os finalistas",
      "Certificados para todos os participantes",
    ],
    notas:
      "1ª olimpíada brasileira de sociologia com abrangência nacional. Aborda sociologia, antropologia e ciência política por meio de projetos de impacto social.",
  },
  {
    sigla: "ONC",
    nome: "Olimpíada Nacional de Ciências",
    edicao: "Edição 2026",
    area: "Ciências",
    areaSlug: "ciencias",
    organizador: "SBF, ABQ, Instituto Butantan, SAB e Unicamp — apoio MCTI",
    site: "https://www.onciencias.org",
    portalInscricao: "https://app.onciencias.org",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "6º ao 9º ano EF · Ensino Médio",
    custo: "Consultar site (verificar valor atual em onciencias.org)",
    gratuita: false,
    inscricoes: {
      periodo: "01/04 a 10/08/2026",
      descricao:
        "Inscrições abertas até 10/08/2026. Prova abrange Astronomia, Biologia, Física, História e Química de forma interdisciplinar. Inscrição feita pelas escolas.",
      como: "Escola realiza inscrição no site onciencias.org e inscreve alunos por nível. A prova pode ser aplicada online ou impressa, conforme definição da escola.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "Questões objetivas (online ou impresso)",
        data: "13–15/08/2026",
        local: "Na escola",
      },
      {
        nome: "2ª Fase",
        formato: "Questões discursivas / experimentais",
        data: "10–11/09/2026",
        local: "Polo regional",
      },
      { nome: "Resultados finais", formato: "Divulgação", data: "02/10/2026", local: "Online" },
    ],
    premiacao: ["Medalhas ouro, prata, bronze", "Cerimônia nacional de premiação"],
    notas:
      "Caráter interdisciplinar: Astronomia, Biologia, Física, História e Química integradas num único contexto temático. Organizada pelas sociedades científicas das principais áreas.",
  },
  {
    sigla: "OP",
    nome: "Olimpíada de Português",
    edicao: "4ª edição (2026)",
    area: "Português",
    areaSlug: "portugues",
    organizador: "Olimpíada de Português — entidade própria",
    site: "https://olimpiadadeportugues.org",
    portalInscricao: "https://olimpiadadeportugues.org/area-da-escola/op",
    usaPlanilha: false,
    segmentos: ["EFAI", "EFAF", "EM"],
    series:
      "OP bê-á-bá: 1º–5º EF · Categoria C: 6º–7º EF · Categoria B: 8º–9º EF · Categoria A: Ensino Médio",
    custo:
      "Escolas públicas: R$ 135 (1–40 alunos) a R$ 475 (161–200 alunos) · Escolas privadas: R$ 220 (1–40 alunos) a R$ 700 (161–200 alunos)",
    gratuita: false,
    inscricoes: {
      periodo: "19/01 a 08/05/2026 (encerradas)",
      descricao:
        "4ª edição. A 3ª edição teve mais de 750.000 participantes na 1ª Fase. Inclui a OP bê-á-bá (EFAI, 1º ao 5º ano), lançada como nova modalidade em 2026. Taxa cobrada por escola, por faixa de número de alunos.",
      como: "Escola acessa o site e inscreve os alunos por categoria. Há dois períodos de inscrição: período 1 (19/01–13/03) com valor reduzido e período 2 (14/03–08/05) com valor padrão.",
    },
    fases: [
      {
        nome: "1ª Fase",
        formato: "25 questões objetivas",
        data: "21–23/05/2026",
        local: "Na escola",
      },
      {
        nome: "2ª Fase",
        formato: "Prova presencial",
        data: "27/08/2026",
        local: "Polos de Aplicação",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze por categoria",
      "~15% dos participantes de cada tipo de escola recebem medalha",
    ],
    notas:
      "Há duas olimpíadas distintas no mesmo site: OP bê-á-bá (EFAI, 1º ao 5º ano) e OP (EFAF e EM). Inscrições e taxas são separadas por categoria. A taxa é por escola (não por aluno individual).",
  },
  {
    sigla: "OBICT",
    nome: "Olimpíada Brasileira de Inovação, Ciência e Tecnologia",
    edicao: "3ª edição (2026)",
    area: "STEM",
    areaSlug: "stem",
    organizador: "OBICT (IPT e parceiros)",
    site: "https://www.obict.com.br",
    portalInscricao: "https://olimpico.eduspace.com.br/users/sign_up",
    usaPlanilha: false,
    segmentos: ["EFAI", "EFAF", "EM"],
    series:
      "Categoria 1: 1º–5º EF (sem caráter eliminatório) · Categoria 2: 6º–9º EF · Categoria 3: Ensino Médio / Técnico",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      periodo: "20/02 a 05/04/2026 (encerradas)",
      descricao:
        "3ª edição. Inscrições gratuitas pelo site obict.com.br ou app 'Olímpico EduSpace' (iOS/Android). Categoria 1 (EFAI): foco educativo, sem caráter eliminatório. Prêmio especial 'Meninas na III OBICT' para as 10 melhores participantes femininas das Categorias 2 e 3.",
      como: "Escola ou aluno acessa o site ou o app Olímpico EduSpace e realiza a inscrição gratuita. A inscrição pode ser feita individualmente pelo aluno, sem necessidade de cadastro institucional da escola.",
    },
    fases: [
      {
        nome: "1ª Fase Digital",
        formato: "Questões no app Olímpico EduSpace ou formulário online",
        data: "23/03 a 12/04/2026",
        local: "Online",
      },
      {
        nome: "2ª Fase Digital",
        formato: "Questões online",
        data: "11–24/05/2026",
        local: "Online",
      },
      {
        nome: "3ª Fase Presencial",
        formato: "Prova presencial",
        data: "05/06/2026",
        local: "Polo nacional",
      },
      {
        nome: "4ª Fase Final",
        formato: "Prova final presencial",
        data: "A definir",
        local: "Polo nacional",
      },
    ],
    premiacao: [
      "Certificados digitais para todos os participantes",
      "Honra ao mérito ouro, prata, bronze para os melhores",
      "Prêmio especial 'Meninas na III OBICT' para as 10 melhores participantes femininas (Cat. 2 e 3)",
    ],
    notas:
      "Foco em STEM integrado. Categoria 1 (EFAI) tem caráter educativo, sem eliminação. 3ª edição em 2026.",
  },
  {
    sigla: "OBSMA",
    nome: "Olimpíada Brasileira de Saúde e Meio Ambiente",
    edicao: "13ª edição (2026)",
    area: "Meio Ambiente",
    areaSlug: "ambiente",
    organizador: "Fiocruz (Fundação Oswaldo Cruz)",
    site: "https://olimpiada.fiocruz.br",
    portalInscricao: "https://obsma.fiocruz.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "6º–9º EF · Ensino Médio · EJA · Ensino Técnico",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      periodo: "Abertas até 30/06/2026",
      descricao:
        "Inscrições abertas até 30/06/2026 (23h59, horário de Brasília). Modalidades: Produção Audiovisual (vídeos até 10 min), Projeto de Ciências ou Produção de Texto (até 10 páginas). Projetos realizados entre 01/01/2025 e 30/06/2026 são válidos.",
      como: "Professor responsável acessa obsma.fiocruz.br e cadastra a escola. Os alunos desenvolvem o projeto ao longo do ano e o professor submete no prazo. Não é uma prova — é submissão de projeto.",
    },
    fases: [
      {
        nome: "Desenvolvimento do Projeto",
        formato: "Projeto em sala: audiovisual, texto ou ciências",
        data: "Jan/2025 a Jun/2026",
        local: "Na escola",
      },
      {
        nome: "Submissão do Projeto",
        formato: "Upload pelo professor no site",
        data: "Até 30/06/2026",
        local: "Online",
      },
      {
        nome: "Seleção dos 42 finalistas",
        formato: "Avaliação por comitê da Fiocruz",
        data: "A definir",
        local: "Online",
      },
      {
        nome: "Cerimônia Nacional",
        formato: "Apresentação dos projetos e premiação",
        data: "A definir",
        local: "Campus Manguinhos, Rio de Janeiro (RJ)",
      },
    ],
    premiacao: [
      "6 projetos recebem título de Destaque Nacional + menções honrosas",
      "Fiocruz custeia viagem, hospedagem e alimentação para a cerimônia",
      "Prêmio especial 'Menina Hoje, Cientista Amanhã' (homenagem à Dra. Juliana de Meis, pesquisadora de Chagas)",
      "Programa Mentoria nas Escolas: 60 bolsas mensais de R$ 300 para ex-vencedores de escolas públicas em iniciação científica na Fiocruz",
    ],
    notas:
      "Formato único: baseada em projeto (não em prova). Inscrições ainda abertas até 30/06/2026. O Programa Mentoria nas Escolas é uma novidade de 2026 — ex-vencedores de escolas públicas recebem bolsas para iniciação científica na Fiocruz.",
    avisoFases:
      "As datas das fases Regional e Nacional 2026 ainda não foram publicadas pela Fiocruz. Acompanhe o site oficial olimpiada.fiocruz.br antes de comunicar aos alunos.",
  },
  {
    sigla: "OBECON",
    nome: "Olimpíada Brasileira de Economia",
    edicao: "7ª edição (2024/2026)",
    area: "Economia",
    areaSlug: "economia",
    organizador: "OBECON — parceiros: FGV, Insper, BTG Pactual",
    site: "https://obecon.org",
    portalInscricao: "https://obecon.org",
    usaPlanilha: false,
    segmentos: ["EM"],
    series: "Ensino Médio e 9º ano do EF",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Maior olimpíada de Economia do Brasil para o EM. 34 medalhas internacionais acumuladas. Seleciona representantes para a IEO (Olimpíada Internacional de Economia).",
      como: "Inscrição individual via obecon.org. Três fases: online, nacional e presencial em SP.",
    },
    fases: [
      {
        nome: "1ª Fase — Online",
        formato: "Prova objetiva online",
        data: "Primeiro semestre",
        local: "Online",
      },
      {
        nome: "2ª Fase — Nacional",
        formato: "Prova objetiva avançada",
        data: "Segundo semestre",
        local: "Online",
      },
      {
        nome: "Final Presencial",
        formato: "Prova discursiva presencial",
        data: "Final do ano",
        local: "São Paulo (SP)",
      },
    ],
    premiacao: [
      "Medalhas ouro, prata, bronze",
      "Melhores integram a seleção para a IEO (Olimpíada Internacional de Economia)",
      "Prêmios e bolsas de parceiros (FGV, Insper)",
    ],
    notas:
      "A OBECON é a principal seletiva para a IEO. Aborda microeconomia, macroeconomia, economia internacional e pensamento econômico.",
  },
  {
    sigla: "OLITEF",
    nome: "Olimpíada do Tesouro Direto de Educação Financeira",
    edicao: "Edição 2026",
    area: "Economia",
    areaSlug: "economia",
    organizador: "Secretaria do Tesouro Nacional / B3 — apoio MEC",
    site: "https://www.olitef.com.br",
    portalInscricao: "https://www.olitef.com.br",
    usaPlanilha: false,
    segmentos: ["EFAF", "EM"],
    series: "6º ao 9º ano do EF e Ensino Médio",
    custo: "Gratuita",
    gratuita: true,
    inscricoes: {
      descricao:
        "Maior olimpíada de educação financeira do Brasil por participação — 1,75 milhão de participantes em 2025. Fase única online. Premia com títulos do Tesouro Selic e bolsas.",
      como: "Inscrição via olitef.com.br individualmente ou pela escola. Fase única com prova objetiva online.",
    },
    fases: [
      {
        nome: "Fase Única — Online",
        formato: "Prova objetiva online",
        data: "A definir (segundo semestre)",
        local: "Online",
      },
    ],
    premiacao: [
      "Títulos do Tesouro Selic para os melhores classificados",
      "Bolsas de estudo e prêmios de parceiros",
      "Certificados digitais para todos os participantes",
    ],
    notas:
      "Maior olimpíada de educação financeira do Brasil. Aborda orçamento pessoal, investimentos, juros, planejamento financeiro e consumo consciente.",
  },
];
