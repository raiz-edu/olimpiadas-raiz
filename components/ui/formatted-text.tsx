import type { ReactNode } from "react";

const FORMAT_REGEX = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

// Radical unicode: √ seguido do radicando — grupo entre parênteses ou sequência
// alfanumérica (sobrescritos e π inclusos, decimal com vírgula). O dado permanece
// unicode puro; o vínculo (traço sobre o radicando) é desenhado no render, senão
// "(2a²√3)/3" deixa ambíguo até onde a raiz alcança.
const RADICAL_REGEX = /√(\([^()]+\)|[0-9A-Za-zπ²³¹⁰-⁹]+(?:,[0-9]+)?)/g;

// Offsets calibrados visualmente (harness 2026-08-11): o traço parte do gancho do
// √ (left negativo cobre o vão) e corre 0.09em abaixo do topo da linha — na cap
// height dos algarismos, onde o gancho do glifo termina.
const VINCULO_STYLE = {
  left: "-0.09em",
  right: 0,
  top: "0.09em",
  borderTop: "0.07em solid currentColor",
} as const;

function renderMathSegments(text: string, keyBase: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  let match: RegExpExecArray | null;
  RADICAL_REGEX.lastIndex = 0;

  while ((match = RADICAL_REGEX.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <span key={`${keyBase}-rad${i++}`} className="whitespace-nowrap">
        √
        <span className="relative">
          <span aria-hidden className="absolute" style={VINCULO_STYLE} />
          {match[1]}
        </span>
      </span>,
    );
    last = RADICAL_REGEX.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));

  return parts;
}

export function renderFormattedText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  FORMAT_REGEX.lastIndex = 0;

  while ((match = FORMAT_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...renderMathSegments(text.slice(lastIndex, match.index), `t${key++}`));
    }
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{renderMathSegments(match[1], `b${key}`)}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{renderMathSegments(match[2], `i${key}`)}</em>);
    }
    lastIndex = FORMAT_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(...renderMathSegments(text.slice(lastIndex), `t${key++}`));
  }

  return parts;
}

export function FormattedText({ text }: { text: string }) {
  return <>{renderFormattedText(text)}</>;
}
