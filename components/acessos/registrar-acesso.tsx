"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function RegistrarAcesso({ area }: { area: "portal" | "gestao" }) {
  const pathname = usePathname();
  const ultimaTentativa = useRef(0);
  const emAndamento = useRef(false);
  useEffect(() => {
    if (/^\/aluno\/(login|esqueci-senha|redefinir-senha)(\/|$)/.test(pathname)) return;
    async function registrar() {
      if (
        document.visibilityState !== "visible" ||
        emAndamento.current ||
        Date.now() - ultimaTentativa.current < 60_000
      )
        return;
      ultimaTentativa.current = Date.now();
      emAndamento.current = true;
      try {
        await fetch("/api/acessos", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ area }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        /* O uso da plataforma continua quando a telemetria está indisponível. */
      } finally {
        emAndamento.current = false;
      }
    }
    void registrar();
    const atividade = () => {
      void registrar();
    };
    const eventos = ["pointerdown", "keydown", "scroll", "visibilitychange"] as const;
    for (const evento of eventos) document.addEventListener(evento, atividade, { passive: true });
    return () => {
      for (const evento of eventos) document.removeEventListener(evento, atividade);
    };
  }, [pathname, area]);
  return null;
}
