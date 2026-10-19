import { Suspense } from "react";
import { RegistrarAcesso } from "@/components/acessos/registrar-acesso";

/** Inclui o cadastro incompleto, que fica fora do grupo autenticado (area). */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <RegistrarAcesso area="portal" />
      </Suspense>
      {children}
    </>
  );
}
