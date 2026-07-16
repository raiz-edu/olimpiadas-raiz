import { Award, Trophy, Medal, GraduationCap, Sparkles, Gem, type LucideIcon } from "lucide-react";
import { Reveal } from "./reveal";
import { CountUp, BarraAnimada } from "./count-up";

// Todas as informações vêm de editais e páginas oficiais (pesquisa verificada
// em 16/07/2026). As fontes são indicadas no texto, sem links externos - a
// experiência mantém o usuário na plataforma.

function Fonte({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
      Fonte: {children}
    </span>
  );
}

function Kicker({
  children,
  cor = "text-violet-400",
}: {
  children: React.ReactNode;
  cor?: string;
}) {
  return <p className={`text-[11px] font-black uppercase tracking-[0.35em] ${cor}`}>{children}</p>;
}

// ─── Dados narrativos ─────────────────────────────────────────────────────────

const VAGAS_2026: {
  n: number;
  uni: string;
  extra: string;
  fonte: string;
  cor: string;
  glow: string;
}[] = [
  {
    n: 451,
    uni: "UNESP",
    extra: "o maior programa do país",
    fonte: "Vunesp",
    cor: "text-emerald-400",
    glow: "rgba(52,211,153,.35)",
  },
  {
    n: 234,
    uni: "USP",
    extra: "100+ cursos, 7 campi",
    fonte: "Fuvest",
    cor: "text-violet-400",
    glow: "rgba(167,139,250,.35)",
  },
  {
    n: 133,
    uni: "UNICAMP",
    extra: "37 cursos",
    fonte: "Comvest",
    cor: "text-amber-400",
    glow: "rgba(251,191,36,.35)",
  },
  {
    n: 104,
    uni: "UFC",
    extra: "41 cursos",
    fonte: "UFC/Prograd",
    cor: "text-sky-400",
    glow: "rgba(56,189,248,.35)",
  },
  {
    n: 80,
    uni: "IMPA Tech",
    extra: "80% das vagas do curso",
    fonte: "Edital IMPA Tech 2026",
    cor: "text-blue-400",
    glow: "rgba(96,165,250,.35)",
  },
  {
    n: 20,
    uni: "UFABC",
    extra: "bacharelados interdisciplinares",
    fonte: "Edital UFABC 58/2025",
    cor: "text-rose-400",
    glow: "rgba(251,113,133,.35)",
  },
];

const REGRAS_RESUMO: {
  uni: string;
  Icone: LucideIcon;
  corIcone: string;
  bgIcone: string;
  regra: string;
  fonte: string;
}[] = [
  {
    uni: "USP",
    Icone: Award,
    corIcone: "text-violet-400",
    bgIcone: "bg-violet-400/10",
    regra:
      "Pontos por medalha: ouro internacional vale 6, bronze nacional vale 1. Valem os 2 últimos anos, no Ensino Médio. Inscrição gratuita em janeiro.",
    fonte: "Fuvest",
  },
  {
    uni: "UNICAMP",
    Icone: Trophy,
    corIcone: "text-amber-400",
    bgIcone: "bg-amber-400/10",
    regra: "28 competições aceitas, da OBMEP à IMO, pontuadas por abrangência. Sem vestibular.",
    fonte: "Comvest",
  },
  {
    uni: "UFC",
    Icone: Medal,
    corIcone: "text-sky-400",
    bgIcone: "bg-sky-400/10",
    regra:
      "Uma medalha (ouro, prata ou bronze) de 2022 a 2025 basta para concorrer - âmbito local, nacional ou internacional.",
    fonte: "UFC/Prograd",
  },
  {
    uni: "IMPA Tech",
    Icone: GraduationCap,
    corIcone: "text-blue-400",
    bgIcone: "bg-blue-400/10",
    regra:
      "Gratuito, com alojamento, alimentação e passagem aérea. Seleção por dinâmicas e entrevistas para medalhistas de OBMEP, OBM, OBFEP, OBQ e OBI.",
    fonte: "Edital IMPA Tech 2026",
  },
  {
    uni: "UnB",
    Icone: Sparkles,
    corIcone: "text-emerald-400",
    bgIcone: "bg-emerald-400/10",
    regra:
      "Vagas extraordinárias aprovadas em julho de 2026 (Resolução CEPE 129/2026) - medalhistas do EM com nota de redação. Primeiro edital a caminho.",
    fonte: "UnB Notícias",
  },
  {
    uni: "Insper e FGV",
    Icone: Gem,
    corIcone: "text-rose-400",
    bgIcone: "bg-rose-400/10",
    regra:
      "Privadas com via olímpica: no Insper, medalhista faz só a redação; na FGV, o 1º colocado da modalidade ganha bolsa de 100%.",
    fonte: "Editais Insper 2026.2 e FGV 1º/2026",
  },
];

