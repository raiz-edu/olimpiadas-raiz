import { redirect } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { getServerSession } from "@/lib/auth/session";
import { podeGerirCredenciais } from "@/lib/auth/roles";
import { listarCredenciais } from "@/lib/credenciais/queries";
import { getConfigIA } from "@/lib/ai/config";
import { PROVEDORES, PROVEDORES_IA } from "@/lib/ai/provedores";
import { CredenciaisTabela } from "./credenciais-tabela";
import { IaConfigCard } from "./ia-config-card";

export const metadata = { title: "Credenciais — Olimpíadas" };

export default async function CredenciaisPage() {
  const session = await getServerSession();
  if (!session) return null;
  // Gate duplo: permissão da role E e-mail em ADMIN_EMAILS (só Helio e Hugo).
  if (!podeGerirCredenciais(session.user.role, session.user.email)) redirect("/dashboard");

  const [{ itens, masterKeyOk, chaveMestra }, configIA] = await Promise.all([
    listarCredenciais(),
    getConfigIA({ semCache: true }),
  ]);
  const provedores = PROVEDORES_IA.map((id) => ({
    id,
    rotulo: PROVEDORES[id].rotulo,
    comChave: itens.some((i) => i.chave === PROVEDORES[id].credencial && i.origem !== "ausente"),
  }));

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

      {chaveMestra === "ausente" && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          Nenhuma chave-mestra neste ambiente (<strong>CREDENCIAIS_MASTER_KEY</strong> nem{" "}
          <strong>SESSION_SIGNING_SECRET</strong>). Salvar e remover ficam desabilitados; o servidor
          continua usando as env vars. Gere com <code>openssl rand -base64 32</code> e defina no
          ambiente do servidor.
        </p>
      )}
      {chaveMestra === "derivada" && (
        <p className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-700 dark:text-sky-300">
          Chave-mestra <strong>provisória</strong>, derivada de <code>SESSION_SIGNING_SECRET</code>.
          Gravar chaves já funciona. Quando puder, defina <code>CREDENCIAIS_MASTER_KEY</code> (
          <code>openssl rand -base64 32</code>) no ambiente do servidor: o que já estiver gravado
          continua legível e passa a usar a chave própria na próxima gravação.
        </p>
      )}

      <IaConfigCard config={configIA} provedores={provedores} />

      <CredenciaisTabela itens={itens} masterKeyOk={masterKeyOk} />
    </div>
  );
}
