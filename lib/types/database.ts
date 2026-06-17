// =============================================================================
// Tipos gerados manualmente a partir da migration 001.
// Após provisionar o Supabase, regenerar com:
//   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
//
// NOTA: Todas as tabelas incluem `Relationships: []` — obrigatório para que
// SupabaseClient<Database> infira corretamente os tipos das queries
// (GenericTable de @supabase/supabase-js v2 exige este campo).
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// ---------------------------------------------------------------------------
// ENUMS
// ---------------------------------------------------------------------------

export type ClassificacaoOlimpiada = "obrigatoria" | "facultativa";
export type OlimpiadaQuestao = string; // campo livre desde migration 017
export type TipoQuestao = "multipla_escolha" | "aberta" | "verdadeiro_ou_falso";
export type TipoDificuldade = "elementar" | "facil" | "medio" | "dificil" | "muito_dificil";
export type TipoPublicoAlvo = "EFAI" | "EFAF" | "EM" | "Todos";
export type TipoResolucaoStatus = "sim" | "nao" | "em_producao";
export type TipoStatusCadastro = "publicado" | "aguardando_revisao";
export type StatusInscricao = "pendente" | "confirmada" | "cancelada";
export type TipoResultado =
  | "aprovado"
  | "nao_aprovado"
  | "ouro"
  | "prata"
  | "bronze"
  | "mencao_honrosa";
