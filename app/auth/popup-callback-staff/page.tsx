import { createClient } from "@/lib/supabase/server";
import { PopupCallbackStaffClient } from "./popup-callback-staff-client";

export const metadata = {
  title: "Concluindo login — Plataforma Olímpica",
};

/**
 * Destino final do login Google STAFF em popup (plataforma embutida no Painel
 * Pedagógico). Mesmo papel do /auth/popup-callback do aluno, mas para a sessão
 * Supabase: o popup roda top-level e tem os cookies da sessão recém-criada; o
 * particionamento de storage do Chrome impede o iframe de enxergá-los, então
 * os tokens são entregues ao iframe via postMessage (mesma origem) e aplicados
 * lá com setSession.
 */
export default async function PopupCallbackStaffPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const tokens = session
    ? { access_token: session.access_token, refresh_token: session.refresh_token }
    : null;

  return <PopupCallbackStaffClient tokens={tokens} />;
}
