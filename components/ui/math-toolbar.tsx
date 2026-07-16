"use client";

export const MATH_SYMBOL_GROUPS: { label: string; symbols: string[] }[] = [
  { label: "Índices", symbols: ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉", "ₙ"] },
  {
    label: "Expoentes",
    symbols: ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹", "⁻", "ⁿ"],
  },
  {
    label: "Operadores",
    symbols: ["×", "÷", "·", "±", "≤", "≥", "≠", "≈", "√", "∠", "∥", "⊥", "≅", "∈", "∪", "∩"],
  },
  { label: "Frações", symbols: ["½", "⅓", "⅔", "¼", "¾", "⅕", "⅙", "⅛"] },
  { label: "Outros", symbols: ["π", "°", "′", "″", "∞", "Δ", "θ", "α", "β", "γ", "λ", "μ", "…"] },
];

export function insertAtCursor(
  el: HTMLTextAreaElement,
  value: string,
  current: string,
  onChange: (next: string) => void,
) {
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + value + current.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start + value.length, start + value.length);
  });
}

// ── Conversão de seleção em expoente/índice ───────────────────────────────────

export type ConversaoMath = "expoente" | "indice";

const SUP_MAP: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "-": "⁻",
  "(": "⁽",
  ")": "⁾",
  n: "ⁿ",
  i: "ⁱ",
};

const SUB_MAP: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
  "+": "₊",
  "-": "₋",
  "(": "₍",
  ")": "₎",
  n: "ₙ",
  a: "ₐ",
  e: "ₑ",
  x: "ₓ",
  i: "ᵢ",
  k: "ₖ",
  m: "ₘ",
};

/**
 * Converte o trecho selecionado em expoente ou índice, caractere a caractere
 * ("25" → "²⁵"). Caracteres sem equivalente Unicode ficam como estão.
 * Sem seleção, não faz nada.
 */
export function convertSelection(
  el: HTMLTextAreaElement,
  modo: ConversaoMath,
  current: string,
  onChange: (next: string) => void,
) {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;

  const map = modo === "expoente" ? SUP_MAP : SUB_MAP;
  const convertido = Array.from(current.slice(start, end))
    .map((ch) => map[ch] ?? ch)
    .join("");

  onChange(current.slice(0, start) + convertido + current.slice(end));
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(start, start + convertido.length);
  });
}

export function MathToolbar({
  onInsert,
  onConvert,
}: {
  onInsert: (symbol: string) => void;
  onConvert?: (modo: ConversaoMath) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      {MATH_SYMBOL_GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {group.label}
          </span>
          {group.symbols.map((s) => (
            <button
              key={s}
              type="button"
              title={`Inserir ${s}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(s)}
              className="rounded border border-border px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      ))}
      {onConvert && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            Seleção
          </span>
          <button
            type="button"
            title="Converter o trecho selecionado em expoente (ex.: 25 → ²⁵)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onConvert("expoente")}
            className="rounded border border-border px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            xⁿ
          </button>
          <button
            type="button"
            title="Converter o trecho selecionado em índice (ex.: 12 → ₁₂)"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onConvert("indice")}
            className="rounded border border-border px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            xₙ
          </button>
        </div>
      )}
    </div>
  );
}
