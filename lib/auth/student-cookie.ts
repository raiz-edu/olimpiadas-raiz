import { createHmac, timingSafeEqual } from "crypto";

export const ALUNO_SESSION_COOKIE = "aluno_session";
export const ALUNO_PENDING_COOKIE = "aluno_pending_consent";

/** Assina value com HMAC-SHA256 usando SESSION_SIGNING_SECRET (isolado do service_role). */
export function signStudentCookie(value: string): string {
  const secret = process.env.SESSION_SIGNING_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const hmac = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${hmac}`;
}

/** Verifica a assinatura e retorna o value original, ou null se inválido. */
export function verifyStudentCookie(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const value = signed.slice(0, lastDot);
  const expected = signStudentCookie(value);
  try {
    if (timingSafeEqual(Buffer.from(signed), Buffer.from(expected))) return value;
  } catch {
    return null;
  }
  return null;
}

export function cookieSessionOpts() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };
}

export function cookiePendingOpts() {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 60 * 10, path: "/" };
}
