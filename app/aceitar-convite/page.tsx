import { notFound } from "next/navigation";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { AceitarConviteForm } from "./form";

export const metadata = {
  title: "Aceitar Convite — Olimpíadas do Conhecimento",
};

type PageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AceitarConvitePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) notFound();

  const supabaseAdmin = createAdminClient();

  const { data: convite } = await supabaseAdmin
    .from("convite")
    .select("email, role, marca_id, expires_at, aceito_em")
    .eq("token", token)
    .maybeSingle();

  if (!convite) {
    return (
      <ErrorPage
        title="Convite inválido"
        message="Este link de convite não existe ou já foi utilizado."
        cta={{ label: "Ir para o login", href: "/login" }}
      />
    );
  }

  if (convite.aceito_em) {
    return (
      <ErrorPage
        title="Convite já utilizado"
        message="Este convite já foi aceito. Faça login para acessar a plataforma."
        cta={{ label: "Ir para o login", href: "/login" }}
      />
    );
  }

  if (new Date(convite.expires_at) < new Date()) {
    const dataExpirou = new Date(convite.expires_at).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
    });
    return (
      <ErrorPage
        title="Convite expirado"
        message={`Este convite expirou em ${dataExpirou}. Solicite um novo ao administrador.`}
        cta={{ label: "Fale com o administrador", href: "mailto:olimpiadas@raizeducacao.com.br" }}
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white"
              aria-hidden="true"
            >
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Criar sua conta</h1>
          <p className="mt-1 text-sm text-gray-500">Olimpíadas do Conhecimento · Raiz Educação</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              Convite para
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{convite.email}</p>
            <p className="text-sm text-gray-600">{ROLE_LABELS[convite.role]}</p>
          </div>

          <AceitarConviteForm token={token} email={convite.email} />
        </div>
      </div>
    </main>
  );
}

function ErrorPage({
  title,
  message,
  cta,
}: {
  title: string;
  message: string;
  cta: { label: string; href: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        <a href={cta.href} className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          {cta.label}
        </a>
      </div>
    </main>
  );
}
