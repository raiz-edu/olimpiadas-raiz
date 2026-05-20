import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, Convite, RoleUsuario } from "@/lib/types/database";
import { can, ROLE_LABELS } from "@/lib/auth/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, FROM_EMAIL, APP_URL } from "@/lib/email/resend";
import { conviteEmailHtml, conviteEmailText } from "@/lib/email/templates/convite";

// ---------------------------------------------------------------------------
// Helper: cliente da sessão do usuário autenticado
// ---------------------------------------------------------------------------

async function makeSessionClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
}

// ---------------------------------------------------------------------------
// POST /api/convites — criar e enviar convite
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const supabase = await makeSessionClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  // Cast explícito: inferência do SDK falha com select de colunas específicas
  const { data: rawSolicitante } = await supabase
    .from("usuario")
    .select("role, nome")
    .eq("id", authUser.id)
    .single();
  const usuarioSolicitante = rawSolicitante as { role: RoleUsuario; nome: string } | null;

  if (!usuarioSolicitante)
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 403 });

  if (!can(usuarioSolicitante.role, "convite:create"))
    return NextResponse.json({ error: "Sem permissão para criar convites." }, { status: 403 });

  let body: {
    email: string;
    role: RoleUsuario;
    marca_id?: string;
    unidade_id?: string;
    nome_convidado?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { email, role, marca_id, unidade_id, nome_convidado } = body;
  if (!email || !role)
    return NextResponse.json({ error: "email e role são obrigatórios." }, { status: 400 });

  if (
    usuarioSolicitante.role !== "admin_rede" &&
    (role === "admin_rede" || role === "coord_marca")
  ) {
    return NextResponse.json(
      { error: "Sem permissão para convidar usuários com este perfil." },
      { status: 403 },
    );
  }

  const supabaseAdmin = createAdminClient();

  // Convite pendente já existe?
  const { data: existente } = await supabaseAdmin
    .from("convite")
    .select("id")
    .eq("email", email)
    .is("aceito_em", null)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (existente)
    return NextResponse.json(
      { error: "Já existe um convite pendente para este e-mail." },
      { status: 409 },
    );

  // E-mail já tem conta?
  const { data: existenteUser } = await supabaseAdmin
    .from("usuario")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existenteUser)
    return NextResponse.json(
      { error: "Este e-mail já possui cadastro na plataforma." },
      { status: 409 },
    );

  // Criar convite (expira em 7 dias)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: rawConvite, error: insertError } = await supabaseAdmin
    .from("convite")
    .insert({
      email,
      role,
      marca_id: marca_id ?? null,
      unidade_id: unidade_id ?? null,
      criado_por: authUser.id,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError || !rawConvite) {
    console.error("[POST /api/convites] insert:", insertError?.message);
    return NextResponse.json({ error: "Erro ao criar convite." }, { status: 500 });
  }
  const convite = rawConvite as Convite;

  // Buscar nomes para o e-mail
  let marcaNome: string | undefined;
  let unidadeNome: string | undefined;
  if (marca_id) {
    const { data: m } = await supabaseAdmin
      .from("marca")
      .select("nome")
      .eq("id", marca_id)
      .single();
    marcaNome = (m as { nome: string } | null)?.nome;
  }
  if (unidade_id) {
    const { data: u } = await supabaseAdmin
      .from("unidade")
      .select("nome")
      .eq("id", unidade_id)
      .single();
    unidadeNome = (u as { nome: string } | null)?.nome;
  }

  // Enviar e-mail via Resend
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Convite — Olimpíadas do Conhecimento (${ROLE_LABELS[role]})`,
      html: conviteEmailHtml({
        nomeConvidado: nome_convidado,
        emailConvidado: email,
        role,
        marcaNome,
        unidadeNome,
        token: convite.token,
        expiresAt,
        convidadoPor: usuarioSolicitante.nome,
      }),
      text: conviteEmailText({
        emailConvidado: email,
        role,
        token: convite.token,
        expiresAt,
      }),
    });
  } catch (emailError) {
    console.error("[POST /api/convites] email:", emailError);
    return NextResponse.json(
      {
        convite_id: convite.id,
        warning:
          "Convite criado, mas o e-mail não pôde ser enviado. Configure RESEND_API_KEY em .env.local.",
        invite_link: `${APP_URL}/aceitar-convite?token=${convite.token}`,
      },
      { status: 201 },
    );
  }

  return NextResponse.json(
    { convite_id: convite.id, message: `Convite enviado para ${email}.` },
    { status: 201 },
  );
}

// ---------------------------------------------------------------------------
// GET /api/convites — listar convites
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  const supabase = await makeSessionClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { data: rawUsuario } = await supabase
    .from("usuario")
    .select("role")
    .eq("id", authUser.id)
    .single();
  const usuario = rawUsuario as { role: RoleUsuario } | null;

  if (!usuario || !can(usuario.role, "convite:read"))
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const { data: rawConvites, error } = await supabase
    .from("convite")
    .select("id, email, role, marca_id, unidade_id, expires_at, aceito_em, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Erro ao listar convites." }, { status: 500 });

  return NextResponse.json({ convites: rawConvites ?? [] });
}
