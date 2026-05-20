import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import { PageHeader } from "@/components/ui/page-header";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { OlimpiadaForm } from "../_form";

export const metadata = { title: "Nova Olimpíada — Olimpíadas" };

export default async function NovaOlimpiadaPage() {
  const session = await getServerSession();
  if (!session) return null;

  if (!can(session.user.role, "olimpiada:create")) redirect("/olimpiadas");

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: "Olimpíadas", href: "/olimpiadas" }, { label: "Nova olimpíada" }]}
      />
      <PageHeader title="Nova Olimpíada" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <OlimpiadaForm />
      </div>
    </div>
  );
}
