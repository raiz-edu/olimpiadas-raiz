import { signPopupHandoff } from "@/lib/auth/student-cookie";
import { getStudentSession } from "@/lib/auth/student-session";
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
  const session = await getStudentSession({ popup: true });
  const handoff = session ? signPopupHandoff(session.aluno.id) : null;

  return <PopupCallbackClient handoff={handoff} />;
}
