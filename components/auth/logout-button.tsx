"use client";

import { useTransition } from "react";
import { logout } from "@/app/login/actions";

export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logout();
    });
  }

  return (
    <button onClick={handleLogout} disabled={isPending} className={className} aria-busy={isPending}>
      {isPending ? "Saindo…" : "Sair"}
    </button>
  );
}