export type RoleUsuario =
  | "raiz" // flag interno dos admins do sistema — não aparece no seletor de roles
  | "diretor_marca"
  | "gestor_conteudo"
  | "professor"
  | "coordenador"
  | "diretor";
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      aluno: {
        Row: {
          id: string;
          turma_id: string | null;
          nome: string;
          data_nascimento: string;
          cpf: string | null;
          email: string | null;
          email_responsavel: string | null;
          telefone_responsavel: string | null;
          consentimento_responsavel: boolean;
          consentimento_data: string | null;
          consentimento_documento_url: string | null;
          consentimento_responsavel_nome: string | null;
          consentimento_responsavel_documento: string | null;
          supabase_auth_id: string | null;
          consentimento_responsavel_tipo: "pedagogico" | "financeiro" | null;
          ativo: boolean;
          created_at: string;
          marca_id: string | null;
          serie: string | null;
          ra_totvs: string | null;
          codcoligada_totvs: number | null;
          codfilial_totvs: number | null;
          last_login_at: string | null;
          login_count: number;
        };
        Insert: {
          id?: string;
          turma_id?: string | null;
          nome: string;
          data_nascimento: string;
          cpf?: string | null;
          email?: string | null;
          email_responsavel?: string | null;
          telefone_responsavel?: string | null;
          consentimento_responsavel?: boolean;
          consentimento_data?: string | null;
          consentimento_documento_url?: string | null;
          consentimento_responsavel_nome?: string | null;
          consentimento_responsavel_documento?: string | null;
          supabase_auth_id?: string | null;
          consentimento_responsavel_tipo?: "pedagogico" | "financeiro" | null;
          ativo?: boolean;
          created_at?: string;
          marca_id?: string | null;
          serie?: string | null;
          ra_totvs?: string | null;
          codcoligada_totvs?: number | null;
          codfilial_totvs?: number | null;
          last_login_at?: string | null;
          login_count?: number;
        };
        Update: {
          id?: string;
          turma_id?: string | null;
          nome?: string;
          data_nascimento?: string;
          cpf?: string | null;
          email?: string | null;
          email_responsavel?: string | null;
          telefone_responsavel?: string | null;
          consentimento_responsavel?: boolean;
          consentimento_data?: string | null;
          consentimento_documento_url?: string | null;
          consentimento_responsavel_nome?: string | null;
          consentimento_responsavel_documento?: string | null;
          supabase_auth_id?: string | null;
          consentimento_responsavel_tipo?: "pedagogico" | "financeiro" | null;
          ativo?: boolean;
          created_at?: string;
          marca_id?: string | null;
          serie?: string | null;
          ra_totvs?: string | null;
          codcoligada_totvs?: number | null;
          codfilial_totvs?: number | null;
          last_login_at?: string | null;
          login_count?: number;
        };
        Relationships: [];
      };
      usuario: {
        Row: {
          id: string;
          nome: string;
          email: string;
          role: RoleUsuario;
          admin_marca: boolean;
          marca_ativa_id: string | null;
          ativo: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          email: string;
          role: RoleUsuario;
          admin_marca?: boolean;
          marca_ativa_id?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          role?: RoleUsuario;
          admin_marca?: boolean;
          marca_ativa_id?: string | null;
          ativo?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      usuario_marca: {
        Row: { usuario_id: string; marca_id: string };
        Insert: { usuario_id: string; marca_id: string };
        Update: { usuario_id?: string; marca_id?: string };
        Relationships: [];
      };
      usuario_unidade: {
        Row: { usuario_id: string; unidade_id: string };
        Insert: { usuario_id: string; unidade_id: string };
        Update: { usuario_id?: string; unidade_id?: string };
        Relationships: [];
      };
      usuario_turma: {
        Row: { usuario_id: string; turma_id: string };
        Insert: { usuario_id: string; turma_id: string };
        Update: { usuario_id?: string; turma_id?: string };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      olimpiada_marca: {
        Row: { olimpiada_id: string; marca_id: string };
        Insert: { olimpiada_id: string; marca_id: string };
        Update: { olimpiada_id?: string; marca_id?: string };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      preparacao_projeto: {
        Row: {
          id: string;
          olimpiada_sigla: string;
          olimpiada_id: string | null;
          nome: string;
          descricao: string | null;
          ano_letivo: number;
          publicado: boolean;
          ativo: boolean;
          criado_em: string;
        };
        Insert: {
          id?: string;
          olimpiada_sigla: string;
          olimpiada_id?: string | null;
          nome: string;
          descricao?: string | null;
          ano_letivo?: number;
          publicado?: boolean;
          ativo?: boolean;
          criado_em?: string;
        };
        Update: {
          id?: string;
          olimpiada_sigla?: string;
          olimpiada_id?: string | null;
          nome?: string;
          descricao?: string | null;
          ano_letivo?: number;
          publicado?: boolean;
          ativo?: boolean;
          criado_em?: string;
        };
        Relationships: [];
      };
      preparacao_aula: {
        Row: {
          id: string;
          projeto_id: string;
          titulo: string;
          tipo: "online" | "presencial" | "simulado";
          data_hora: string | null;
          duracao_minutos: number | null;
          link_aula: string | null;
          polos: string | null;
          descricao: string | null;
          publicada: boolean;
          ordem: number;
          criado_em: string;
        };
        Insert: {
          id?: string;
          projeto_id: string;
          titulo: string;
          tipo: "online" | "presencial" | "simulado";
          data_hora?: string | null;
          duracao_minutos?: number | null;
          link_aula?: string | null;
          polos?: string | null;
          descricao?: string | null;
          publicada?: boolean;
          ordem?: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          projeto_id?: string;
          titulo?: string;
          tipo?: "online" | "presencial" | "simulado";
          data_hora?: string | null;
          duracao_minutos?: number | null;
          link_aula?: string | null;
          polos?: string | null;
          descricao?: string | null;
          publicada?: boolean;
          ordem?: number;
          criado_em?: string;
        };
        Relationships: [];
      };
      preparacao_aula_questao: {
        Row: { id: string; aula_id: string; questao_id: string; ordem: number; criado_em: string };
        Insert: {
          id?: string;
          aula_id: string;
          questao_id: string;
          ordem?: number;
          criado_em?: string;
        };
        Update: {
          id?: string;
          aula_id?: string;
          questao_id?: string;
          ordem?: number;
          criado_em?: string;
        };
        Relationships: [];
      };
      preparacao_material: {
        Row: { id: string; aula_id: string; nome: string; arquivo_path: string; criado_em: string };
        Insert: {
          id?: string;
          aula_id: string;
          nome: string;
          arquivo_path: string;
          criado_em?: string;
        };
        Update: {
          id?: string;
          aula_id?: string;
          nome?: string;
          arquivo_path?: string;
          criado_em?: string;
        };
        Relationships: [];
      };
      aluno_progresso: {
        Row: {
          id: string;
          aluno_id: string;
          aula_id: string;
          assistido: boolean;
          progresso_segundos: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          aluno_id: string;
          aula_id: string;
          assistido?: boolean;
          progresso_segundos?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          aluno_id?: string;
          aula_id?: string;
          assistido?: boolean;
          progresso_segundos?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_marca: {
        Row: {
          id: string;
          marca_id: string;
          ano_letivo: number;
          tipo: "inscricoes" | "participantes" | "premiados" | "vendas";
          valor: number;
        };
        Insert: {
          id?: string;
          marca_id: string;
          ano_letivo: number;
          tipo: "inscricoes" | "participantes" | "premiados" | "vendas";
          valor?: number;
        };
        Update: {
          id?: string;
          marca_id?: string;
          ano_letivo?: number;
          tipo?: "inscricoes" | "participantes" | "premiados" | "vendas";
          valor?: number;
        };
        Relationships: [];
      };
      questao: {
        Row: {
          id: string;
          olimpiada: OlimpiadaQuestao;
          nivel: string | null;
          fase: number | null;
          ano: number;
          numero: number | null;
          enunciado: string;
          enunciado_blocos: Json | null;
          imagem_url: string | null;
          assunto: string | null;
          topico: string | null;
          subtopico: string | null;
          categoria: string | null;
          tipo: TipoQuestao;
          dificuldade: string | null;
          publico_alvo: string | null;
          tem_resolucao_video: string;
          tem_resolucao_texto: string;
          status_cadastro: string;
          ativo: boolean;
          video_url: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          olimpiada: OlimpiadaQuestao;
          nivel?: string | null;
          fase?: number | null;
          ano: number;
          numero?: number | null;
          enunciado: string;
          enunciado_blocos?: Json | null;
          imagem_url?: string | null;
          assunto?: string | null;
          topico?: string | null;
          subtopico?: string | null;
          categoria?: string | null;
          tipo?: TipoQuestao;
          dificuldade?: string | null;
          publico_alvo?: string | null;
          tem_resolucao_video?: string;
          tem_resolucao_texto?: string;
          status_cadastro?: string;
          ativo?: boolean;
          video_url?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          olimpiada?: OlimpiadaQuestao;
          nivel?: string | null;
          fase?: number | null;
          ano?: number;
          numero?: number | null;
          enunciado?: string;
          enunciado_blocos?: Json | null;
          imagem_url?: string | null;
          assunto?: string | null;
          topico?: string | null;
          subtopico?: string | null;
          categoria?: string | null;
          tipo?: TipoQuestao;
          dificuldade?: string | null;
          publico_alvo?: string | null;
          tem_resolucao_video?: string;
          tem_resolucao_texto?: string;
          status_cadastro?: string;
          ativo?: boolean;
          video_url?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      alternativa: {
        Row: {
          id: string;
          questao_id: string;
          letra: string;
          texto: string | null;
          imagem_url: string | null;
          imagem_largura: string | null;
          correta: boolean;
        };
        Insert: {
          id?: string;
          questao_id: string;
          letra: string;
          texto?: string | null;
          imagem_url?: string | null;
          imagem_largura?: string | null;
          correta?: boolean;
        };
        Update: {
          id?: string;
          questao_id?: string;
          letra?: string;
          texto?: string | null;
          imagem_url?: string | null;
          imagem_largura?: string | null;
          correta?: boolean;
        };
        Relationships: [];
      };
      solucao: {
        Row: {
          id: string;
          questao_id: string;
          texto: string | null;
          imagem_url: string | null;
          imagem_largura: string | null;
          criado_em: string;
        };
        Insert: {
          id?: string;
          questao_id: string;
          texto?: string | null;
          imagem_url?: string | null;
          imagem_largura?: string | null;
          criado_em?: string;
        };
        Update: {
          id?: string;
          questao_id?: string;
          texto?: string | null;
          imagem_url?: string | null;
          imagem_largura?: string | null;
          criado_em?: string;
        };
        Relationships: [];
      };
      resposta_aluno: {
        Row: {
          id: string;
          aluno_id: string;
          questao_id: string;
          alternativa_id: string | null;
          correta: boolean;
          respondido_em: string;
        };
        Insert: {
          id?: string;
          aluno_id: string;
          questao_id: string;
          alternativa_id?: string | null;
          correta: boolean;
          respondido_em?: string;
        };
        Update: {
          id?: string;
          aluno_id?: string;
          questao_id?: string;
          alternativa_id?: string | null;
          correta?: boolean;
          respondido_em?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
      current_aluno_id: {
        Args: Record<never, never>;
        Returns: string | null;
      };
      registrar_login_aluno: {
        Args: { p_aluno_id: string };
        Returns: undefined;
      };
      get_olimpiadas_stats: {
        Args: {
          p_anos: number[];
          p_marcas?: string[] | null;
          p_siglas?: string[] | null;
        };
        Returns: {
          olimpiada_nome: string;
          marca_nome: string;
          ano_letivo: number;
          inscritos: number;
          participantes: number;
          ouro: number;
          prata: number;
          bronze: number;
          mencao: number;
        }[];
      };
    };
    Enums: {
      classificacao_olimpiada: ClassificacaoOlimpiada;
      status_inscricao: StatusInscricao;
      tipo_resultado: TipoResultado;
      role_usuario: RoleUsuario;
      tipo_fase: TipoFase;
    };
    CompositeTypes: {
      [_ in never]: never;
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
export type PreparacaoProjeto = Tables<"preparacao_projeto">;
export type PreparacaoAula = Tables<"preparacao_aula">;
export type Questao = Tables<"questao">;
export type Alternativa = Tables<"alternativa">;
export type Solucao = Tables<"solucao">;
export type RespostaAluno = Tables<"resposta_aluno">;
export type PreparacaoMaterial = Tables<"preparacao_material">;
export type AlunoProgresso = Tables<"aluno_progresso">;
export type MetaMarca = Tables<"meta_marca">;
