import { getConfigValue } from "./actions";
import { VideoConfigCard } from "./video-config-card";

export const metadata = { title: "Configurações — Olimpíadas" };

export default async function ConfiguracoesPage() {
  const videoUrl = await getConfigValue("video_login_url");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personalizações globais do sistema.</p>
      </div>

      <VideoConfigCard valorAtual={videoUrl} />
    </div>
  );
}
