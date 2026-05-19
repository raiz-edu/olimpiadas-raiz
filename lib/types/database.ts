// =============================================================================
// Tipos gerados manualmente a partir da migration 001.
// Após provisionar o Supabase, regenerar com:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

export type ClassificacaoOlimpiada = "obrigatoria" | "facultativa";
export type StatusInscricao = "pendente" | "confirmada" | "cancelada";
export type TipoResultado =
  | "aprovado"
  | "nao_aprovado"
  | "ouro"
  | "prata"
  | "bronze"
  | "mencao_honrosa";
export type RoleUsuario = "admin_rede" | "coord_marca" | "coord_unidade" | "professor";
export type TipoFase = "inscricao" | "prova_1" | "prova_2" | "final" | "divulgacao";

// ---------------------------------------------------------------------------
// DATABASE TYPES
// ---------------------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      marca: {
        Row: {
          id: string;
          nome: string;
          slug: string;
          cor_primaria: string | null;
          logo_url: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          slug: string;
          cor_primaria?: string | null;
          logo_url?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          slug?: string;
          cor_primaria?: string | null;
          logo_url?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
      };
      unidade: {
        Row: {
          id: string;
          marca_id: string;
          nome: string;
          cidade: string | null;
          estado: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          marca_id: string;
          nome: string;
          cidade?: string | null;
          estado?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          marca_id?: string;
          nome?: string;
          cidade?: string | null;
          estado?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
      };
      turma: {
        Row: {
          id: string;
          unidade_id: string;
          nome: string;
          serie: string;
          ano_letivo: number;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          unidade_id: string;
          nome: string;
          serie: string;
          ano_letivo: number;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          unidade_id?: string;
          nome?: string;
          serie?: string;
          ano_letivo?: number;
          ativo?: boolean;
          created_at?: string;
        };
      };
      aluno: {
        Row: {
          id: string;
          turma_id: string;
          nome: string;
          data_nascimento: string;
          cpf: string | null;
          email_responsavel: string | null;
          telefone_responsavel: string | null;
          consentimento_responsavel: boolean;
          consentimento_data: string | null;
          consentimento_documento_url: string | null;
          consentimento_responsavel_nome: string | null;
          consentimento_responsavel_documento: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          turma_id: string;
          nome: string;
          data_nascimento: string;
          cpf?: string | null;
          email_responsavel?: string | null;
          telefone_responsavel?: string | null;
          consentimento_responsavel?: boolean;
          consentimento_data?: string | null;
          consentimento_documento_url?: string | null;
          consentimento_responsavel_nome?: string | null;
          consentimento_responsavel_documento?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          turma_id?: string;
          nome?: string;
          data_nascimento?: string;
          cpf?: string | null;
          email_responsavel?: string | null;
          telefone_responsavel?: string | null;
          consentimento_responsavel?: boolean;
          consentimento_data?: string | null;
          consentimento_documento_url?: string | null;
          consentimento_responsavel_nome?: string | null;
          consentimento_responsavel_documento?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
      };
      usuario: {
        Row: {
          id: string;
          nome: string;
          email: string;
          role: RoleUsuario;
          marca_ativa_id: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          role: RoleUsuario;
          marca_ativa_id?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          role?: RoleUsuario;
          marca_ativa_id?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
      };
      usuario_marca: {
        Row: { usuario_id: string; marca_id: string };
        Insert: { usuario_id: string; marca_id: string };
        Update: { usuario_id?: string; marca_id?: string };
      };
      usuario_unidade: {
        Row: { usuario_id: string; unidade_id: string };
        Insert: { usuario_id: string; unidade_id: string };
        Update: { usuario_id?: string; unidade_id?: string };
      };
      usuario_turma: {
        Row: { usuario_id: string; turma_id: string };
        Insert: { usuario_id: string; turma_id: string };
        Update: { usuario_id?: string; turma_id?: string };
      };
      convite: {
        Row: {
          id: string;
          email: string;
          role: RoleUsuario;
          marca_id: string | null;
          unidade_id: string | null;
          token: string;
          criado_por: string | null;
          expires_at: string;
          aceito_em: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: RoleUsuario;
          marca_id?: string | null;
          unidade_id?: string | null;
          token?: string;
          criado_por?: string | null;
          expires_at?: string;
          aceito_em?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: RoleUsuario;
          marca_id?: string | null;
          unidade_id?: string | null;
          token?: string;
          criado_por?: string | null;
          expires_at?: string;
          aceito_em?: string | null;
          created_at?: string;
        };
      };
      olimpiada: {
        Row: {
          id: string;
          nome: string;
          area_conhecimento: string;
          classificacao: ClassificacaoOlimpiada;
          organizacao_promotora: string | null;
          descricao_html: string | null;
          caracteristicas_html: string | null;
          regulamento_url: string | null;
          regulamento_link_externo: string | null;
          premiacao: string | null;
          series_elegiveis: string[];
          faixa_etaria_min: number | null;
          faixa_etaria_max: number | null;
          ano_letivo: number;
          limite_vagas_total: number | null;
          ativo: boolean;
          created_at: string;
          created_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          area_conhecimento: string;
          classificacao: ClassificacaoOlimpiada;
          organizacao_promotora?: string | null;
          descricao_html?: string | null;
          caracteristicas_html?: string | null;
          regulamento_url?: string | null;
          regulamento_link_externo?: string | null;
          premiacao?: string | null;
          series_elegiveis?: string[];
          faixa_etaria_min?: number | null;
          faixa_etaria_max?: number | null;
          ano_letivo: number;
          limite_vagas_total?: number | null;
          ativo?: boolean;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          area_conhecimento?: string;
          classificacao?: ClassificacaoOlimpiada;
          organizacao_promotora?: string | null;
          descricao_html?: string | null;
          caracteristicas_html?: string | null;
          regulamento_url?: string | null;
          regulamento_link_externo?: string | null;
          premiacao?: string | null;
          series_elegiveis?: string[];
          faixa_etaria_min?: number | null;
          faixa_etaria_max?: number | null;
          ano_letivo?: number;
          limite_vagas_total?: number | null;
          ativo?: boolean;
          created_at?: string;
          created_by?: string | null;
          updated_at?: string;
        };
      };
      olimpiada_marca: {
        Row: { olimpiada_id: string; marca_id: string };
        Insert: { olimpiada_id: string; marca_id: string };
        Update: { olimpiada_id?: string; marca_id?: string };
      };
      olimpiada_fase: {
        Row: {
          id: string;
          olimpiada_id: string;
          tipo: TipoFase;
          nome: string;
          data_inicio: string;
          data_fim: string;
          ordem: number;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          olimpiada_id: string;
          tipo: TipoFase;
          nome: string;
          data_inicio: string;
          data_fim: string;
          ordem: number;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          olimpiada_id?: string;
          tipo?: TipoFase;
          nome?: string;
          data_inicio?: string;
          data_fim?: string;
          ordem?: number;
          observacoes?: string | null;
          created_at?: string;
        };
      };
      inscricao: {
        Row: {
          id: string;
          olimpiada_id: string;
          aluno_id: string;
          status: StatusInscricao;
          inscrito_em: string;
          inscrito_por: string | null;
          observacoes: string | null;
          cancelado_em: string | null;
          cancelado_motivo: string | null;
        };
        Insert: {
          id?: string;
          olimpiada_id: string;
          aluno_id: string;
          status?: StatusInscricao;
          inscrito_em?: string;
          inscrito_por?: string | null;
          observacoes?: string | null;
          cancelado_em?: string | null;
          cancelado_motivo?: string | null;
        };
        Update: {
          id?: string;
          olimpiada_id?: string;
          aluno_id?: string;
          status?: StatusInscricao;
          inscrito_em?: string;
          inscrito_por?: string | null;
          observacoes?: string | null;
          cancelado_em?: string | null;
          cancelado_motivo?: string | null;
        };
      };
      resultado: {
        Row: {
          id: string;
          inscricao_id: string;
          fase_id: string;
          tipo: TipoResultado;
          pontuacao: number | null;
          observacoes: string | null;
          comprovante_url: string | null;
          registrado_em: string;
          registrado_por: string | null;
        };
        Insert: {
          id?: string;
          inscricao_id: string;
          fase_id: string;
          tipo: TipoResultado;
          pontuacao?: number | null;
          observacoes?: string | null;
          comprovante_url?: string | null;
          registrado_em?: string;
          registrado_por?: string | null;
        };
        Update: {
          id?: string;
          inscricao_id?: string;
          fase_id?: string;
          tipo?: TipoResultado;
          pontuacao?: number | null;
          observacoes?: string | null;
          comprovante_url?: string | null;
          registrado_em?: string;
          registrado_por?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: number;
          usuario_id: string | null;
          entidade: string;
          entidade_id: string;
          acao: "create" | "update" | "delete";
          dados_antes: Json | null;
          dados_depois: Json | null;
          ip: string | null;
          user_agent: string | null;
          ocorreu_em: string;
        };
        Insert: {
          id?: number;
          usuario_id?: string | null;
          entidade: string;
          entidade_id: string;
          acao: "create" | "update" | "delete";
          dados_antes?: Json | null;
          dados_depois?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          ocorreu_em?: string;
        };
        Update: {
          id?: number;
          usuario_id?: string | null;
          entidade?: string;
          entidade_id?: string;
          acao?: "create" | "update" | "delete";
          dados_antes?: Json | null;
          dados_depois?: Json | null;
          ip?: string | null;
          user_agent?: string | null;
          ocorreu_em?: string;
        };
      };
    };
    Views: {
      v_dashboard_inscricoes: {
        Row: {
          inscricao_id: string;
          olimpiada_id: string;
          olimpiada_nome: string;
          area_conhecimento: string;
          classificacao: ClassificacaoOlimpiada;
          ano_letivo: number;
          marca_id: string;
          marca_nome: string;
          unidade_id: string;
          unidade_nome: string;
          turma_id: string;
          serie: string;
          turma_ano_letivo: number;
          aluno_id: string;
          aluno_nome: string;
          status: StatusInscricao;
          inscrito_em: string;
        };
      };
    };
    Functions: {
      user_marca_ids: {
        Args: Record<never, never>;
        Returns: string[];
      };
      user_unidade_ids: {
        Args: Record<never, never>;
        Returns: string[];
      };
      user_turma_ids: {
        Args: Record<never, never>;
        Returns: string[];
      };
      current_user_role: {
        Args: Record<never, never>;
        Returns: RoleUsuario;
      };
      inscrever_com_lock: {
        Args: {
          p_olimpiada_id: string;
          p_aluno_id: string;
          p_usuario_id: string;
        };
        Returns: string;
      };
      cancelar_inscricoes_olimpiada: {
        Args: { p_olimpiada_id: string; p_motivo?: string };
        Returns: number;
      };
    };
    Enums: {
      classificacao_olimpiada: ClassificacaoOlimpiada;
      status_inscricao: StatusInscricao;
      tipo_resultado: TipoResultado;
      role_usuario: RoleUsuario;
      tipo_fase: TipoFase;
    };
  };
};

// ---------------------------------------------------------------------------
// Helpers de acesso type-safe
// ---------------------------------------------------------------------------

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type DbEnums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

// Aliases convenientes
export type Marca = Tables<"marca">;
export type Unidade = Tables<"unidade">;
export type Turma = Tables<"turma">;
export type Aluno = Tables<"aluno">;
export type Usuario = Tables<"usuario">;
export type Olimpiada = Tables<"olimpiada">;
export type OlimpiadaFase = Tables<"olimpiada_fase">;
export type Inscricao = Tables<"inscricao">;
export type Resultado = Tables<"resultado">;
export type Convite = Tables<"convite">;
export type DashboardInscricao = Views<"v_dashboard_inscricoes">;
