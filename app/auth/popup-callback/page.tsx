import { cookies } from "next/headers";
import {
  ALUNO_SESSION_COOKIE,
  verifyStudentCookie,
  signPopupHandoff,
} from "@/lib/auth/student-cookie";
import { PopupCallbackClient } from "./popup-callback-client";

export const metadata = {
  title: "Concluindo login — Plataforma Olímpica",
};

/**
 * Destino final do login Google em popup (plataforma embutida no Painel
 * Pedagógico). Roda no popup top-level, onde a sessão recém-criada está
 * disponível nos cookies; gera o token de handoff e o entrega ao iframe
 * que abriu o popup via postMessage (mesma origem).
 */
export default async function PopupCallbackPage() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ALUNO_SESSION_COOKIE)?.value;
  const alunoId = raw ? verifyStudentCookie(raw) : null;
  const handoff = alunoId ? signPopupHandoff(alunoId) : null;

  return <PopupCallbackClient handoff={handoff} />;
}
