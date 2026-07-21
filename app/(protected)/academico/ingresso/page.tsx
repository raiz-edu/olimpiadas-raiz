import { getServerSession } from "@/lib/auth/session";
import { IngressoConteudo } from "@/components/ingresso/ingresso-conteudo";

export const metadata = { title: "Ingresso via Olimpíadas — Acadêmico" };

export default async function IngressoOlimpiadasPage() {
  const session = await getServerSession();
  if (!session) return null;

  // Staff: links externos clicáveis (equipe confirma nos editais oficiais).
  return (
    <div className="max-w-5xl">
      <IngressoConteudo linksClicaveis />
    </div>
  );
}
