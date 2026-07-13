export const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

export function toSaoPauloDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

export function fromSaoPauloDatetimeLocal(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!trimmed.includes("T") || trimmed.includes("+") || trimmed.endsWith("Z")) return trimmed;
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
  return `${withSeconds}-03:00`;
}
