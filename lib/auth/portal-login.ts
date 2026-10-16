import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Aluno } from "@/lib/types/database";
import {
  ALUNO_PENDING_COOKIE,
  ALUNO_SESSION_COOKIE,
  cookieSessionOpts,
  signStudentCookie,
} from "./student-cookie";
import { destinoPortal } from "./portal-profile";

/** Invocar somente após verificar credenciais. O cookie não dispensa o guard do perfil. */
export async function abrirSessaoPortal(aluno: Aluno, popup: boolean): Promise<string> {
  const store = await cookies();
  store.delete(ALUNO_PENDING_COOKIE);
  store.set(ALUNO_SESSION_COOKIE, signStudentCookie(aluno.id), cookieSessionOpts());
  const { error } = await createAdminClient().rpc("registrar_login_aluno", {
    p_aluno_id: aluno.id,
  });
  if (error) console.error("Falha ao registrar acesso ao portal:", error.code);
  return destinoPortal(aluno, popup);
}
