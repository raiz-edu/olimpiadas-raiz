// Validação da edição de usuário (nome e e-mail). Função pura para poder ser
// testada sem banco — a server action apenas monta o contexto e aplica.

import { ALLOWED_DOMAINS, getEmailDomain } from "@/lib/auth/domains";

export type DadosUsuario = { nome: string; email: string };

export type ContextoEdicao = {
  /** E-mails já usados por OUTROS usuários (minúsculas). */
  emailsEmUso: string[];
};

export const NOME_MIN = 3;

/**
 * Erros da edição (lista vazia = válido). Regras:
 * nome com pelo menos 3 caracteres; e-mail bem formado, de domínio institucional
 * e não usado por outro usuário.
 */
export function validarEdicaoUsuario(dados: DadosUsuario, ctx: ContextoEdicao): string[] {
  const erros: string[] = [];
  const nome = dados.nome?.trim() ?? "";
  const email = dados.email?.trim().toLowerCase() ?? "";

  if (nome.length < NOME_MIN) erros.push(`Nome precisa de pelo menos ${NOME_MIN} caracteres.`);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.push("E-mail inválido.");
  } else if (!(ALLOWED_DOMAINS as readonly string[]).includes(getEmailDomain(email))) {
    erros.push("Utilize um e-mail institucional.");
  } else if (ctx.emailsEmUso.map((e) => e.toLowerCase()).includes(email)) {
    erros.push("Já existe um usuário com este e-mail.");
  }

  return erros;
}

/** Normaliza o par para gravação (nome aparado, e-mail em minúsculas). */
export function normalizarDadosUsuario(dados: DadosUsuario): DadosUsuario {
  return { nome: dados.nome.trim(), email: dados.email.trim().toLowerCase() };
}
