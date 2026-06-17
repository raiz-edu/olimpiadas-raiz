import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!URL || !KEY) throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env.local");

const sb = createClient(URL, KEY);

// Cria tabela via upsert em tabela inexistente não funciona — usar fetch direto
// Supabase não expõe SQL raw via REST API pública; usar a função exec via pg_net ou direto
// Alternativa: usar a Management API do Supabase (requer PAT)

// Tenta criar inserindo diretamente (vai falhar se tabela não existir, mas capturamos o erro)
const { error: checkErr } = await sb.from("configuracao_sistema").select("chave").limit(1);

if (!checkErr) {
  console.log("Tabela já existe. Garantindo seed...");
  const { error } = await sb
    .from("configuracao_sistema")
    .upsert({ chave: "video_login_url", valor: "" });
  if (error) console.error("Seed error:", error.message);
  else console.log("✓ Seed ok");
} else {
  console.log("Tabela não existe. Criando via Management API...");

  // Usa o endpoint de SQL do Supabase Dashboard (requer projeto reference)
  const PROJECT_REF = "ebdazvyyunilbkygtevn";
  const PAT = process.env.SUPABASE_PAT ?? "";

  if (!PAT) {
    console.error(
      "SUPABASE_PAT não definido. Execute: $env:SUPABASE_PAT='seu-token'; node scripts/apply-migration-014.mjs",
    );
    process.exit(1);
  }

  const sql = `
    CREATE TABLE IF NOT EXISTS configuracao_sistema (
      chave         text        PRIMARY KEY,
      valor         text        NOT NULL DEFAULT '',
      atualizado_em timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE configuracao_sistema ENABLE ROW LEVEL SECURITY;
    INSERT INTO configuracao_sistema (chave, valor)
      VALUES ('video_login_url', '')
      ON CONFLICT (chave) DO NOTHING;
  `;

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  if (res.ok) {
    console.log("✓ Tabela criada com sucesso");
  } else {
    console.error("Erro:", res.status, body);
    process.exit(1);
  }
}
