import { IngressoConteudo } from "@/components/ingresso/ingresso-conteudo";

export const metadata = { title: "Ingresso via Olimpíadas" };

// Plataforma Olímpica (aluno): mesmo conteúdo curado, com a fonte oficial como TEXTO
// (sem links externos clicáveis em conteúdo de aluno). Auth e container vêm do layout.
export default function IngressoAlunoPage() {
  return <IngressoConteudo linksClicaveis={false} />;
}
