import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { cookies } from "next/headers";
import { ALUNO_SESSION_COOKIE, verifyStudentCookie } from "@/lib/auth/student-cookie";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ namespace: string; path: string[] }> },
) {
  const staff = await getServerSession();
  const cookieStore = await cookies();
  const studentRaw = cookieStore.get(ALUNO_SESSION_COOKIE)?.value;
  const student = studentRaw ? verifyStudentCookie(studentRaw) : null;
  if (!staff && !student) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { namespace, path } = await context.params;
  const { data, error } = await createAdminClient()
    .storage.from(namespace)
    .createSignedUrl(path.join("/"), 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: "Arquivo não encontrado" }, { status: 404 });
  }
  return NextResponse.redirect(new URL(data.signedUrl, request.url), 307);
}
