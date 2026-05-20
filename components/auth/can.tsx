import type { RoleUsuario } from "@/lib/types/database";
import type { Permission } from "@/lib/auth/roles";
import { can, canAll, canAny } from "@/lib/auth/roles";

// ---------------------------------------------------------------------------
// <Can> — componente declarativo de controle de acesso
//
// Uso em Server Components (role vem de getServerSession):
//   <Can role={session.user.role} perform="olimpiada:create">
//     <CreateButton />
//   </Can>
//
// Uso em Client Components (role vem de useUser):
//   const { user } = useUser();
//   <Can role={user.role} perform="inscricao:delete">
//     <DeleteButton />
//   </Can>
// ---------------------------------------------------------------------------

type CanProps = {
  role: RoleUsuario;
  /** Permissão única requerida */
  perform?: Permission;
  /** Todas as permissões devem estar presentes */
  all?: Permission[];
  /** Pelo menos uma permissão deve estar presente */
  any?: Permission[];
  children: React.ReactNode;
  /** Conteúdo renderizado quando sem permissão (default: nada) */
  fallback?: React.ReactNode;
};

export function Can({ role, perform, all, any, children, fallback = null }: CanProps) {
  let allowed = false;

  if (perform) {
    allowed = can(role, perform);
  } else if (all && all.length > 0) {
    allowed = canAll(role, all);
  } else if (any && any.length > 0) {
    allowed = canAny(role, any);
  }

  return allowed ? <>{children}</> : <>{fallback}</>;
}
