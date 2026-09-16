/** Converte links de aula em URLs dos players incorporados suportados. */
export function getAulaEmbedUrl(url: string, isLive = false): string | null {
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) return null;

    if (parsed.hostname === "drive.google.com") {
      const fileId =
        parsed.pathname.match(/^\/file\/d\/([\w-]+)(?:\/(?:view|preview|edit))?\/?$/)?.[1] ??
        (["/open", "/uc"].includes(parsed.pathname) ? parsed.searchParams.get("id") : null);
      if (!fileId || !/^[\w-]+$/.test(fileId)) return null;

      const embed = new URL(`https://drive.google.com/file/d/${fileId}/preview`);
      // Alguns arquivos compartilhados exigem a chave presente no link original.
      const resourceKey = parsed.searchParams.get("resourcekey");
      if (resourceKey) embed.searchParams.set("resourcekey", resourceKey);
      return embed.toString();
    }

    let youtubeId: string | null = null;
    if (parsed.hostname === "youtu.be") {
      youtubeId = parsed.pathname.slice(1);
    } else if (["youtube.com", "www.youtube.com", "m.youtube.com"].includes(parsed.hostname)) {
      youtubeId =
        parsed.pathname.match(/^\/(?:embed|live|shorts)\/([\w-]+)\/?$/)?.[1] ??
        (parsed.pathname === "/watch" ? parsed.searchParams.get("v") : null);
    }

    if (youtubeId && /^[\w-]+$/.test(youtubeId)) {
      return `https://www.youtube.com/embed/${youtubeId}${isLive ? "?autoplay=1" : ""}`;
    }
  } catch {
    // Link inválido ou provedor sem player incorporado suportado.
  }
  return null;
}
