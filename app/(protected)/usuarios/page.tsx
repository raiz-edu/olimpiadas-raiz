import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { canUser } from "@/lib/auth/roles";
import { UsuariosPage } from "@/components/usuarios/usuarios-page";

export const metadata = { title: "Usuários" };

export default async function UsuariosServerPage() {
  const session = await getServerSession();
  if (!session) return null;
  if (!canUser(session.user, "usuario:read")) redirect("/dashboard");

  const isRaiz = session.user.role === "raiz";
  const isDiretor = session.user.role === "diretor";
  const marcaId = session.user.marca_ativa_id;
  const supabase = createAdminClient();

  // Não-raiz sem marca definida não pode gerenciar usuário nenhum (evita ver tudo)
  if (!isRaiz && !marcaId) {
    return (
      <UsuariosPage
        usuarios={[]}
        convites={[]}
        marcas={[]}
        isRaiz={false}
        isDiretor={isDiretor}
        currentUserId={session.user.id}
      />
    );
  }

  // Raiz vê todos; demais veem apenas usuários e convites da sua marca
  let usuariosQuery = supabase
    .from("usuario")
    .select("id, nome, email, role, marca_ativa_id, ativo, marca:marca_ativa_id(id, nome)")
    .order("nome");

  let convitesQuery = supabase
    .from("convite")
    .select("id, email, role, expires_at, aceito_em, marca_id, marca:marca_id(id, nome)")
    .order("created_at", { ascending: false });

  if (!isRaiz && marcaId) {
    usuariosQuery = usuariosQuery.eq("marca_ativa_id", marcaId);
    convitesQuery = convitesQuery.eq("marca_id", marcaId);
  }

  const [{ data: usuarios }, { data: convites }, { data: marcas }] = await Promise.all([
    usuariosQuery,
    convitesQuery,
    supabase.from("marca").select("id, nome").order("nome"),
  ]);

  return (
    <UsuariosPage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      usuarios={(usuarios ?? []) as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convites={(convites ?? []) as any}
      marcas={marcas ?? []}
      isRaiz={isRaiz}
      isDiretor={isDiretor}
      currentUserId={session.user.id}
    />
  );
}
