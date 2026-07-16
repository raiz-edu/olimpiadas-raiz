"use client";

import { useEffect, useRef } from "react";

/**
 * Número que conta de 0 até `value` quando entra no viewport — ease-out cúbico.
 * Sem JS, o valor final fica visível (renderizado no server).
 */
export function CountUp({
  value,
  suffix = "",
  duration = 1600,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const fmt = (n: number) => n.toLocaleString("pt-BR") + suffix;

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          obs.disconnect();
          const t0 = performance.now();
          const tick = (t: number) => {
            const p = Math.min((t - t0) / duration, 1);
            el.textContent = fmt(Math.round(value * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [value, suffix, duration]);

  return (
    <span ref={ref} className={className}>
      {value.toLocaleString("pt-BR")}
      {suffix}
    </span>
  );
}

/** Barra de progresso que anima a largura ao entrar no viewport. */
export function BarraAnimada({ pct, className }: { pct: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    el.style.width = "0%";
    el.style.transition = "width 1.4s cubic-bezier(.4,0,.2,1) 200ms";

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.style.width = `${pct}%`;
            obs.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct]);

  return <div ref={ref} className={className} style={{ width: `${pct}%` }} />;
}
