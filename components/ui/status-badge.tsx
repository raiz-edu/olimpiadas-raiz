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
    <span className={`text-xs font-medium ${ativo ? "text-foreground" : "text-muted-foreground"}`}>
      {ativo ? labelAtivo : labelInativo}
    </span>
  );
}
