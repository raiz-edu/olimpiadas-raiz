"use client";

export const MATH_SYMBOL_GROUPS: { label: string; symbols: string[] }[] = [
  { label: "Índices", symbols: ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"] },
  { label: "Expoentes", symbols: ["⁰", "¹", "²", "³", "⁴", "ⁿ"] },
  { label: "Operadores", symbols: ["×", "÷", "·", "±", "≤", "≥", "≠", "≈", "√"] },
  { label: "Frações", symbols: ["½", "⅓", "⅔", "¼", "¾"] },
  { label: "Outros", symbols: ["π", "°", "′", "″", "∞", "Δ", "θ", "α", "β"] },
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

export function MathToolbar({ onInsert }: { onInsert: (symbol: string) => void }) {
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
    </div>
  );
}
