import { useSyncExternalStore } from "react";
const inscrever = (callback: () => void) => {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
};
export function usePathname() {
  return useSyncExternalStore(
    inscrever,
    () => window.location.pathname,
    () => "/analytics/acessos",
  );
}
export function useEnderecoAcessos() {
  return useSyncExternalStore(
    inscrever,
    () => window.location.href,
    () => "http://127.0.0.1:3104/analytics/acessos",
  );
}
