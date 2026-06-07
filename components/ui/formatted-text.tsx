import type { ReactNode } from "react";

const FORMAT_REGEX = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;

export function renderFormattedText(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = FORMAT_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      parts.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      parts.push(<em key={key++}>{match[2]}</em>);
    }
    lastIndex = FORMAT_REGEX.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts;
}

export function FormattedText({ text }: { text: string }) {
  return <>{renderFormattedText(text)}</>;
}
