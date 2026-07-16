"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Revela o conteúdo com fade + translate sutil quando entra no viewport.
 * Progressive enhancement: sem JS, o conteúdo fica visível (classe inicial
 * é aplicada só quando o observer existe).
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.opacity = "1";
            el.style.transform = "none";
            obs.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}
