import { Reveal } from "./reveal";

// ─── Fontes oficiais ──────────────────────────────────────────────────────────

const F = {
  fuvest: "https://www.fuvest.br/olimpiadas/",
  comvest: "https://www.comvest.unicamp.br/ingresso-2026/vagas-olimpicas-2026/",
  vunesp: "https://www.vunesp.com.br/VNSP2510",
  unesp: "https://vestibular.unesp.br/",
  impatech:
    "https://impatech.edu.br/wp-content/uploads/2025/10/Edital-IMPA-Tech-2026-versao-final-2025-10-23site.pdf",
  ufabc: "https://prograd.ufabc.edu.br/pdf/edital_58_2025_ingresso_vagas_olimpicas_2026.pdf",
  ufc: "https://olimpiadas.prograd.ufc.br",
  unifei: "https://prg.unifei.edu.br/cops/vagas-olimpicas/",
  ufms: "https://ingresso.ufms.br/olimpiadas-conhecimento/",
  unb: "https://noticias.unb.br/ensino/8634-unb-institui-vagas-extraordinarias-para-medalhistas-de-competicoes-do-conhecimento-e-atletas-de-alto-rendimento",
  insper:
    "https://www.insper.edu.br/content/dam/insper-portal/documentos/vestibular/vestibular-26-2/Edital%202026-2.pdf",
  fgv: "https://vestibular.fgv.br/en/undergraduate/admission-forms/knowledge-olympics",
  fgvCdmc: "https://cdmc.fgv.br/selecao-de-talentos",
  mitOlympians: "https://mitadmissions.org/blogs/entry/mit_olympians/",
  mitNeedBlind: "https://mitadmissions.org/help/faq/need-blind-admissions/",
  impaMit: "https://impa.br/en_US/noticias/medalhistas-da-obmep-sao-aprovados-no-prestigiado-mit/",
  cambridgeStep: "https://www.undergraduate.study.cam.ac.uk/apply/after/sixth-term-exam-STEP",
  nus: "https://www.nus.edu.sg/oam/admissions/aptitude-based-admissions",
  nusComputing: "https://www.comp.nus.edu.sg/programmes/ug/exemptions/olympiad/",
  waterloo: "https://cs.uwaterloo.ca/future-undergraduate-students/applying-admissions",
  ethFaq:
    "https://ethz.ch/en/studies/bachelor/application/non-swiss-matriculation-certificate/faq.html",
  camara: "https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=2380083",
  obmRoundup:
    "https://www.obm.org.br/2025/11/19/universidades-ampliam-vagas-olimpicas-para-2026-e-reforcam-valorizacao-de-medalhistas/",
};

function Fonte({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-slate-500 underline decoration-dotted underline-offset-4 transition-colors hover:text-slate-300"
    >
      {children} ↗
    </a>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-400">{children}</p>
  );
}

// ─── Dados narrativos ─────────────────────────────────────────────────────────

const VAGAS_2026: { n: string; uni: string; extra: string; fonte: string; fonteLabel: string }[] = [
  {
    n: "451",
    uni: "UNESP",
    extra: "o maior programa do país",
    fonte: F.vunesp,
    fonteLabel: "Vunesp",
  },
  { n: "234", uni: "USP", extra: "100+ cursos, 7 campi", fonte: F.fuvest, fonteLabel: "Fuvest" },
  { n: "133", uni: "UNICAMP", extra: "37 cursos", fonte: F.comvest, fonteLabel: "Comvest" },
  { n: "104", uni: "UFC", extra: "41 cursos", fonte: F.ufc, fonteLabel: "UFC" },
  {
    n: "80",
    uni: "IMPA Tech",
    extra: "80% das vagas do curso",
    fonte: F.impatech,
    fonteLabel: "Edital",
  },
  {
    n: "20",
    uni: "UFABC",
    extra: "bacharelados interdisciplinares",
    fonte: F.ufabc,
    fonteLabel: "Edital",
  },
];

