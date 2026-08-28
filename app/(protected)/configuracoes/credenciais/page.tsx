import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirCredenciais } from "@/lib/auth/roles";
import { listarCredenciais } from "@/lib/credenciais/queries";
import { CredenciaisTabela } from "./credenciais-tabela";

export const metadata = { title: "Credenciais — Olimpíadas" };

export default async function CredenciaisPage() {
  const session = await getServerSession();
  if (!session) return null;
  // Gate duplo: permissão da role E e-mail em ADMIN_EMAILS (só Helio e Hugo).
  if (!podeGerirCredenciais(session.user.role, session.user.email)) redirect("/dashboard");

  const { itens, masterKeyOk } = await listarCredenciais();

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Configurações", href: "/configuracoes" }, { label: "Credenciais" }]}
      />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Credenciais de integrações</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Chaves de API usadas pelo servidor. Ficam cifradas no banco e nunca voltam para o
          navegador — a tela mostra só os últimos 4 caracteres. Salvar aqui vale na hora, sem novo
          deploy.
        </p>
      </div>

      {!masterKeyOk && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          <strong>CREDENCIAIS_MASTER_KEY</strong> não está configurada neste ambiente. Salvar e
          remover ficam desabilitados; o servidor continua usando as env vars. Gere com{" "}
          <code>openssl rand -base64 32</code> e defina no ambiente do servidor.
        </p>
      )}

      <CredenciaisTabela itens={itens} masterKeyOk={masterKeyOk} />
    </div>
  );
}
