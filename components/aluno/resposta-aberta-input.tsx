"use client";

import { useState, useRef } from "react";
import type { FeedbackIA, ItemAvaliacao } from "@/lib/ai/types";

const TEAL = "rgb(91,184,193)";

const ITENS = ["a", "b", "c"] as const;
type Item = (typeof ITENS)[number];

const STATUS_CONFIG: Record<
  ItemAvaliacao["status"],
  { border: string; bg: string; text: string; label: string }
> = {
  correto: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    text: "text-emerald-400",
    label: "✓ Correto",
  },
  parcial: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/8",
    text: "text-amber-400",
    label: "◑ Parcial",
  },
  incorreto: {
    border: "border-red-500/30",
    bg: "bg-red-500/8",
    text: "text-red-400",
    label: "✗ Incorreto",
  },
  nao_respondido: {
    border: "border-border",
    bg: "bg-card",
    text: "text-muted-foreground",
    label: "— Não respondido",
  },
};

const SIMBOLOS_MATH = [
  { label: "²", value: "²" },
  { label: "³", value: "³" },
  { label: "√", value: "√" },
  { label: "×", value: "×" },
  { label: "÷", value: "÷" },
  { label: "≤", value: "≤" },
  { label: "≥", value: "≥" },
  { label: "≠", value: "≠" },
  { label: "π", value: "π" },
  { label: "½", value: "½" },
  { label: "⅓", value: "⅓" },
  { label: "¼", value: "¼" },
];

interface InputProps {
  questaoId: string;
  contexto: string;
  aulaId?: string;
  action: (payload: FormData) => void;
  isPending: boolean;
}

export function RespostaAbertaInput({
  questaoId,
  contexto,
  aulaId,
  action,
  isPending,
}: InputProps) {
  const [itemAtivo, setItemAtivo] = useState<Item>("a");
  const [textos, setTextos] = useState<Record<Item, string>>({ a: "", b: "", c: "" });
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const temConteudo = ITENS.some((i) => textos[i].trim());
  const respostaFinal = ITENS.filter((i) => textos[i].trim())
    .map((i) => `${i}) ${textos[i].trim()}`)
    .join("\n\n");

  function setTextoItem(item: Item, value: string) {
    setTextos((prev) => ({ ...prev, [item]: value }));
  }

  function trocarItem(item: Item) {
    setItemAtivo(item);
    setOcrStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function processarFoto(file: File) {
    setOcrStatus("processing");
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["por", "eng"]);
      const { data } = await worker.recognize(file);
      await worker.terminate();
      setTextoItem(itemAtivo, data.text.trim());
      setOcrStatus("done");
    } catch {
      setOcrStatus("error");
    }
  }

  function tentarNovamente() {
    setOcrStatus("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function inserirSimbolo(simbolo: string) {
    const el = textareaRef.current;
    const texto = textos[itemAtivo];
    if (!el) {
      setTextoItem(itemAtivo, texto + simbolo);
      return;
    }
    const start = el.selectionStart ?? texto.length;
    const end = el.selectionEnd ?? texto.length;
    setTextoItem(itemAtivo, texto.slice(0, start) + simbolo + texto.slice(end));
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + simbolo.length;
      el.focus();
    }, 0);
  }

  return (
    <div className="space-y-3 mb-5">
      {/* Abas por item */}
      <div className="flex gap-2">
        {ITENS.map((i) => {
          const ativo = i === itemAtivo;
          const temTexto = !!textos[i].trim();
          return (
            <button
              key={i}
              type="button"
              onClick={() => trocarItem(i)}
              className={`relative rounded-lg px-4 py-1.5 text-sm font-bold transition-colors ${
                ativo
                  ? "text-[#0f172a]"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
              style={ativo ? { background: TEAL } : {}}
            >
              {i})
              {temTexto && !ativo && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Form */}
      <form action={action}>
        <input type="hidden" name="questao_id" value={questaoId} />
        <input type="hidden" name="contexto" value={contexto} />
        {aulaId && <input type="hidden" name="aula_id" value={aulaId} />}
        <input type="hidden" name="resposta_texto" value={respostaFinal} />

        {/* Textarea do item ativo */}
        <textarea
          ref={textareaRef}
          key={itemAtivo}
          value={textos[itemAtivo]}
          onChange={(e) => setTextoItem(itemAtivo, e.target.value)}
          placeholder={`Resolução do item ${itemAtivo})…`}
          rows={4}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-[rgb(91,184,193)] resize-none mb-2"
        />

        {/* Toolbar matemática */}
        <div className="flex flex-wrap gap-1 mb-2">
          {SIMBOLOS_MATH.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => inserirSimbolo(s.value)}
              className="rounded px-2 py-1 text-sm font-mono border border-border text-muted-foreground hover:text-foreground hover:border-[rgb(91,184,193)] transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Botão foto inline */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {ocrStatus === "idle" && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              📷 Foto para item {itemAtivo})
            </button>
          )}
          {ocrStatus === "processing" && (
            <span className="text-xs text-muted-foreground animate-pulse">Lendo imagem…</span>
          )}
          {ocrStatus === "done" && (
            <>
              <span className="text-xs text-amber-400/80">Revise o texto extraído.</span>
              <button
                type="button"
                onClick={tentarNovamente}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Tentar outra imagem
              </button>
            </>
          )}
          {ocrStatus === "error" && (
            <>
              <span className="text-xs text-amber-400">Não foi possível ler a imagem.</span>
              <button
                type="button"
                onClick={tentarNovamente}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Tentar outra imagem
              </button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processarFoto(file);
            }}
          />
          <span className="text-xs text-muted-foreground/30">
            A imagem é processada localmente.
          </span>
        </div>

        <button
          type="submit"
          disabled={isPending || !temConteudo}
          className="rounded-lg px-5 py-2.5 text-sm font-bold text-[#0f172a] disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          style={{ background: TEAL }}
        >
          {isPending ? "Avaliando…" : "Enviar resposta"}
        </button>
      </form>
    </div>
  );
}

export function FeedbackAberto({ feedback }: { feedback: FeedbackIA }) {
  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden mb-4">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={TEAL} strokeWidth="2">
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: TEAL }}>
          Avaliação
        </span>
      </div>

      <div className="p-5 space-y-3">
        {feedback.itens.map((item) => {
          const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.incorreto;
          return (
            <div key={item.item} className={`rounded-lg border px-4 py-3 ${cfg.border} ${cfg.bg}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase ${cfg.text}`}>Item {item.item}</span>
                <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
              </div>
              {item.comentario && (
                <p className="text-xs text-muted-foreground leading-relaxed">{item.comentario}</p>
              )}
            </div>
          );
        })}

        {feedback.resumo && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
            {feedback.resumo}
          </p>
        )}
      </div>
    </div>
  );
}