const REGRAS_RESUMO: {
  uni: string;
  regra: string;
  fonte: string;
  fonteLabel: string;
}[] = [
  {
    uni: "USP",
    regra:
      "Pontos por medalha: ouro internacional vale 6, bronze nacional vale 1. Valem os 2 últimos anos, no Ensino Médio. Inscrição gratuita em janeiro.",
    fonte: F.fuvest,
    fonteLabel: "Fuvest",
  },
  {
    uni: "UNICAMP",
    regra: "28 competições aceitas, da OBMEP à IMO, pontuadas por abrangência. Sem vestibular.",
    fonte: F.comvest,
    fonteLabel: "Comvest",
  },
  {
    uni: "UFC",
    regra:
      "Uma medalha (ouro, prata ou bronze) de 2022 a 2025 basta para concorrer — âmbito local, nacional ou internacional.",
    fonte: F.ufc,
    fonteLabel: "UFC",
  },
  {
    uni: "IMPA Tech",
    regra:
      "Gratuito, com alojamento, alimentação e passagem. Seleção por dinâmicas e entrevistas para medalhistas de OBMEP, OBM, OBFEP, OBQ e OBI.",
    fonte: F.impatech,
    fonteLabel: "Edital 2026",
  },
  {
    uni: "UnB",
    regra:
      "Vagas extraordinárias aprovadas em julho de 2026 (Resolução CEPE 129/2026) — medalhistas do EM com nota de redação. Primeiro edital a caminho.",
    fonte: F.unb,
    fonteLabel: "UnB Notícias",
  },
  {
    uni: "Insper e FGV",
    regra:
      "Privadas com via olímpica: no Insper, medalhista faz só a redação; na FGV, o 1º colocado da modalidade ganha bolsa de 100%.",
    fonte: F.fgv,
    fonteLabel: "FGV",
  },
];

export type ImprensaItem = { veiculo: string; titulo: string; data: string; url: string };

