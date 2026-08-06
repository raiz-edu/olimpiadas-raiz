// Resolve papel e marca de quem entra pela PRIMEIRA vez pelo Google.
//
// Sem convite, a marca vem do domínio do e-mail — o que acerta a maioria, mas erra
// quando a pessoa trabalha numa marca e usa o e-mail de outra (acontece na rede).
// Com convite pendente, ele manda: é o registro do que a gestão previu.

import { createAdminClient } from "@/lib/supabase/admin";
import { getMarcaSlugForEmail, getRoleForEmail } from "@/lib/auth/domains";
import type { RoleUsuario } from "@/lib/types/database";

export type PrimeiroAcesso = {
  role: RoleUsuario;
  marcaId: string | null;
  conviteId: string | null;
};

export async function resolverPrimeiroAcesso(email: string): Promise<PrimeiroAcesso> {
  const normalizado = email.toLowerCase();
  const roleDoDominio = getRoleForEmail(normalizado) as RoleUsuario;
  const admin = createAdminClient();

  const { data: convite } = await admin
    .from("convite")
    .select("id, role, marca_id")
    .eq("email", normalizado)
    .is("aceito_em", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (convite) {
    return {
      // Papel de administração nunca vem de convite (ver ADMIN_EMAILS).
      role: roleDoDominio === "raiz" ? "raiz" : (convite.role as RoleUsuario),
      marcaId: convite.marca_id,
      conviteId: convite.id,
    };
  }

  const slug = getMarcaSlugForEmail(normalizado);
  if (!slug) return { role: roleDoDominio, marcaId: null, conviteId: null };

  const { data: marca } = await admin.from("marca").select("id").eq("slug", slug).maybeSingle();
  return { role: roleDoDominio, marcaId: marca?.id ?? null, conviteId: null };
}

/** Marca o convite como aceito depois que o usuário foi criado. */
export async function marcarConviteAceito(conviteId: string | null): Promise<void> {
  if (!conviteId) return;
  const admin = createAdminClient();
  await admin.from("convite").update({ aceito_em: new Date().toISOString() }).eq("id", conviteId);
}
