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
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <span
        className={`mr-1 h-1.5 w-1.5 rounded-full ${ativo ? "bg-green-500" : "bg-gray-400"}`}
        aria-hidden="true"
      />
      {ativo ? labelAtivo : labelInativo}
    </span>
  );
}