// Reportagens de grande circulação — pesquisa verificada em 16/07/2026
const IMPRENSA: ImprensaItem[] = [
  {
    veiculo: "CNN Brasil",
    titulo: "USP oferece 234 vagas para medalhistas de olimpíadas",
    data: "dez/2025",
    url: "https://www.cnnbrasil.com.br/educacao/usp-oferece-234-vagas-para-medalhistas-de-olimpiadas/",
  },
  {
    veiculo: "CNN Brasil",
    titulo: "Unicamp 2026: lista de aprovados inclui as vagas olímpicas",
    data: "mar/2026",
    url: "https://www.cnnbrasil.com.br/educacao/unicamp-2026-veja-lista-de-aprovados-da-5a-chamada-enem-e-vagas-olimpicas/",
  },
  {
    veiculo: "G1",
    titulo: "IMPA terá primeiro curso de graduação, e de graça, no Porto Maravalley",
    data: "nov/2022",
    url: "https://g1.globo.com/rj/rio-de-janeiro/noticia/2022/11/17/rio-lanca-polo-de-desenvolvimento-tecnologico-para-gerar-mais-de-5-mil-empregos-impa-tera-primeiro-curso-de-graduacao-e-de-graca.ghtml",
  },
  {
    veiculo: "Agência Brasil",
    titulo: "Faculdade do IMPA usa olimpíada de conhecimento para selecionar alunos",
    data: "abr/2024",
    url: "https://agenciabrasil.ebc.com.br/educacao/noticia/2024-04/faculdade-do-impa-usa-olimpiada-de-conhecimento-para-selecionar-alunos",
  },
  {
    veiculo: "O Povo",
    titulo: "Cearense é aprovado no MIT aos 18 anos, após ~30 medalhas em olimpíadas",
    data: "mar/2019",
    url: "https://www.opovo.com.br/noticias/fortaleza/2019/03/21/cearense-e-aprovado-no-mit-aos-18-anos.html",
  },
  {
    veiculo: "CNN Brasil",
    titulo: "OBMEP bate recorde e medalhas abrem portas para IMPA Tech, USP, Unicamp e Unesp",
    data: "dez/2024",
    url: "https://www.cnnbrasil.com.br/educacao/obmep-divulga-resultado-dos-medalhistas-acesse-lista/",
  },
  {
    veiculo: "Agência Câmara",
    titulo: "Comissão aprova reserva de vagas em universidades para olímpicos (PL 3943/23)",
    data: "nov/2024",
    url: "https://www.camara.leg.br/noticias/1112816-comissao-aprova-reserva-de-vagas-em-universidades-para-estudantes-que-participaram-de-olimpiadas-cientificas/",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function TrilhaOlimpica() {
  return (
    <article className="bg-[#0b1120] text-slate-200" style={{ colorScheme: "dark" }}>
      <div className="mx-auto max-w-2xl space-y-24 px-6 py-16 sm:space-y-32 sm:py-24">
        {/* ── Abertura ─────────────────────────────────────────────── */}
        <header className="space-y-6">
          <Reveal>
            <Kicker>Especial · A Trilha Olímpica</Kicker>
          </Reveal>
          <Reveal delay={100}>
            <h1 className="font-serif text-5xl leading-[1.05] text-slate-50 sm:text-6xl">
              A medalha é<br />o ingresso.
            </h1>
          </Reveal>
          <Reveal delay={200}>
            <p className="text-lg leading-relaxed text-slate-400">
              Universidades do Brasil e do mundo reservam vagas, bolsas integrais e portas de
              entrada próprias para quem se destaca nas olimpíadas do conhecimento. Esta é a trilha
              — com cada regra ligada à sua fonte oficial.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <p className="text-xs uppercase tracking-widest text-slate-600">
              Ciclo 2026 · Atualizado em 16/07/2026
            </p>
          </Reveal>
        </header>

        {/* ── O número ─────────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <p className="text-lg leading-relaxed text-slate-400">
              Você passou anos resolvendo problemas que quase ninguém consegue. O que talvez ninguém
              tenha contado: só no Brasil, em 2026, isso vale
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="font-serif text-7xl tabular-nums text-amber-400 sm:text-8xl">1.000+</p>
            <p className="mt-1 text-sm uppercase tracking-widest text-slate-500">
              vagas universitárias para medalhistas — sem vestibular
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-slate-800 pt-8 sm:grid-cols-3">
            {VAGAS_2026.map((v, i) => (
              <Reveal key={v.uni} delay={i * 80}>
                <p className="font-serif text-4xl tabular-nums text-slate-50">{v.n}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-300">{v.uni}</p>
                <p className="text-xs text-slate-500">{v.extra}</p>
                <p className="mt-1 text-xs">
                  <Fonte href={v.fonte}>{v.fonteLabel}</Fonte>
                </p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Como funciona ────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker>Como funciona</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-4xl">
              Cada universidade, uma porta diferente
            </h2>
          </Reveal>
          <div className="divide-y divide-slate-800/80">
            {REGRAS_RESUMO.map((r, i) => (
              <Reveal key={r.uni} delay={i * 60}>
                <div className="grid gap-1 py-5 sm:grid-cols-[140px_1fr] sm:gap-6">
                  <p className="font-semibold text-slate-100">{r.uni}</p>
                  <div>
                    <p className="text-[15px] leading-relaxed text-slate-400">{r.regra}</p>
                    <p className="mt-1 text-xs">
                      <Fonte href={r.fonte}>{r.fonteLabel}</Fonte>
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-sm leading-relaxed text-slate-500">
              UNIFEI (<Fonte href={F.unifei}>pioneira entre as federais</Fonte>) e UFMS (
              <Fonte href={F.ufms}>ingresso por olimpíadas</Fonte>) mantêm programas próprios com
              editais anuais. O panorama completo do movimento das universidades está na{" "}
              <Fonte href={F.obmRoundup}>OBM</Fonte>.
            </p>
          </Reveal>
        </section>

        {/* ── Vagas sobram ─────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker>O paradoxo</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-4xl">
              A maioria dessas vagas fica vazia
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              Nos históricos divulgados pelas próprias universidades, o aproveitamento das vagas
              olímpicas é baixo — por puro desconhecimento dos estudantes.
            </p>
          </Reveal>
          <div className="space-y-5">
            {[
              { uni: "UNESP", usado: "137 de 863 vagas desde 2020", pct: 16 },
              { uni: "UNICAMP", usado: "267 de 564 vagas em 5 edições", pct: 47 },
              { uni: "USP", usado: "30 de 113 vagas na estreia (2019)", pct: 27 },
            ].map((b, i) => (
              <Reveal key={b.uni} delay={i * 100}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-slate-200">{b.uni}</span>
                  <span className="text-slate-500">{b.usado}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300"
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs tabular-nums text-amber-400">{b.pct}%</p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="border-l-2 border-amber-400/60 pl-4 font-serif text-xl italic leading-relaxed text-slate-300">
              Quem conhece as regras compete por vagas que a maioria nem sabe que existem.
            </p>
          </Reveal>
        </section>

        {/* ── Exterior ─────────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker>E no exterior</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-4xl">
              Do MIT a Singapura
            </h2>
          </Reveal>
          <div className="space-y-6">
            <Reveal>
              <p className="text-[15px] leading-relaxed text-slate-400">
                <strong className="text-slate-100">MIT, Harvard e Princeton</strong> avaliam
                candidatos de forma holística — e uma medalha internacional é um dos sinais mais
                fortes que existem: o blog oficial de admissões do MIT celebra seus{" "}
                <Fonte href={F.mitOlympians}>“MIT Olympians”</Fonte>. As três são{" "}
                <em>need-blind</em> com bolsa integral por necessidade, inclusive para estrangeiros
                (<Fonte href={F.mitNeedBlind}>MIT Admissions</Fonte>).
              </p>
            </Reveal>
            <Reveal>
              <p className="text-[15px] leading-relaxed text-slate-400">
                Não é teoria: em 2019, os medalhistas da OBMEP{" "}
                <strong className="text-slate-100">Pedro Sponchiado</strong> (ouro na IMO) e{" "}
                <strong className="text-slate-100">Orisvaldo Salviano Neto</strong> (bronze na IChO)
                entraram no MIT com bolsa integral (<Fonte href={F.impaMit}>IMPA</Fonte>).
              </p>
            </Reveal>
            <Reveal>
              <p className="text-[15px] leading-relaxed text-slate-400">
                <strong className="text-slate-100">NUS</strong> (Singapura) cita medalhas de IMO,
                IPhO, IChO, IOI e IBO nominalmente na regra de admissão por aptidão (
                <Fonte href={F.nus}>NUS</Fonte>), com isenção de disciplinas para medalhistas de IOI
                em Computing (<Fonte href={F.nusComputing}>NUS Computing</Fonte>).{" "}
                <strong className="text-slate-100">Waterloo</strong> (Canadá) documenta os contests
                Euclid e CCC como critério em Computer Science (
                <Fonte href={F.waterloo}>Waterloo CS</Fonte>).
              </p>
            </Reveal>
            <Reveal>
              <p className="text-[15px] leading-relaxed text-slate-400">
                No <strong className="text-slate-100">Reino Unido</strong>, a olimpíada prepara para
                o que realmente decide: o STEP de Cambridge (
                <Fonte href={F.cambridgeStep}>Cambridge</Fonte>), o MAT de Oxford e as entrevistas.
                E um alerta honesto: a <strong className="text-slate-100">ETH Zurich</strong> afirma
                que prêmios de olimpíada <em>não</em> são considerados na admissão (
                <Fonte href={F.ethFaq}>ETH FAQ</Fonte>) — lá, o caminho é o exame de admissão.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── O futuro ─────────────────────────────────────────────── */}
        <section className="space-y-6">
          <Reveal>
            <Kicker>O futuro</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-4xl">
              Isso é só o começo
            </h2>
          </Reveal>
          <Reveal>
            <p className="text-[15px] leading-relaxed text-slate-400">
              O <strong className="text-slate-100">PL 3943/2023</strong> quer obrigar todas as
              universidades federais a criar vagas olímpicas, com regras publicadas em edital. Já
              passou pela Comissão de Educação da Câmara, recebeu parecer favorável na CCJC e
              aguarda votação (<Fonte href={F.camara}>Câmara dos Deputados</Fonte>). Se aprovado, o
              que hoje é vanguarda de algumas universidades vira regra nacional.
            </p>
          </Reveal>
        </section>

        {/* ── Na imprensa ──────────────────────────────────────────── */}
        {IMPRENSA.length > 0 && (
          <section className="space-y-6">
            <Reveal>
              <Kicker>Na imprensa</Kicker>
            </Reveal>
            <div className="divide-y divide-slate-800/80">
              {IMPRENSA.map((m, i) => (
                <Reveal key={m.url} delay={i * 50}>
                  <a
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block py-4"
                  >
                    <p className="text-xs uppercase tracking-widest text-slate-600">
                      {m.veiculo} · {m.data}
                    </p>
                    <p className="mt-1 text-[15px] leading-snug text-slate-300 transition-colors group-hover:text-slate-50">
                      {m.titulo} ↗
                    </p>
                  </a>
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── Fecho ────────────────────────────────────────────────── */}
        <footer className="space-y-6 border-t border-slate-800 pt-12">
          <Reveal>
            <p className="font-serif text-4xl leading-tight text-slate-50 sm:text-5xl">
              Se você compete,
              <br />
              <span className="text-amber-400">seu caminho está aberto.</span>
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-sm leading-relaxed text-slate-500">
              Fale com a coordenação da sua escola para montar a sua trilha. Todos os dados desta
              página vêm de editais e páginas oficiais, verificados em 16/07/2026 — os links
              acompanham cada informação. Editais mudam a cada ciclo: confirme sempre na fonte.
            </p>
          </Reveal>
        </footer>
      </div>
    </article>
  );
}
