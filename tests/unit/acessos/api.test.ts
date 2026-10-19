import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ portal: vi.fn(), staff: vi.fn(), rpc: vi.fn(), abort: vi.fn() }));
vi.mock("@/lib/auth/student-session", () => ({ getStudentSession: mocks.portal }));
vi.mock("@/lib/auth/session", () => ({ getServerSession: mocks.staff }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
import { POST } from "@/app/api/acessos/route";

const request = (dados: unknown = { area: "portal" }, origem = "https://olimpica.example") =>
  new NextRequest("https://olimpica.example/api/acessos", {
    method: "POST",
    headers: { origin: origem, host: "olimpica.example", "content-type": "application/json" },
    body: JSON.stringify(dados),
  });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.portal.mockResolvedValue({ aluno: { id: "portal-validado" } });
  mocks.staff.mockResolvedValue({ user: { id: "staff-validado" } });
  mocks.abort.mockResolvedValue({ error: null });
  mocks.rpc.mockReturnValue({ abortSignal: mocks.abort });
});
describe("POST de atividade autenticada", () => {
  it("deriva identidade portal da sessão e inclui perfis ainda em cadastro", async () => {
    expect((await POST(request())).status).toBe(204);
    expect(mocks.portal).toHaveBeenCalledWith({ permitirCadastroIncompleto: true });
    expect(mocks.rpc).toHaveBeenCalledWith("registrar_acesso", { p_aluno_id: "portal-validado" });
    expect(mocks.staff).not.toHaveBeenCalled();
  });
  it("deriva identidade de gestão exclusivamente do staff autenticado", async () => {
    expect((await POST(request({ area: "gestao" }))).status).toBe(204);
    expect(mocks.rpc).toHaveBeenCalledWith("registrar_acesso", { p_usuario_id: "staff-validado" });
    expect(mocks.portal).not.toHaveBeenCalled();
  });
  it.each(["https://outra.example", "null", ""])(
    "recusa origem %s antes de consultar sessão",
    async (origem) => {
      expect((await POST(request({ area: "portal" }, origem))).status).toBe(403);
      expect(mocks.portal).not.toHaveBeenCalled();
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it.each([{ area: "admin" }, { area: "portal", p_aluno_id: "forjado" }, null, [], {}])(
    "recusa formato/ID adulterado %j",
    async (body) => {
      expect((await POST(request(body))).status).toBe(400);
      expect(mocks.rpc).not.toHaveBeenCalled();
    },
  );
  it("não empresta sessão de gestão a portal, nem sessão de portal a gestão", async () => {
    mocks.portal.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.staff).not.toHaveBeenCalled();
    mocks.portal.mockResolvedValue({ aluno: { id: "portal" } });
    mocks.staff.mockResolvedValue(null);
    expect((await POST(request({ area: "gestao" }))).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("falha da telemetria responde indisponibilidade sem alterar sessão", async () => {
    mocks.abort.mockResolvedValue({ error: { code: "PGRST202" } });
    expect((await POST(request())).status).toBe(503);
  });
});
