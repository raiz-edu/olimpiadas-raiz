import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

describe("proxy de autenticação", () => {
  it("permite que o callback atual do Cognito chegue ao route handler", async () => {
    const request = new NextRequest(
      "https://olimpiadas.raizeducacao.com.br/api/auth/cognito/callback?code=test&state=test",
    );

    const response = await updateSession(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("continua redirecionando uma rota protegida sem sessão", async () => {
    const request = new NextRequest("https://olimpiadas.raizeducacao.com.br/dashboard");

    const response = await updateSession(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://olimpiadas.raizeducacao.com.br/login");
  });
});
