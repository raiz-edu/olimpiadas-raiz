type StatusBadgeProps = {
  ativo: boolean;
  labelAtivo?: string;
  labelInativo?: string;
};

export function StatusBadge({
  ativo,
  labelAtivo = "Ativo",
  labelInativo = "Inativo",
}: StatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${ativo ? "bg-emerald-400" : "bg-muted-foreground/40"}`}
        aria-hidden="true"
      />
      <span
        className={`text-xs font-medium ${ativo ? "text-foreground" : "text-muted-foreground"}`}
      >
        {ativo ? labelAtivo : labelInativo}
      </span>
    </span>
  );
}
