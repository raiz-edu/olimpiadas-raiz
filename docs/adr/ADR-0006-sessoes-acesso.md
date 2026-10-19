# ADR-0006: Sessões de uso independentes da autenticação

Status: implementado. Data: 19/10/2026.

## Contexto

O portal usa cookie próprio e inclui alunos e profissionais. Gestão usa Supabase
Auth com papéis RBAC. Um login persistente pode permitir vários dias de uso; contar
autenticações como frequência e presença online distorce os indicadores.

## Decisão

Registrar sessões no Supabase existente mediante atividade/navegação visível,
com intervalo de 30 minutos de inatividade. O servidor deriva a identidade da
sessão da área solicitada, e uma RPC exclusiva service_role serializa registros
da mesma pessoa. A tabela tem RLS ativa e não admite acesso direto de clientes.

As duas áreas são associadas pelo e-mail normalizado internamente; sem e-mail,
cada identificador permanece independente. A leitura não retorna nomes/e-mails.
O perfil confirmado no portal determina profissão/vínculo. Um papel RBAC, como
professor, não comprova profissão; equipe sem perfil confirmado aparece como equipe.
Essa associação serve aos indicadores e não concede autorização entre áreas.

## Alternativas

- Contadores de login: já disponíveis, mas não registram visitas com sessão válida.
- Eventos por carregamento: duplicam recargas/abas e aumentam artificialmente o uso.
- Serviço externo de analytics: acrescentaria integração sem resolver a associação
  dos vínculos e as duas formas de autenticação existentes.

## Consequências

Sessões precisas começam com a implantação, sem converter logins históricos.
Cadastros importados continuam distinguíveis de evidência de uso. A coleta não
mede presença online, minutos estudados ou execução de vídeo. Falha de telemetria
não bloqueia a plataforma. Rollback mantém sessões e RPCs sem apagar histórico.

O acompanhamento pedagógico permanece como destino para análise individual e
desempenho; a nova área atende à adoção da plataforma.
