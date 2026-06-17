import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import { SincronizacaoClient } from "./sincronizacao-client";

export const metadata = { title: "Sincronização TOTVS — Alunos" };

export default async function SincronizacaoPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");

  const { role } = session.user;
  if (!can(role, "aluno:create")) redirect("/dashboard");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sincronizar Alunos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Importa os alunos do TOTVS RM para a plataforma. Alunos novos recebem um e-mail para criar
          sua senha de acesso.
        </p>
      </div>
      <SincronizacaoClient />
    </div>
  );
}
