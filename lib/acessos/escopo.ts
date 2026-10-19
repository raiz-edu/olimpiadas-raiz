import { can } from "@/lib/auth/roles";
import type { Usuario } from "@/lib/types/database";

/** O filtro da URL nunca concede acesso a outra marca. null significa rede. */
export function escopoMarcasAcessos(
  user: Pick<Usuario, "role" | "marca_ativa_id">,
): string[] | null {
  if (!can(user.role, "audit_log:read")) throw new Error("Acesso à gestão não autorizado.");
  if (user.role === "raiz") return null;
  if (!user.marca_ativa_id) throw new Error("Seu acesso de gestão precisa de uma marca vinculada.");
  return [user.marca_ativa_id];
}
