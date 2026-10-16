// Adaptador exclusivo do harness visual. Nunca importado pelo aplicativo.
export type CadastroPortalState = { error: string } | null;
export async function concluirCadastroPortal(_state: CadastroPortalState, form: FormData) {
  Object.assign(window, { cadastroEnviado: Object.fromEntries(form.entries()) });
  return { error: "Falha de conexão simulada. Tente novamente." };
}
