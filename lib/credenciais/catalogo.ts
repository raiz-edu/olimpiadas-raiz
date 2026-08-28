/**
 * Catálogo das integrações que aparecem em /configuracoes/credenciais (issue #159).
 *
 * `gerenciavel: true`  → a chave pode ser gravada no banco (cifrada) e o servidor a
 *                        lê por getCredencial(); a env var é só fallback.
 * `gerenciavel: false` → o código ainda lê direto de process.env; a tela mostra o
 *                        status ("gerida pela infra") sem permitir edição.
 */
export type TesteProvedor = "openai" | "groq";

export type IntegracaoDef = {
  chave: string;
  rotulo: string;
  descricao: string;
  /** Env var lida como fallback (gerenciável) ou como fonte única (não gerenciável). */
  env: string;
  /**
   * Outras env vars que cumprem o mesmo papel em outro ambiente — a tela mostra a
   * primeira que existir. Ex.: na AWS o login pelo Google passa pelo Cognito.
   */
  envAlternativas?: readonly string[];
  obterEm: string;
  gerenciavel: boolean;
  teste?: TesteProvedor;
};

export const CATALOGO_CREDENCIAIS = [
  {
    chave: "openai_api_key",
    rotulo: "OpenAI",
    descricao: "Avaliação das questões discursivas e leitura das fotos dos alunos (texto e visão).",
    env: "OPENAI_API_KEY",
    obterEm: "https://platform.openai.com/api-keys",
    gerenciavel: true,
    teste: "openai",
  },
  {
    chave: "groq_api_key",
    rotulo: "Groq",
    descricao: "Provedor anterior das discursivas; fica como reserva enquanto a troca não termina.",
    env: "GROQ_API_KEY",
    obterEm: "https://console.groq.com/keys",
    gerenciavel: true,
    teste: "groq",
  },
  {
    chave: "resend_api_key",
    rotulo: "Resend",
    descricao: "E-mails de convite para o staff.",
    env: "RESEND_API_KEY",
    obterEm: "https://resend.com/api-keys",
    gerenciavel: false,
  },
  {
    chave: "google_client_secret",
    rotulo: "Google OAuth",
    descricao: "Login do staff e do aluno pelo Google — direto (Supabase) ou pelo Cognito (AWS).",
    env: "GOOGLE_CLIENT_SECRET",
    envAlternativas: ["COGNITO_CLIENT_SECRET"],
    obterEm: "https://console.cloud.google.com/apis/credentials",
    gerenciavel: false,
  },
  {
    chave: "raiz_data_engine_token",
    rotulo: "raiz-data-engine",
    descricao: "Sincronização de dados da rede.",
    env: "RAIZ_DATA_ENGINE_TOKEN",
    obterEm: "integração interna Raiz",
    gerenciavel: false,
  },
] as const satisfies readonly IntegracaoDef[];

/** Chaves que o servidor lê por getCredencial() — só as gerenciáveis. */
export type CredencialChave = "openai_api_key" | "groq_api_key";

export function getDefinicao(chave: string): IntegracaoDef | undefined {
  return CATALOGO_CREDENCIAIS.find((d) => d.chave === chave);
}
