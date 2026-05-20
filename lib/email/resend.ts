import { Resend } from "resend";

// Lazy singleton — só inicializa se a chave estiver disponível
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key || key === "re_pendente") {
      throw new Error(
        "RESEND_API_KEY não configurada. Acesse resend.com, crie uma conta e preencha a chave em .env.local",
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "olimpiadas@raizeducacao.com.br";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
