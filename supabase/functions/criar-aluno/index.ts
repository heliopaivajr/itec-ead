// Edge Function: criar-aluno
// POST /functions/v1/criar-aluno
//
// Cria um novo aluno no ITEC sem que ele precise fazer signup.
// Requer role administracao / admin / superadmin.
// Gera código ITEC-AAAA-NNN único e imutável.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function sanitizeDate(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [day, month, year] = value.split('/');
    return `${year}-${month}-${day}`;
  }
  return null;
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método não permitido' }, 405);
  }

  // ── 1. Verificar Authorization ────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Authorization header ausente ou inválido' }, 401);
  }
  const callerToken = authHeader.replace('Bearer ', '');

  // Cliente com service_role para operações admin
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Cliente com o token do chamador para verificar identidade
  const supabaseCaller = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // ── 2. Verificar role do chamador ─────────────────────────────
  const { data: { user: caller } } = await supabaseCaller.auth.getUser();
  if (!caller) return json({ error: 'Token inválido' }, 401);

  const { data: callerRole } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
    .single();

  if (!callerRole || !['administracao', 'admin', 'superadmin'].includes(callerRole.role)) {
    return json({ error: 'Permissão insuficiente. Requer administracao, admin ou superadmin.' }, 403);
  }

  // ── 3. Validar campos obrigatórios ────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body inválido — esperado JSON' }, 400);
  }

  const { email, senha_temporaria, full_name, cpf, telefone,
          data_nascimento, turma_id, data_inicio,
          semestre_ingresso, obs_retroativa } = body as {
    email?: string; senha_temporaria?: string; full_name?: string;
    cpf?: string; telefone?: string; data_nascimento?: string;
    turma_id?: string; data_inicio?: string;
    semestre_ingresso?: string; obs_retroativa?: string;
  };

  if (!email?.trim()) return json({ error: 'Campo obrigatório: email', field: 'email' }, 400);
  if (!full_name?.trim()) return json({ error: 'Campo obrigatório: full_name', field: 'full_name' }, 400);
  if (!senha_temporaria || senha_temporaria.length < 8) {
    return json({ error: 'senha_temporaria deve ter no mínimo 8 caracteres', field: 'senha_temporaria' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return json({ error: 'Formato de e-mail inválido', field: 'email' }, 400);
  }

  // ── 4. Gerar codigo_itec ──────────────────────────────────────
  const ano = data_inicio
    ? new Date(data_inicio).getFullYear()
    : new Date().getFullYear();

  const { count: countExistentes } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .like('codigo_itec', `ITEC-${ano}-%`);

  const sequencial = String((countExistentes ?? 0) + 1).padStart(3, '0');
  const codigo_itec = `ITEC-${ano}-${sequencial}`;

  // ── 5. Criar usuário em auth.users ────────────────────────────
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password: senha_temporaria,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already') ||
        authError.message.toLowerCase().includes('exists')) {
      return json({ error: 'E-mail já cadastrado no sistema', field: 'email' }, 409);
    }
    console.error('auth.admin.createUser error:', authError);
    return json({ error: 'Erro ao criar usuário' }, 500);
  }

  const newUserId = authData.user.id;

  // ── 6. Upsert em profiles ─────────────────────────────────────
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id:              newUserId,
      email:           email.trim(),
      full_name:       full_name.trim(),
      role:            'aluno',
      codigo_itec,
      cpf:             cpf?.trim() || null,
      telefone:        telefone?.trim() || null,
      data_nascimento: sanitizeDate(data_nascimento),
    });

  if (profileError) {
    console.error('profiles upsert error:', profileError);
    // Tentativa de rollback: excluir o usuário auth criado
    await supabaseAdmin.auth.admin.deleteUser(newUserId);
    return json({ error: 'Erro ao salvar perfil do aluno' }, 500);
  }

  // ── 7. Upsert em user_roles ───────────────────────────────────
  const { error: roleError } = await supabaseAdmin
    .from('user_roles')
    .upsert({ user_id: newUserId, role: 'aluno' });

  if (roleError) {
    // Não crítico — log e continua (ERR-RISK-001 documentado)
    console.error('user_roles upsert error:', roleError.message);
  }

  // ── 8. Criar matrícula se turma_id fornecido ──────────────────
  let matricula_id: string | null = null;

  if (turma_id?.trim()) {
    // Buscar curso_id da turma para incluir na matrícula
    const { data: turma } = await supabaseAdmin
      .from('turmas')
      .select('curso_id')
      .eq('id', turma_id.trim())
      .single();

    const { data: matricula, error: matriculaError } = await supabaseAdmin
      .from('matriculas')
      .insert({
        aluno_id:           newUserId,
        turma_id:           turma_id.trim(),
        curso_id:           turma?.curso_id ?? null,
        status:             'pendente',
        data_inicio:        sanitizeDate(data_inicio),
        semestre_ingresso:  semestre_ingresso?.trim() || null,
        obs_retroativa:     obs_retroativa?.trim() || null,
      })
      .select('id')
      .single();

    if (matriculaError) {
      console.error('matriculas insert error:', matriculaError);
      // Não crítico para o retorno — aluno criado, matrícula pode ser feita depois
    } else {
      matricula_id = matricula?.id ?? null;
    }
  }

  // ── 9. Retornar 201 ───────────────────────────────────────────
  return json({
    user_id:     newUserId,
    email:       email.trim(),
    full_name:   full_name.trim(),
    codigo_itec,
    matricula_id,
  }, 201);
});
