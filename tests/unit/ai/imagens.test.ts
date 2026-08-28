import { beforeEach, describe, expect, it, vi } from "vitest";

// Correção de 2026-08-28: solução em imagem falhava na AWS porque /api/storage é
// relativa e exige sessão — o provedor de IA não conseguia baixar.

const mocks = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.createAdminClient }));

const PNG = Buffer.from("89504e470d0a1a0a", "hex"); // cabeçalho PNG, basta para o teste

function fetchFalso(porUrl: Record<string, { status: number; body?: Buffer; tipo?: string }>) {
  const chamadas: string[] = [];
  const impl = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    chamadas.push(u);
    const r = porUrl[u] ?? { status: 404 };
    return new Response(r.status === 200 ? new Uint8Array(r.body ?? PNG) : null, {
      status: r.status,
      headers: { "content-type": r.tipo ?? "image/png" },
    });
  }) as unknown as typeof fetch;
  return { chamadas, impl };
}

function adminComStorage(
  assinar: (bucket: string, caminho: string) => { signedUrl?: string; erro?: string },
) {
  return {
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: async (caminho: string) => {
          const r = assinar(bucket, caminho);
          return r.erro
            ? { data: null, error: new Error(r.erro) }
            : { data: { signedUrl: r.signedUrl }, error: null };
        },
      }),
    },
  };
}

describe("imagemParaDataUrl", () => {
  beforeEach(() => vi.clearAllMocks());

  it("data URL passa direto, sem rede", async () => {
    const f = fetchFalso({});
    const { imagemParaDataUrl } = await import("@/lib/ai/imagens");
    const dataUrl = "data:image/png;base64,AAAA";
    expect(await imagemParaDataUrl(dataUrl, f.impl)).toBe(dataUrl);
    expect(f.chamadas).toEqual([]);
  });

  it("/api/storage/<bucket>/<caminho> → URL assinada → base64 com o content-type", async () => {
    mocks.createAdminClient.mockReturnValue(
      adminComStorage((bucket, caminho) => ({
        signedUrl: `https://s3.exemplo/${bucket}/${caminho}?assinada`,
      })),
    );
    const f = fetchFalso({
      "https://s3.exemplo/questoes/solucoes/OBMEP2015_N3_2F_Q05_sol.png?assinada": {
        status: 200,
        body: PNG,
        tipo: "image/png",
      },
    });
    const { imagemParaDataUrl } = await import("@/lib/ai/imagens");

    const out = await imagemParaDataUrl(
      "/api/storage/questoes/solucoes/OBMEP2015_N3_2F_Q05_sol.png",
      f.impl,
    );
    expect(out).toBe(`data:image/png;base64,${PNG.toString("base64")}`);
    expect(f.chamadas).toEqual([
      "https://s3.exemplo/questoes/solucoes/OBMEP2015_N3_2F_Q05_sol.png?assinada",
    ]);
  });

  it("caminho com %20 é decodificado antes de assinar", async () => {
    const vistos: string[] = [];
    mocks.createAdminClient.mockReturnValue(
      adminComStorage((_b, caminho) => {
        vistos.push(caminho);
        return { signedUrl: "https://s3.exemplo/x" };
      }),
    );
    const f = fetchFalso({ "https://s3.exemplo/x": { status: 200 } });
    const { imagemParaDataUrl } = await import("@/lib/ai/imagens");
    await imagemParaDataUrl("/api/storage/questoes/enunciados/Figura%201.png", f.impl);
    expect(vistos).toEqual(["enunciados/Figura 1.png"]);
  });

  it("URL http(s) pública (Supabase antigo) é baixada direto", async () => {
    const url = "https://ebdazvyyunilbkygtevn.supabase.co/storage/v1/object/public/questoes/x.png";
    const f = fetchFalso({ [url]: { status: 200, tipo: "image/png; charset=binary" } });
    const { imagemParaDataUrl } = await import("@/lib/ai/imagens");
    expect(await imagemParaDataUrl(url, f.impl)).toMatch(/^data:image\/png;base64,/);
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  it("erros viram mensagens que nomeiam a imagem: sem URL assinada, HTTP 404, tamanho", async () => {
    const { imagemParaDataUrl, LIMITE_IMAGEM_BYTES } = await import("@/lib/ai/imagens");

    mocks.createAdminClient.mockReturnValue(adminComStorage(() => ({ erro: "Object not found" })));
    await expect(
      imagemParaDataUrl("/api/storage/questoes/nao-existe.png", fetchFalso({}).impl),
    ).rejects.toThrow(
      "imagem /api/storage/questoes/nao-existe.png: sem URL assinada (Object not found)",
    );

    await expect(
      imagemParaDataUrl(
        "https://x.exemplo/a.png",
        fetchFalso({ "https://x.exemplo/a.png": { status: 404 } }).impl,
      ),
    ).rejects.toThrow("imagem https://x.exemplo/a.png: HTTP 404");

    const grande = Buffer.alloc(LIMITE_IMAGEM_BYTES + 1);
    await expect(
      imagemParaDataUrl(
        "https://x.exemplo/g.png",
        fetchFalso({ "https://x.exemplo/g.png": { status: 200, body: grande } }).impl,
      ),
    ).rejects.toThrow("excede o limite");

    await expect(
      imagemParaDataUrl("questoes/relativa-sem-rota.png", fetchFalso({}).impl),
    ).rejects.toThrow("referência não resolvível");
  });
});
