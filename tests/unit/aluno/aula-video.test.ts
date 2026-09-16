import { describe, expect, it } from "vitest";
import { getAulaEmbedUrl } from "@/lib/aluno/aula-video";
import nextConfig from "@/next.config";

const fileId = "video_da-aula_123";
const driveEmbed = `https://drive.google.com/file/d/${fileId}/preview`;

describe("vídeo da aula", () => {
  it.each([
    `https://drive.google.com/file/d/${fileId}/view?usp=sharing`,
    `https://drive.google.com/file/d/${fileId}/preview`,
    `https://drive.google.com/file/d/${fileId}/edit`,
    `https://drive.google.com/file/d/${fileId}`,
    `https://drive.google.com/open?id=${fileId}`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ])("incorpora o arquivo do Drive: %s", (url) => {
    expect(getAulaEmbedUrl(url)).toBe(driveEmbed);
  });

  it("preserva a chave de acesso do arquivo compartilhado", () => {
    expect(
      getAulaEmbedUrl(
        `https://drive.google.com/file/d/${fileId}/view?resourcekey=0-chave&usp=sharing`,
      ),
    ).toBe(`${driveEmbed}?resourcekey=0-chave`);
  });

  it.each([
    "https://www.youtube.com/watch?v=aula_123-45",
    "https://m.youtube.com/watch?v=aula_123-45",
    "https://youtu.be/aula_123-45?si=compartilhado",
    "https://www.youtube.com/embed/aula_123-45",
    "https://www.youtube.com/live/aula_123-45",
    "https://www.youtube.com/shorts/aula_123-45",
  ])("mantém o YouTube incorporado: %s", (url) => {
    expect(getAulaEmbedUrl(url)).toBe("https://www.youtube.com/embed/aula_123-45");
  });

  it("só ativa autoplay no YouTube para aulas ao vivo", () => {
    expect(getAulaEmbedUrl("https://youtu.be/aula_123-45", true)).toBe(
      "https://www.youtube.com/embed/aula_123-45?autoplay=1",
    );
    expect(getAulaEmbedUrl(driveEmbed, true)).toBe(driveEmbed);
  });

  it.each([
    "https://meet.google.com/abc-defg-hij",
    "https://escola.zoom.us/j/123456789",
    "https://drive.google.com/drive/folders/pasta",
    "https://drive.google.com/open",
    "https://drive.google.com.evil.example/file/d/video/view",
    "https://notyoutube.com/watch?v=aula_123-45",
    "https://youtu.be.evil.example/aula_123-45",
    "https://drive.google.com/open?id=arquivo%2Finvalido",
    "javascript:alert(1)",
    "ftp://drive.google.com/file/d/video/view",
    "link inválido",
  ])("não incorpora URL inválida ou não suportada: %s", (url) => {
    expect(getAulaEmbedUrl(url)).toBeNull();
  });

  it("libera o player do Drive no CSP sem liberar outros sites", async () => {
    const rules = await nextConfig.headers!();
    const csp = rules
      .flatMap((rule) => rule.headers)
      .find((header) => header.key === "Content-Security-Policy")!.value;
    const frameSrc = csp.split("; ").find((directive) => directive.startsWith("frame-src "));
    expect(frameSrc?.split(" ")).toEqual([
      "frame-src",
      "'self'",
      "https://www.youtube.com",
      "https://player.vimeo.com",
      "https://drive.google.com",
    ]);
  });
});
