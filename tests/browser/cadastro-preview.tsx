import { createRoot } from "react-dom/client";
import { CadastroPortalForm } from "@/components/aluno/cadastro-form";
import "@/app/globals.css";

const params = new URLSearchParams(window.location.search);
document.documentElement.style.setProperty("--font-inter", "Arial, sans-serif");
document.documentElement.classList.toggle("dark", params.get("tema") === "escuro");
createRoot(document.getElementById("root")!).render(
  <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-12">
    <div className="mx-auto max-w-3xl">
      <p className="mb-8 text-sm font-semibold text-primary">
        Plataforma Olímpica · Verificação com dados sintéticos
      </p>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
        Primeiro acesso
      </p>
      <h1 className="text-3xl font-bold tracking-tight">Vamos preparar seu espaço</h1>
      <p className="mb-7 mt-3 text-sm text-muted-foreground">
        Confirme seu perfil para começar. Você só precisa fazer isso uma vez.
      </p>
      <section
        aria-label="Sua conta institucional"
        className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
      >
        <div>
          <p className="text-xs text-muted-foreground">Conta verificada</p>
          <p className="mt-1 font-semibold">Pessoa de teste</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">pessoa@escola.example</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Marca identificada</p>
          <p className="mt-1 font-semibold">Escola de demonstração</p>
        </div>
      </section>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <CadastroPortalForm
          identificado={params.has("identificado")}
          unidades={
            params.has("catalogo")
              ? []
              : [
                  {
                    id: "30000000-0000-4000-8000-000000000001",
                    nome: "Unidade Centro — demonstração",
                  },
                  {
                    id: "30000000-0000-4000-8000-000000000002",
                    nome: "Unidade Norte — demonstração",
                  },
                ]
          }
          unidadeAtual={null}
          serieAtual={params.has("oficial") ? "6º Ano" : null}
          serieOficial={params.has("oficial")}
          catalogoIndisponivel={params.has("catalogo")}
          popup={true}
        />
      </div>
    </div>
  </main>,
);
