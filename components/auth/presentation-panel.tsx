"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

function subscribe(callback: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function PresentationPanel({ html }: { html: string }) {
  const isDesktop = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isDesktop) return null;

  return (
    <div className="relative h-full w-full">
      <iframe
        srcDoc={html}
        className="absolute inset-0 h-full w-full"
        style={{ border: "none", pointerEvents: "none" }}
        title="A Trilha Olímpica"
      />
      {/* Vinheta — fades em todas as bordas */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: [
            "linear-gradient(to right,  #0f172a 0%, transparent 15%, transparent 80%, #0f172a 100%)",
            "linear-gradient(to bottom, #0f172a 0%, transparent 12%, transparent 88%, #0f172a 100%)",
          ].join(", "),
        }}
      />
    </div>
  );
}
