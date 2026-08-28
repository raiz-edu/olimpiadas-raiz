/**
 * Imagens para o modelo de visão (issue #161, correção de 2026-08-28).
 *
 * O provedor (OpenAI/Groq) precisa ENXERGAR a imagem. Uma URL pública do Supabase
 * ele baixa; a rota `/api/storage/…` da AWS não — é relativa e exige sessão. Então o
 * servidor baixa a imagem (URL assinada do Storage quando for nossa) e manda em
 * base64, que funciona em qualquer ambiente e com qualquer provedor.
 */
import { createAdminClient } from "@/lib/supabase/admin";

/** Acima disso o Groq recusa e a OpenAI fica lenta; nossas figuras têm até ~1,5 MB. */
export const LIMITE_IMAGEM_BYTES = 6 * 1024 * 1024;

const ROTA_STORAGE = /^\/api\/storage\/([^/]+)\/(.+)$/;

/** URL assinada (5 min) para um caminho da nossa rota de storage; null se não for nossa. */
async function urlAssinadaDaRota(url: string): Promise<string | null> {
  const m = url.match(ROTA_STORAGE);
  if (!m) return null;
  const bucket = decodeURIComponent(m[1]!);
  const caminho = m[2]!.split("/").map(decodeURIComponent).join("/");
  const { data, error } = await createAdminClient()
    .storage.from(bucket)
    .createSignedUrl(caminho, 300);
  if (error || !data?.signedUrl) {
    // `error` é `StorageError | null` no Supabase e `null` no shim S3 (vira `never` aqui).
    const motivo = (error as { message?: string } | null)?.message ?? "vazia";
    throw new Error(`imagem ${url}: sem URL assinada (${motivo})`);
  }
  return data.signedUrl;
}

/**
 * Converte qualquer referência de imagem em data URL base64.
 * - `data:` → devolve como está.
 * - `/api/storage/<bucket>/<caminho>` → URL assinada → download.
 * - `http(s)://…` → download direto.
 */
export async function imagemParaDataUrl(
  url: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (url.startsWith("data:")) return url;

  const alvo = (await urlAssinadaDaRota(url)) ?? url;
  if (!/^https?:\/\//.test(alvo)) throw new Error(`imagem ${url}: referência não resolvível`);

  const resposta = await fetchImpl(alvo);
  if (!resposta.ok) throw new Error(`imagem ${url}: HTTP ${resposta.status}`);

  const bytes = Buffer.from(await resposta.arrayBuffer());
  if (bytes.length > LIMITE_IMAGEM_BYTES) {
    throw new Error(
      `imagem ${url}: ${(bytes.length / 1e6).toFixed(1)} MB excede o limite de ${LIMITE_IMAGEM_BYTES / 1e6} MB`,
    );
  }
  const tipo = resposta.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  return `data:${tipo};base64,${bytes.toString("base64")}`;
}

/**
 * PNG 8×8 (xadrez cinza) usado pelo "Testar modelos" para provar que o modelo de
 * visão aceita imagem. Não pode ser 1×1: o Groq exige ≥ 2 px por dimensão.
 */
export const PIXEL_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAG0lEQVR4nGM4cOCAg4MDJsmAVfTAgQMMg1IHAILzYAG5Ne11AAAAAElFTkSuQmCC";
