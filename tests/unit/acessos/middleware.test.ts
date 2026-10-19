import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
import { updateSession } from "@/lib/supabase/middleware";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://supabase.example");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "chave-sintetica");
});
afterEach(() => {
  vi.unstubAllEnvs();
});
describe("proxy e sessão independente do portal", () => {
  it("encaminha a telemetria à autenticação própria do endpoint sem exigir Supabase Auth", async () => {
    const resposta = await updateSession(
      new NextRequest("https://olimpica.example/api/acessos", { method: "POST" }),
    );
    expect(resposta.headers.get("x-middleware-next")).toBe("1");
    expect(resposta.headers.get("location")).toBeNull();
  });
  it("continua protegendo a página de Gestão sem sessão", async () => {
    const resposta = await updateSession(
      new NextRequest("https://olimpica.example/analytics/acessos"),
    );
    expect(resposta.status).toBe(307);
    expect(resposta.headers.get("location")).toBe("https://olimpica.example/login");
  });
  it("a exceção é exata e não libera caminhos semelhantes", async () => {
    const resposta = await updateSession(
      new NextRequest("https://olimpica.example/api/acessos/outro"),
    );
    expect(resposta.status).toBe(307);
  });
});
