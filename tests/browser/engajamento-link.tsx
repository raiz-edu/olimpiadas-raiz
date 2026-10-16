import type { ComponentProps } from "react";

// Simula a troca de searchParams sem remontar o painel, como nos links Next.
export default function FixtureLink({ href, onClick, ...props }: ComponentProps<"a">) {
  return (
    <a
      {...props}
      href={href}
      onClick={(evento) => {
        onClick?.(evento);
        if (
          !href ||
          evento.defaultPrevented ||
          evento.button !== 0 ||
          evento.metaKey ||
          evento.ctrlKey ||
          evento.shiftKey ||
          evento.altKey
        )
          return;
        evento.preventDefault();
        window.history.pushState(null, "", href);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }}
    />
  );
}
