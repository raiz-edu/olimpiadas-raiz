import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import { AlunoProvider } from "@/lib/auth/student-context";
import { AlunoNav } from "@/components/aluno/aluno-nav";

export default async function AlunoLayout({ children }: { children: React.ReactNode }) {
  const session = await getStudentSession();
  if (!session) redirect("/aluno/login");

  return (
    <AlunoProvider aluno={session.aluno}>
      <div className="flex min-h-screen flex-col bg-background">
        <AlunoNav aluno={session.aluno} marcaSlug={session.marcaSlug} />
        <main className="flex-1">
          <div className="mx-auto w-full px-4 py-6 sm:px-10 max-w-5xl">{children}</div>
        </main>
      </div>
    </AlunoProvider>
  );
}
