"use client";

import { startTransition, useActionState, useState } from "react";
import { BookOpen, GraduationCap, Users, ArrowRight, LockKeyhole } from "lucide-react";
import { concluirCadastroPortal, type CadastroPortalState } from "@/app/aluno/cadastro/actions";
import { PERFIS_PORTAL, SERIES_CADASTRO, type TipoPerfilPortal } from "@/lib/auth/portal-profile";

export type CadastroPortalFormProps = {
  identificado: boolean;
  unidades: { id: string; nome: string }[];
  unidadeAtual: string | null;
  serieAtual: string | null;
  serieOficial?: boolean;
  catalogoIndisponivel: boolean;
  popup: boolean;
};
const icones = { aluno: GraduationCap, professor: BookOpen, colaborador: Users };

export function CadastroPortalForm(props: CadastroPortalFormProps) {
  const [tipo, setTipo] = useState<TipoPerfilPortal | "">(props.identificado ? "aluno" : "");
  const [unidade, setUnidade] = useState(props.unidadeAtual ?? "");
  const [serie, setSerie] = useState(props.serieAtual ?? "");
  const [state, action, pending] = useActionState<CadastroPortalState, FormData>(
    concluirCadastroPortal,
    null,
  );
  const semUnidades = props.catalogoIndisponivel || props.unidades.length === 0;
  const inputClass =
    "mt-2 w-full rounded-xl border border-input bg-background px-3 py-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        // Despacho explícito mantém as escolhas durante falhas recuperáveis.
        startTransition(() => action(data));
      }}
      onReset={(event) => event.preventDefault()}
      className="space-y-6"
    >
      {props.popup && <input type="hidden" name="popup" value="1" />}
      <fieldset disabled={pending}>
        <legend className="mb-3 text-sm font-semibold text-foreground">
          Como você vai usar a plataforma?
        </legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {(Object.keys(PERFIS_PORTAL) as TipoPerfilPortal[]).map((valor) => {
            const Icone = icones[valor];
            const bloqueado = props.identificado && valor !== "aluno";
            return (
              <label
                key={valor}
                className={`relative flex cursor-pointer flex-col gap-3 rounded-2xl border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${tipo === valor ? "border-primary bg-primary/8" : "border-border bg-background hover:border-primary/50"} ${bloqueado ? "cursor-default opacity-45" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <Icone aria-hidden="true" className="h-5 w-5 text-primary" />
                  <input
                    type="radio"
                    name="tipo_usuario"
                    value={valor}
                    checked={tipo === valor}
                    onChange={() => setTipo(valor)}
                    disabled={bloqueado}
                    required
                    className="h-4 w-4 accent-primary"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {PERFIS_PORTAL[valor].titulo}
                </span>
                <span className="text-xs leading-relaxed text-muted-foreground">
                  {PERFIS_PORTAL[valor].descricao}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {props.identificado && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole aria-hidden="true" className="h-4 w-4 shrink-0" />
          Seu vínculo escolar já identifica você como aluno. Para corrigir, fale com a coordenação.
        </p>
      )}

      {tipo === "aluno" && (
        <fieldset
          disabled={pending}
          className="space-y-4 rounded-2xl border border-border bg-background/60 p-5"
        >
          <legend className="px-1 text-sm font-semibold text-foreground">Sua escola</legend>
          <p className="text-sm text-muted-foreground">
            Esses dados ajudam a equipe pedagógica a acompanhar sua evolução.
          </p>
          {semUnidades ? (
            <div role="alert" className="rounded-xl bg-amber-500/10 p-4 text-sm text-foreground">
              <p>
                {props.catalogoIndisponivel
                  ? "Não foi possível carregar as unidades da sua marca."
                  : "Sua marca ainda não tem unidades disponíveis para cadastro. Fale com a coordenação."}
              </p>
              {props.catalogoIndisponivel && (
                <a
                  className="mt-2 inline-block font-semibold underline"
                  href={`/aluno/cadastro${props.popup ? "?popup=1" : ""}`}
                >
                  Tentar novamente
                </a>
              )}
            </div>
          ) : (
            <label className="block text-sm font-medium text-foreground">
              Unidade
              <select
                name="unidade_id"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecione sua unidade</option>
                {props.unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium text-foreground">
            Série
            {props.serieOficial && props.serieAtual ? (
              <>
                <input type="hidden" name="serie" value={props.serieAtual} />
                <input
                  readOnly
                  aria-label="Série oficial"
                  value={props.serieAtual}
                  className={inputClass}
                />
                <span className="mt-2 block text-xs font-normal text-muted-foreground">
                  Série do seu cadastro escolar. Correções devem ser solicitadas à coordenação.
                </span>
              </>
            ) : (
              <select
                name="serie"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">Selecione sua série</option>
                {props.serieAtual && !SERIES_CADASTRO.some((s) => s.valor === props.serieAtual) && (
                  <option value={props.serieAtual}>{props.serieAtual}</option>
                )}
                {SERIES_CADASTRO.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.nome}
                  </option>
                ))}
              </select>
            )}
          </label>
        </fieldset>
      )}
      {(tipo === "professor" || tipo === "colaborador") && (
        <p className="rounded-xl bg-primary/8 p-4 text-sm leading-relaxed text-muted-foreground">
          Você poderá explorar a área de estudos. Para acessar a gestão pedagógica, use o acesso da
          equipe com as permissões da sua conta.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !tipo || (tipo === "aluno" && semUnidades)}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
      >
        {pending ? "Salvando…" : "Continuar"}
        <ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
    </form>
  );
}
