import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import { AlunoProvider } from "@/lib/auth/student-context";
import { AlunoNav } from "@/components/aluno/aluno-nav";
import Link from "next/link";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  return (
    <AlunoProvider aluno={session.aluno}>
      <div className="flex min-h-screen flex-col bg-background">
        <AlunoNav aluno={session.aluno} marcaSlug={session.marcaSlug} />
        {(session.aluno.tipo_usuario === "professor" ||
          session.aluno.tipo_usuario === "colaborador") && (
          <aside className="border-b border-border bg-primary/8 px-4 py-3 text-center text-xs text-muted-foreground">
            Você está explorando a área de estudos como{" "}
            {session.aluno.tipo_usuario === "professor" ? "professor" : "profissional da equipe"}.{" "}
            <Link href="/login" className="font-semibold text-primary underline underline-offset-4">
              Acessar gestão pedagógica
            </Link>
          </aside>
        )}
        <main className="flex-1">
          <div className="mx-auto w-full px-4 py-6 sm:px-10 max-w-5xl">{children}</div>
        </main>
      </div>
    </AlunoProvider>
  );
}
