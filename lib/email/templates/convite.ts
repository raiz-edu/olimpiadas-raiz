import type { RoleUsuario } from "@/lib/types/database";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { APP_URL } from "@/lib/email/resend";

export type ConviteEmailData = {
  nomeConvidado?: string;
  emailConvidado: string;
  role: RoleUsuario;
  marcaNome?: string;
  unidadeNome?: string;
  token: string;
  expiresAt: string; // ISO date
  convidadoPor?: string;
};

export function conviteEmailHtml(data: ConviteEmailData): string {
  const link = `${APP_URL}/aceitar-convite?token=${data.token}`;
  const roleLabel = ROLE_LABELS[data.role];
  const expiracao = new Date(data.expiresAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const contexto = data.marcaNome
    ? data.unidadeNome
      ? `${data.marcaNome} — ${data.unidadeNome}`
      : data.marcaNome
    : "Raiz Educação";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite — Olimpíadas do Conhecimento</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.12);">

          <!-- Header -->
          <tr>
            <td style="background:#1e40af;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-.3px;">
                Olimpíadas do Conhecimento
              </h1>
              <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">${contexto}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;color:#111827;font-size:16px;">
                ${data.nomeConvidado ? `Olá, <strong>${data.nomeConvidado}</strong>!` : "Olá!"}
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                ${data.convidadoPor ? `<strong>${data.convidadoPor}</strong> convidou você` : "Você foi convidado"} para acessar a plataforma de gestão de olimpíadas da Raiz Educação com o perfil de
                <strong>${roleLabel}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 0 32px;">
                <tr>
                  <td style="background:#1e40af;border-radius:8px;">
                    <a href="${link}"
                       style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-.2px;">
                      Aceitar convite →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                Ou copie e cole este link no navegador:
              </p>
              <p style="margin:0 0 32px;word-break:break-all;">
                <a href="${link}" style="color:#1e40af;font-size:13px;">${link}</a>
              </p>

              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;" />

              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Este convite expira em <strong>${expiracao}</strong>.<br />
                Se você não esperava este convite, pode ignorar este e-mail com segurança.<br />
                Este link é de uso único e não deve ser compartilhado.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">
                Raiz Educação · Sistema de Gestão de Olimpíadas do Conhecimento
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function conviteEmailText(data: ConviteEmailData): string {
  const link = `${APP_URL}/aceitar-convite?token=${data.token}`;
  const roleLabel = ROLE_LABELS[data.role];
  return `Olimpíadas do Conhecimento — Raiz Educação

Você foi convidado para a plataforma com o perfil de ${roleLabel}.

Aceite o convite clicando no link abaixo:
${link}

O convite expira em: ${new Date(data.expiresAt).toLocaleDateString("pt-BR")}.

Se você não esperava este convite, ignore este e-mail.`;
}