const IMPRENSA: { veiculo: string; titulo: string; data: string }[] = [
  {
    veiculo: "CNN Brasil",
    titulo: "USP oferece 234 vagas para medalhistas de olimpíadas",
    data: "dez/2025",
  },
  {
    veiculo: "CNN Brasil",
    titulo: "Unicamp 2026: lista de aprovados inclui as vagas olímpicas",
    data: "mar/2026",
  },
  {
    veiculo: "G1",
    titulo: "IMPA terá primeiro curso de graduação, e de graça, no Porto Maravalley",
    data: "nov/2022",
  },
  {
    veiculo: "Agência Brasil",
    titulo: "Faculdade do IMPA usa olimpíada de conhecimento para selecionar alunos",
    data: "abr/2024",
  },
  {
    veiculo: "O Povo",
    titulo: "Cearense é aprovado no MIT aos 18 anos, após ~30 medalhas em olimpíadas",
    data: "mar/2019",
  },
  {
    veiculo: "CNN Brasil",
    titulo: "OBMEP bate recorde e medalhas abrem portas para IMPA Tech, USP, Unicamp e Unesp",
    data: "dez/2024",
  },
  {
    veiculo: "Agência Câmara",
    titulo: "Comissão aprova reserva de vagas em universidades para olímpicos (PL 3943/23)",
    data: "nov/2024",
  },
];

// ─── Componente ───────────────────────────────────────────────────────────────

