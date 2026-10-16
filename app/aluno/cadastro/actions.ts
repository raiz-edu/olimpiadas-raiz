"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStudentSession } from "@/lib/auth/student-session";
import {
  alunoIdentificado,
  cadastroPortalConcluido,
  destinoPortal,
  isTipoPerfilPortal,
  SERIES_CADASTRO,
} from "@/lib/auth/portal-profile";

export type CadastroPortalState = { error: string } | null;

export async function concluirCadastroPortal(
  _previous: CadastroPortalState,
  form: FormData,
): Promise<CadastroPortalState> {
  const popup = form.get("popup") === "1";
  const session = await getStudentSession({ permitirCadastroIncompleto: true });
  if (!session) redirect(`/aluno/login${popup ? "?popup=1" : ""}`);
  const { aluno } = session;
  if (cadastroPortalConcluido(aluno)) redirect(destinoPortal(aluno, popup));
  const tipo = form.get("tipo_usuario");
  if (!isTipoPerfilPortal(tipo)) return { error: "Selecione como você vai usar a plataforma." };
  if (alunoIdentificado(aluno) && tipo !== "aluno")
    return {
      error: "Seu vínculo escolar identifica um aluno. Fale com a coordenação para corrigir.",
    };
  const unidade = typeof form.get("unidade_id") === "string" ? String(form.get("unidade_id")) : "";
  const serie = typeof form.get("serie") === "string" ? String(form.get("serie")) : "";
  const serieOficial = Boolean(aluno.serie?.trim() && aluno.serie === serie);
  if (
    tipo === "aluno" &&
    (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(unidade) ||
      (!serieOficial && !SERIES_CADASTRO.some((s) => s.valor === serie)))
  )
    return { error: "Selecione sua unidade e sua série." };

  try {
    const { error } = await createAdminClient()
      .rpc("concluir_cadastro_portal", {
        p_aluno_id: aluno.id, // Identidade da sessão verificada; nunca do formulário.
        p_tipo: tipo,
        p_unidade_id: tipo === "aluno" ? unidade : null,
        p_serie: tipo === "aluno" ? serie : null,
      })
      .abortSignal(AbortSignal.timeout(15_000));
    if (error) {
      return {
        error:
          error.code === "P0001"
            ? error.message
            : "Não foi possível salvar seu cadastro. Tente novamente.",
      };
    }
  } catch {
    return {
      error: "A conexão foi interrompida. Tente novamente; seus dados continuam preenchidos.",
    };
  }
  revalidatePath("/aluno", "layout");
  // Releitura do perfil na página; um reenvio é idempotente no banco.
  redirect(`/aluno/cadastro${popup ? "?popup=1" : ""}`);
}
