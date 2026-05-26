type Material = {
  id: string;
  nome: string;
  arquivo_path: string;
  criado_em: string;
  signedUrl: string | null;
};

export function MaterialList({ materiais }: { materiais: Material[] }) {
  if (materiais.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Materiais
      </h2>
      <div className="space-y-2">
        {materiais.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <svg
                className="h-4 w-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="flex-1 min-w-0 truncate text-sm text-foreground">{m.nome}</p>
            {m.signedUrl ? (
              <a
                href={m.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-background transition-colors"
              >
                Baixar
              </a>
            ) : (
              <span className="shrink-0 text-xs text-muted-foreground">Indisponível</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
