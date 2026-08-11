import type { CookieOptions } from "@supabase/ssr";

/** `partitioned` (CHIPS) ainda não existe no tipo do @supabase/ssr 0.10.x. */
type EmbedCookieOptions = CookieOptions & { partitioned?: boolean };

/**
 * Opções dos cookies de sessão do Supabase.
 *
 * A plataforma roda embutida em iframe no Painel Pedagógico (ver
 * `frame-ancestors` em next.config.ts). O default do @supabase/ssr é
 * `SameSite=Lax`, que o navegador não envia em contexto cross-site — a sessão
 * aplicada dentro do iframe sumia na primeira navegação e o middleware
 * devolvia para /login.
 *
 * `SameSite=None` + `Secure` + `Partitioned` é o mesmo par já usado pela sessão
 * do aluno em `cookieSessionEmbedOpts()`. Fora do iframe o cookie é
 * particionado no próprio site, então o login direto continua funcionando.
 *
 * Precisa valer para TODOS os clients (browser, server, middleware e o callback
 * do Google): quem renovar o token sem estas opções reescreve o cookie como
 * `Lax` e a sessão morre na request seguinte.
 */
export const supabaseCookieOptions: EmbedCookieOptions = {
  sameSite: "none",
  secure: true,
  partitioned: true,
};
