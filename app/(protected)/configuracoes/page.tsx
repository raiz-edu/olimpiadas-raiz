import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { can, podeGerirCredenciais } from "@/lib/auth/roles";
import { getConfigValue } from "@/lib/config/queries";
import { VideoConfigCard } from "./video-config-card";

export const metadata = { title: "Configurações — Olimpíadas" };

export default async function ConfiguracoesPage() {
  const session = await getServerSession();
  if (!session) return null;
  // Personalizações globais: só raiz (salvarConfig já exigia; a página não — issue #159).
  if (!can(session.user.role, "credencial:read")) redirect("/dashboard");

  const videoUrl = await getConfigValue("video_login_url");
  const mostraCredenciais = podeGerirCredenciais(session.user.role, session.user.email);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalizações globais do sistema.</p>
      </div>

      {mostraCredenciais && (
        <Link
          href="/configuracoes/credenciais"
          className="flex items-center justify-between rounded-xl border border-border bg-card p-6 transition-colors hover:border-ring"
        >
          <div>
            <h2 className="text-base font-semibold text-foreground">Credenciais de integrações</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Chaves de API da avaliação por IA e das demais integrações, cifradas no banco. Visível
              só para os administradores da Raiz.
            </p>
          </div>
          <span className="text-muted-foreground" aria-hidden="true">
            →
          </span>
        </Link>
      )}

      <VideoConfigCard valorAtual={videoUrl} />
    </div>
  );
}