export function TrilhaOlimpica() {
  return (
    <article
      className="relative overflow-hidden bg-[#0b1120] text-slate-200"
      style={{ colorScheme: "dark" }}
    >
      {/* Brilhos de fundo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "radial-gradient(600px 400px at 80% 0%, rgba(168,85,247,.14), transparent 70%)",
            "radial-gradient(500px 380px at 10% 28%, rgba(245,158,11,.10), transparent 70%)",
            "radial-gradient(560px 420px at 90% 62%, rgba(56,189,248,.10), transparent 70%)",
            "radial-gradient(520px 400px at 15% 95%, rgba(34,197,94,.10), transparent 70%)",
          ].join(", "),
        }}
      />

      <div className="relative mx-auto max-w-2xl space-y-24 px-6 py-16 sm:space-y-28 sm:py-24">
        {/* ── Abertura ─────────────────────────────────────────────── */}
        <header className="space-y-10 text-center">
          <Reveal>
            <div className="space-y-4">
              <Medal
                className="mx-auto h-8 w-8 text-amber-400"
                strokeWidth={1.8}
                aria-hidden="true"
                style={{ filter: "drop-shadow(0 0 14px rgba(251,191,36,.55))" }}
              />
              <p className="text-lg font-semibold uppercase tracking-[0.4em] text-slate-100 sm:text-xl">
                A Trilha Olímpica
              </p>
              <div
                className="mx-auto h-px w-20"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(251,191,36,.7), transparent)",
                }}
              />
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-600">
                Ciclo 2026 · Atualizado em 16/07/2026
              </p>
            </div>
          </Reveal>
          <Reveal delay={150}>
            <h1 className="font-serif text-5xl leading-[1.02] text-slate-50 sm:text-7xl">
              A medalha é{" "}
              <span
                className="bg-gradient-to-r from-amber-300 via-amber-400 to-orange-500 bg-clip-text text-transparent"
                style={{ textShadow: "none" }}
              >
                o ingresso.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={250}>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-slate-400">
              Universidades do Brasil e do mundo reservam vagas, bolsas integrais e portas de
              entrada próprias para quem se destaca nas olimpíadas do conhecimento.
            </p>
          </Reveal>
        </header>

        {/* ── O número ─────────────────────────────────────────────── */}
        <section className="space-y-10">
          <Reveal>
            <p className="text-lg leading-relaxed text-slate-400">
              Você passou anos resolvendo problemas que quase ninguém consegue. O que talvez ninguém
              tenha contado: só no Brasil, em 2026, isso vale
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p
              className="font-serif text-8xl tabular-nums sm:text-9xl"
              style={{ textShadow: "0 0 60px rgba(251,191,36,.45)" }}
            >
              <CountUp
                value={1000}
                suffix="+"
                className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent"
              />
            </p>
            <p className="mt-2 text-sm font-bold uppercase tracking-widest text-slate-400">
              vagas universitárias para medalhistas - sem vestibular
            </p>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {VAGAS_2026.map((v, i) => (
              <Reveal key={v.uni} delay={i * 80}>
                <div
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                  style={{
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,.04), 0 0 40px -18px ${v.glow}`,
                  }}
                >
                  <p
                    className={`font-serif text-5xl tabular-nums ${v.cor}`}
                    style={{ textShadow: `0 0 30px ${v.glow}` }}
                  >
                    <CountUp value={v.n} />
                  </p>
                  <p className="mt-1 text-sm font-bold text-slate-100">{v.uni}</p>
                  <p className="text-xs text-slate-500">{v.extra}</p>
                  <p className="mt-2">
                    <Fonte>{v.fonte}</Fonte>
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Como funciona ────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker cor="text-emerald-400">Como funciona</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-5xl">
              Cada universidade, uma porta diferente
            </h2>
          </Reveal>
          <div className="space-y-4">
            {REGRAS_RESUMO.map((r, i) => (
              <Reveal key={r.uni} delay={i * 60}>
                <div className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${r.bgIcone}`}
                    aria-hidden="true"
                  >
                    <r.Icone className={`h-5 w-5 ${r.corIcone}`} strokeWidth={2.2} />
                  </span>
                  <div>
                    <p className="font-bold text-slate-50">{r.uni}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-400">{r.regra}</p>
                    <p className="mt-2">
                      <Fonte>{r.fonte}</Fonte>
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="text-sm leading-relaxed text-slate-500">
              UNIFEI - a pioneira entre as federais - e UFMS mantêm programas próprios com editais
              anuais. <Fonte>UNIFEI/COPS e UFMS/Ingresso</Fonte>
            </p>
          </Reveal>
        </section>

        {/* ── Vagas sobram ─────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker cor="text-amber-400">O paradoxo</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-5xl">
              A maioria dessas vagas fica <span className="text-amber-400">vazia</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              Nos históricos divulgados pelas próprias universidades, o aproveitamento das vagas
              olímpicas é baixo - por puro desconhecimento dos estudantes.
            </p>
          </Reveal>
          <div className="space-y-6">
            {[
              { uni: "UNESP", usado: "137 de 863 vagas desde 2020", pct: 16 },
              { uni: "UNICAMP", usado: "267 de 564 vagas em 5 edições", pct: 47 },
              { uni: "USP", usado: "30 de 113 vagas na estreia (2019)", pct: 27 },
            ].map((b, i) => (
              <Reveal key={b.uni} delay={i * 100}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-bold text-slate-100">{b.uni}</span>
                  <span className="text-slate-500">{b.usado}</span>
                </div>
                <div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-800">
                  <BarraAnimada
                    pct={b.pct}
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
                  />
                </div>
                <p className="mt-1.5 text-right font-serif text-2xl tabular-nums text-amber-400">
                  <CountUp value={b.pct} suffix="%" duration={1200} />
                </p>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5 font-serif text-xl italic leading-relaxed text-amber-100/90 sm:text-2xl">
              Quem conhece as regras compete por vagas que a maioria nem sabe que existem.
            </p>
          </Reveal>
        </section>

        {/* ── Exterior ─────────────────────────────────────────────── */}
        <section className="space-y-8">
          <Reveal>
            <Kicker cor="text-sky-400">E no exterior</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-5xl">
              Do MIT a Singapura 🌍
            </h2>
          </Reveal>
          <div className="space-y-4">
            <Reveal>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-[15px] leading-relaxed text-slate-400">
                  <strong className="text-slate-50">MIT, Harvard e Princeton</strong> avaliam
                  candidatos de forma holística - e uma medalha internacional é um dos sinais mais
                  fortes que existem: o blog oficial de admissões do MIT celebra seus{" "}
                  <em>“MIT Olympians”</em>. As três dão <em>bolsa integral por necessidade</em>,
                  inclusive para estrangeiros. <Fonte>MIT Admissions</Fonte>
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5">
                <p className="text-[15px] leading-relaxed text-slate-300">
                  🇧🇷 Não é teoria: em 2019, os medalhistas da OBMEP{" "}
                  <strong className="text-emerald-300">Pedro Sponchiado</strong> (ouro na IMO) e{" "}
                  <strong className="text-emerald-300">Orisvaldo Salviano Neto</strong> (bronze na
                  IChO) entraram no MIT com bolsa integral. <Fonte>IMPA</Fonte>
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-[15px] leading-relaxed text-slate-400">
                  <strong className="text-slate-50">NUS</strong> (Singapura) cita medalhas de IMO,
                  IPhO, IChO, IOI e IBO nominalmente na regra de admissão por aptidão - com isenção
                  de disciplinas para medalhistas de IOI em Computing.{" "}
                  <strong className="text-slate-50">Waterloo</strong> (Canadá) usa os contests
                  Euclid e CCC como critério documentado em Computer Science.{" "}
                  <Fonte>NUS Admissions e Waterloo CS</Fonte>
                </p>
              </div>
            </Reveal>
            <Reveal>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-[15px] leading-relaxed text-slate-400">
                  No <strong className="text-slate-50">Reino Unido</strong>, a olimpíada prepara
                  para o que decide: o STEP de Cambridge, o MAT de Oxford e as entrevistas. E um
                  alerta honesto: a <strong className="text-slate-50">ETH Zurich</strong> (Suíça)
                  afirma que prêmios de olimpíada <em>não</em> contam na admissão - lá, o caminho é
                  o exame. <Fonte>Cambridge Admissions e ETH Zurich FAQ</Fonte>
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── O futuro ─────────────────────────────────────────────── */}
        <section className="space-y-6">
          <Reveal>
            <Kicker cor="text-emerald-400">O futuro</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-5xl">
              Isso é só o começo
            </h2>
          </Reveal>
          <Reveal>
            <div className="rounded-2xl border border-emerald-400/25 bg-emerald-400/5 p-5">
              <p className="text-[15px] leading-relaxed text-slate-300">
                O <strong className="text-emerald-300">PL 3943/2023</strong> quer obrigar todas as
                universidades federais a criar vagas olímpicas, com regras publicadas em edital. Já
                passou pela Comissão de Educação da Câmara, recebeu parecer favorável na CCJC e
                aguarda votação. Se aprovado, o que hoje é vanguarda vira regra nacional.{" "}
                <Fonte>Câmara dos Deputados, PL 3943/2023</Fonte>
              </p>
            </div>
          </Reveal>
        </section>

        {/* ── Na imprensa ──────────────────────────────────────────── */}
        <section className="space-y-6">
          <Reveal>
            <Kicker cor="text-rose-400">Na imprensa</Kicker>
            <h2 className="mt-3 font-serif text-3xl text-slate-50 sm:text-4xl">
              Quem já noticiou essa trilha
            </h2>
          </Reveal>
          <div className="divide-y divide-slate-800/80">
            {IMPRENSA.map((m, i) => (
              <Reveal key={m.titulo} delay={i * 50}>
                <div className="py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                    {m.veiculo} · {m.data}
                  </p>
                  <p className="mt-1 text-[15px] leading-snug text-slate-300">{m.titulo}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Fecho ────────────────────────────────────────────────── */}
        <footer className="space-y-6 border-t border-slate-800 pt-12">
          <Reveal>
            <p className="font-serif text-4xl leading-tight text-slate-50 sm:text-6xl">
              Se você compete,
              <br />
              <span
                className="bg-gradient-to-r from-amber-300 to-orange-500 bg-clip-text text-transparent"
                style={{ textShadow: "none" }}
              >
                seu caminho está aberto.
              </span>
            </p>
          </Reveal>
          <Reveal delay={150}>
            <p className="text-sm leading-relaxed text-slate-500">
              Fale com a coordenação da sua escola para montar a sua trilha. Todos os dados desta
              página vêm de editais e páginas oficiais das universidades, verificados em 16/07/2026.
              Editais mudam a cada ciclo: a coordenação tem os detalhes de cada um.
            </p>
          </Reveal>
        </footer>
      </div>
    </article>
  );
}
