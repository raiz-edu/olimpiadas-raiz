"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getServerSession } from "@/lib/auth/session";
import { canUser, ROLE_LABELS } from "@/lib/auth/roles";
import type { RoleUsuario } from "@/lib/types/database";
import { getResend, FROM_EMAIL, APP_URL } from "@/lib/email/resend";
import { conviteEmailHtml, conviteEmailText } from "@/lib/email/templates/convite";
import crypto from "crypto";

const PATH = "/usuarios";

export type UsuarioState =
  | { error: string }
  | { ok: true; link?: string; warning?: string; tempPassword?: string; email?: string }
  | null;

// ─── Atualizar usuário (role, ativo) ─────────────────────────────────────────

export async function atualizarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };
  if (!canUser(session.user, "usuario:update")) return { error: "Sem permissão" };

  const id = formData.get("id") as string;
  const role = formData.get("role") as RoleUsuario | null;
  const ativo = formData.get("ativo") === "true";

  if (!id) return { error: "ID obrigatório" };

  // Não permitir editar usuários raiz
  const supabase = createAdminClient();
  const { data: alvo } = await supabase.from("usuario").select("role").eq("id", id).maybeSingle();
  if (alvo?.role === "raiz")
    return { error: "Usuários administradores não podem ser editados pela interface" };

  type UsuarioUpdate = { ativo: boolean; role?: RoleUsuario };
  const update: UsuarioUpdate = { ativo };
  if (session.user.role === "raiz") {
    if (role && Object.keys(ROLE_LABELS).includes(role)) update.role = role;
  }

  const { error } = await supabase.from("usuario").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(PATH);
  return { ok: true };
}

// ─── Convidar novo usuário ────────────────────────────────────────────────────

export async function convidarUsuario(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };
  if (!canUser(session.user, "convite:create")) return { error: "Sem permissão" };

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as RoleUsuario;
  const marcaId = (formData.get("marca_id") as string) || null;

  if (!email || !email.includes("@")) return { error: "E-mail inválido" };
  if (!Object.keys(ROLE_LABELS).includes(role)) return { error: "Role inválida" };

  if (role === "raiz") return { error: "Sem permissão para convidar administrador" };

  // diretor só pode convidar roles de leitura (sem gestor_conteudo ou diretor_marca)
  const ROLES_LEITURA: RoleUsuario[] = ["professor", "coordenador", "diretor"];
  if (session.user.role === "diretor" && !ROLES_LEITURA.includes(role))
    return { error: "Diretores só podem convidar Professor, Coordenador ou Diretor" };

  const token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createAdminClient();
  const { error } = await supabase.from("convite").insert({
    email,
    role,
    marca_id: marcaId,
    token,
    expires_at,
    criado_por: session.user.id,
  });

  if (error) return { error: error.message };

  revalidatePath(PATH);

  const inviteLink = `${APP_URL}/aceitar-convite?token=${token}`;

  // Enviar e-mail via Resend
  try {
    const resend = getResend();

    // Buscar nome da marca para o e-mail
    let marcaNome: string | undefined;
    if (marcaId) {
      const { data: m } = await supabase.from("marca").select("nome").eq("id", marcaId).single();
      marcaNome = (m as { nome: string } | null)?.nome;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Convite — Programa Raiz Olímpica (${ROLE_LABELS[role]})`,
      html: conviteEmailHtml({
        emailConvidado: email,
        role,
        marcaNome,
        token,
        expiresAt: expires_at,
        convidadoPor: session.user.nome,
      }),
      text: conviteEmailText({ emailConvidado: email, role, token, expiresAt: expires_at }),
    });

    return { ok: true, link: inviteLink };
  } catch {
    // E-mail falhou (Resend não configurado ou erro de rede)
    return {
      ok: true,
      link: inviteLink,
      warning:
        "Convite criado, mas o e-mail não pôde ser enviado. Compartilhe o link abaixo diretamente.",
    };
  }
}

// ─── Criar usuário diretamente (sem convite) ─────────────────────────────────

export async function criarUsuarioDireto(
  _prev: UsuarioState,
  formData: FormData,
): Promise<UsuarioState> {
  const session = await getServerSession();
  if (!session) return { error: "Não autorizado" };
  if (!canUser(session.user, "usuario:create")) return { error: "Sem permissão" };

  const nome = (formData.get("nome") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const role = formData.get("role") as RoleUsuario;
  const marcaId = (formData.get("marca_id") as string) || session.user.marca_ativa_id || null;

  if (!nome) return { error: "Nome é obrigatório" };
  if (!email || !email.includes("@")) return { error: "E-mail inválido" };
  if (!Object.keys(ROLE_LABELS).includes(role)) return { error: "Nível de acesso inválido" };
  if (session.user.role !== "raiz" && role === "raiz")
    return { error: "Sem permissão para criar usuário Raiz" };

  // Senha temporária — formato fácil de compartilhar
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const tempPassword =
    "Raiz@" +
    Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");

  const supabase = createAdminClient();

  // Verificar se e-mail já existe
  const { data: existente } = await supabase
    .from("usuario")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existente) return { error: "Este e-mail já está cadastrado no sistema" };

  // Criar usuário no Supabase Auth (email_confirm ignora verificação por e-mail)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });
  if (authError || !authData.user) return { error: authError?.message ?? "Erro ao criar usuário" };

  // Criar registro em public.usuario
  const { error: dbError } = await supabase.from("usuario").insert({
    id: authData.user.id,
    nome,
    email,
    role,
    marca_ativa_id: marcaId,
    ativo: true,
  });

  if (dbError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return { error: dbError.message };
  }

  revalidatePath(PATH);
  return { ok: true, tempPassword, email };
}

// ─── Cancelar convite ─────────────────────────────────────────────────────────

export async function cancelarConvite(id: string): Promise<void> {
  const session = await getServerSession();
  if (!session || !canUser(session.user, "convite:delete")) return;
  const supabase = createAdminClient();
  await supabase.from("convite").delete().eq("id", id);
  revalidatePath(PATH);
}
