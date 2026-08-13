-- O snapshot preserva os IDs historicos, portanto a sequence precisa continuar
-- depois do maior ID importado para que novos eventos de auditoria nao colidam.
SELECT setval(
  pg_get_serial_sequence('public.audit_log', 'id'),
  COALESCE((SELECT MAX(id) FROM public.audit_log), 0) + 1,
  false
);
