"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function MobileNav({ apostilasLabel }: { apostilasLabel?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao navegar: ajuste de estado durante o render (padrão recomendado
  // pelo React para reagir a mudança de valor, sem setState dentro de effect)
  const [ultimaRota, setUltimaRota] = useState(pathname);
  if (ultimaRota !== pathname) {
    setUltimaRota(pathname);
    setOpen(false);
  }

  // Trava o scroll do body enquanto o drawer está aberto
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Botão hamburger — visível apenas em mobile */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
        aria-label="Abrir menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop escurecido */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer lateral */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-card border-r border-border shadow-xl lg:hidden">
            {/* Cabeçalho do drawer com botão fechar */}
            <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-border px-4">
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
                aria-label="Fechar menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Conteúdo da sidebar */}
            <div className="flex-1 overflow-y-auto">
              <Sidebar apostilasLabel={apostilasLabel} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
