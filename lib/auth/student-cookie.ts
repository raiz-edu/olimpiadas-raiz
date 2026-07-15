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

/**
 * Variante para sessão criada dentro do iframe (Painel Pedagógico).
 * SameSite=None + Partitioned (CHIPS): com o particionamento de storage de
 * terceiros do Chrome, cookies Lax não são enviados em contexto embutido.
 */
export function cookieSessionEmbedOpts() {
  return { ...cookieSessionOpts(), sameSite: "none" as const, partitioned: true };
}

// ── Handoff do login em popup ─────────────────────────────────────────────────
// O OAuth do Google roda num popup top-level; o token de handoff (curta duração,
// propósito exclusivo) é entregue ao iframe via postMessage e trocado pela
// sessão em /api/auth/popup-session.

const HANDOFF_TTL_MS = 60 * 1000;

export function signPopupHandoff(alunoId: string): string {
  return signStudentCookie(`popup:${alunoId}:${Date.now() + HANDOFF_TTL_MS}`);
}

export function verifyPopupHandoff(signed: string): string | null {
  const value = verifyStudentCookie(signed);
  if (!value) return null;
  const [tag, alunoId, exp] = value.split(":");
  if (tag !== "popup" || !alunoId || !exp) return null;
  if (Date.now() > Number(exp)) return null;
  return alunoId;
}

export function cookiePendingOpts() {
  return { httpOnly: true, secure: true, sameSite: "lax" as const, maxAge: 60 * 10, path: "/" };
}
