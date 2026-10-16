import Link from "next/link";
import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  alunoIdentificado,
  cadastroPortalConcluido,
  destinoPortal,
} from "@/lib/auth/portal-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { identidadeDaMarca } from "@/lib/marcas/identidade";
import { CadastroPortalForm } from "@/components/aluno/cadastro-form";
import { logoutAluno } from "@/app/aluno/login/actions";

export const metadata = { title: "Seu primeiro acesso — Plataforma Olímpica" };

export default async function CadastroPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ popup?: string }>;
}) {
  const popup = (await searchParams).popup === "1";
  const session = await getStudentSession({ permitirCadastroIncompleto: true });
  if (!session) redirect(`/aluno/login${popup ? "?popup=1" : ""}`);
  const { aluno, marcaSlug } = session;
  if (cadastroPortalConcluido(aluno)) redirect(destinoPortal(aluno, popup));
  const identidade = identidadeDaMarca(marcaSlug);
  const admin = createAdminClient();
  let unidades: { id: string; nome: string }[] = [];
  let indisponivel = false;
  if (aluno.marca_id) {
    try {
      const result = await admin
        .from("unidade")
        .select("id, nome")
        .eq("marca_id", aluno.marca_id)
        .eq("ativo", true)
        .order("nome")
        .abortSignal(AbortSignal.timeout(15_000));
      indisponivel = Boolean(result.error);
      unidades = result.data ?? [];
    } catch {
      indisponivel = true;
    }
  }
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={`/aluno/login${popup ? "?popup=1" : ""}`}
            className="text-sm font-semibold text-primary"
          >
            Plataforma Olímpica
          </Link>
          <form action={logoutAluno}>
            {popup && <input type="hidden" name="popup" value="1" />}
            <button className="min-h-10 text-sm text-muted-foreground underline underline-offset-4">
              Usar outra conta
            </button>
          </form>
        </header>
        <div className="mb-7">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            Primeiro acesso
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Vamos preparar seu espaço
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Confirme seu perfil para começar. Você só precisa fazer isso uma vez.
          </p>
        </div>
        <section
          aria-label="Sua conta institucional"
          className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
        >
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Conta verificada</p>
            <p className="mt-1 font-semibold text-foreground">{aluno.nome}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{aluno.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Marca identificada</p>
            <p className="mt-1 font-semibold text-foreground">
              {marcaSlug ? identidade.nome : "Vínculo a confirmar com a coordenação"}
            </p>
          </div>
        </section>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <CadastroPortalForm
            identificado={alunoIdentificado(aluno)}
            unidades={unidades}
            unidadeAtual={aluno.unidade_id}
            serieAtual={aluno.serie ?? aluno.serie_cadastro}
            serieOficial={Boolean(aluno.serie?.trim())}
            catalogoIndisponivel={indisponivel}
            popup={popup}
          />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Precisa corrigir seu vínculo?{" "}
          <a className="underline underline-offset-4" href="mailto:olimpiadas@raizeducacao.com.br">
            Fale com a coordenação
          </a>
        </p>
      </div>
    </main>
  );
}
