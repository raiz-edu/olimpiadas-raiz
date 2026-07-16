import { TrilhaOlimpica } from "@/components/trilha/trilha-olimpica";

export const metadata = {
  title: "A Trilha Olímpica — Plataforma Olímpica",
  description:
    "Como resultados em olimpíadas científicas abrem vagas e bolsas em universidades do Brasil e do mundo — com todas as fontes oficiais.",
};

export default function ApresentacaoPage() {
  return (
    <main className="min-h-screen bg-[#0b1120]">
      <TrilhaOlimpica />
    </main>
  );
}
