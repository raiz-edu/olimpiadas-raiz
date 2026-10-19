import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth/session";
import { getStudentSession } from "@/lib/auth/student-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const origem = `${request.nextUrl.protocol}//${request.headers.get("host")}`;
  if (request.headers.get("origin") !== origem) {
    return NextResponse.json({ erro: "Origem inválida." }, { status: 403 });
  }
  let area: "portal" | "gestao";
  try {
    const dados: unknown = await request.json();
    if (
      !dados ||
      typeof dados !== "object" ||
      Array.isArray(dados) ||
      !("area" in dados) ||
      Object.keys(dados).length !== 1 ||
      (dados.area !== "portal" && dados.area !== "gestao")
    )
      return NextResponse.json({ erro: "Área inválida." }, { status: 400 });
    area = dados.area;
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }
  try {
    // Selecionar a área nunca autoriza usar a sessão da outra superfície.
    const identidade =
      area === "portal"
        ? (await getStudentSession({ permitirCadastroIncompleto: true }))?.aluno.id
        : (await getServerSession())?.user.id;
    if (!identidade) return NextResponse.json({ erro: "Sessão inválida." }, { status: 401 });
    const { error } = await createAdminClient()
      .rpc("registrar_acesso", {
        ...(area === "portal" ? { p_aluno_id: identidade } : { p_usuario_id: identidade }),
      })
      .abortSignal(AbortSignal.timeout(10_000));
    if (error) throw new Error(error.code);
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  } catch {
    // A ausência de telemetria não interfere na sessão nem no estudo.
    return NextResponse.json({ erro: "Registro de acesso indisponível." }, { status: 503 });
  }
}
