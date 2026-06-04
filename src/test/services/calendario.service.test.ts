import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  expandirAulasParaPeriodo,
  getEventosMes,
  criarEvento,
  excluirEvento,
  type AulaRecorrente,
} from '@/services/calendario.service';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Cria uma AulaRecorrente com valores padrão substituíveis
function makeAula(overrides: Partial<AulaRecorrente> = {}): AulaRecorrente {
  return {
    id:             'aula-1',
    disciplina_id:  'disc-1',
    disciplina_nome: 'Novo Testamento I',
    turma_id:       'turma-1',
    professor_id:   null,
    professor_nome: null,
    dia_semana:     2, // Terça-feira
    horario_inicio: '19:00:00',
    horario_fim:    '22:00:00',
    data_inicio:    '2026-03-01',
    data_fim:       '2026-06-30',
    sala:           'Sala Principal',
    ativo:          true,
    ...overrides,
  };
}

// Datas com noon local para evitar problemas de DST
const mar01 = new Date(2026, 2, 1, 12, 0, 0);   // 1 Mar 2026 = Domingo
const mar31 = new Date(2026, 2, 31, 12, 0, 0);  // 31 Mar 2026
const fev01 = new Date(2026, 1, 1, 12, 0, 0);   // 1 Fev 2026 = Domingo
const fev28 = new Date(2026, 1, 28, 12, 0, 0);  // 28 Fev 2026

beforeEach(() => { vi.clearAllMocks(); });

// ─── expandirAulasParaPeriodo — FUNÇÃO PURA (sem mock de banco) ───────────────

describe('expandirAulasParaPeriodo — função pura', () => {

  it('a) Terça semanal em março 2026 → 5 instâncias (3/10/17/24/31)', () => {
    const aula = makeAula({ dia_semana: 2, data_inicio: '2026-03-01', data_fim: '2026-06-30' });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    expect(eventos).toHaveLength(5);
    expect(eventos.map(e => e.data)).toEqual([
      '2026-03-03',
      '2026-03-10',
      '2026-03-17',
      '2026-03-24',
      '2026-03-31',
    ]);
  });

  it('b) Segunda semanal em fevereiro 2026 → 4 instâncias (2/9/16/23)', () => {
    const aula = makeAula({
      id:           'aula-2',
      dia_semana:   1, // Segunda
      data_inicio:  '2026-01-26',
      data_fim:     '2026-04-06',
    });

    const eventos = expandirAulasParaPeriodo([aula], fev01, fev28);

    expect(eventos).toHaveLength(4);
    expect(eventos.map(e => e.data)).toEqual([
      '2026-02-02',
      '2026-02-09',
      '2026-02-16',
      '2026-02-23',
    ]);
  });

  it('c) Aula com ativo=false → retorna []', () => {
    const aula = makeAula({ ativo: false });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    expect(eventos).toHaveLength(0);
  });

  it('d) Período solicitado ANTES do início da aula → retorna []', () => {
    // Aula começa em maio, período é março
    const aula = makeAula({ data_inicio: '2026-05-01', data_fim: '2026-08-31' });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    expect(eventos).toHaveLength(0);
  });

  it('e) Período solicitado DEPOIS do fim da aula → retorna []', () => {
    // Aula terminou em janeiro, período é março
    const aula = makeAula({ data_inicio: '2026-01-01', data_fim: '2026-01-31' });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    expect(eventos).toHaveLength(0);
  });

  it('f) Array vazio de aulas → retorna []', () => {
    const eventos = expandirAulasParaPeriodo([], mar01, mar31);

    expect(eventos).toHaveLength(0);
  });

  it('g) ID sintético no formato ${aula.id}_${dataStr}', () => {
    const aula = makeAula({ id: 'aula-abc', dia_semana: 2 });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    // Todas as instâncias têm o ID correto
    expect(eventos[0].id).toBe('aula-abc_2026-03-03');
    expect(eventos[1].id).toBe('aula-abc_2026-03-10');
    for (const e of eventos) {
      expect(e.id).toMatch(/^aula-abc_2026-03-\d{2}$/);
    }
  });

  it('h) Cor #22C55E em todos os eventos expandidos', () => {
    const aula = makeAula();

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    expect(eventos.length).toBeGreaterThan(0);
    for (const e of eventos) {
      expect(e.cor).toBe('#22C55E');
    }
  });

  it('tipo = aula_recorrente em todos os eventos', () => {
    const aula = makeAula();
    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);
    for (const e of eventos) {
      expect(e.tipo).toBe('aula_recorrente');
    }
  });

  it('aula_recorrente_id aponta para o id da aula original', () => {
    const aula = makeAula({ id: 'minha-aula' });
    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);
    for (const e of eventos) {
      expect(e.aula_recorrente_id).toBe('minha-aula');
    }
  });

  it('duas aulas no mesmo período → eventos ordenados por data', () => {
    const terca  = makeAula({ id: 'a-ter', dia_semana: 2 });
    const quinta = makeAula({ id: 'a-qui', dia_semana: 4 });

    const eventos = expandirAulasParaPeriodo([terca, quinta], mar01, mar31);

    // Deve estar ordenado por data crescente
    for (let i = 1; i < eventos.length; i++) {
      expect(eventos[i].data >= eventos[i - 1].data).toBe(true);
    }
    // Primeira = Terça 03/03, segunda = Quinta 05/03
    expect(eventos[0].data).toBe('2026-03-03');
    expect(eventos[1].data).toBe('2026-03-05');
  });

  it('interseção parcial: aula começa no meio do período → só instâncias após o início da aula', () => {
    // Aula começa dia 10/03, período é 01/03 a 31/03
    const aula = makeAula({ data_inicio: '2026-03-10', data_fim: '2026-06-30' });

    const eventos = expandirAulasParaPeriodo([aula], mar01, mar31);

    // Terças a partir de 10/03: 10, 17, 24, 31 = 4
    expect(eventos).toHaveLength(4);
    expect(eventos[0].data).toBe('2026-03-10');
  });
});

// ─── getEventosMes — com mock do Supabase ────────────────────────────────────

describe('getEventosMes', () => {
  const mockEvento = {
    id: 'ev-1', titulo: 'Tiradentes', descricao: null,
    data: '2026-04-21', tipo: 'feriado_nacional',
    turma_id: null, disciplina_id: null, professor_id: null,
    cancelar_aula: true, dia_inteiro: true,
    horario_inicio: null, horario_fim: null, cor: '#EF4444',
  };

  it('a) sem turmaId → chain gte→lt→order→limit e retorna todos os eventos', async () => {
    vi.mocked(supabase.from).mockReset();
    const limitFn = vi.fn().mockResolvedValue({ data: [mockEvento], error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ limit: limitFn }),
          }),
        }),
      }),
    } as any);

    const resultado = await getEventosMes(2026, 4);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].titulo).toBe('Tiradentes');
    expect(limitFn).toHaveBeenCalledWith(200);
  });

  it('b) com turmaId → chain termina em .or() com eventos globais + turma', async () => {
    vi.mocked(supabase.from).mockReset();
    const orFn = vi.fn().mockResolvedValue({ data: [mockEvento], error: null });
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ or: orFn }),
            }),
          }),
        }),
      }),
    } as any);

    await getEventosMes(2026, 4, 'turma-1');

    expect(orFn).toHaveBeenCalledWith('turma_id.is.null,turma_id.eq.turma-1');
  });

  it('c) erro do Supabase → retorna []', async () => {
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        gte: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'rls' } }),
            }),
          }),
        }),
      }),
    } as any);

    const resultado = await getEventosMes(2026, 4);

    expect(resultado).toEqual([]);
  });
});

// ─── criarEvento — verificação de role ───────────────────────────────────────

// Helper: monta os 2 from() calls de criarEvento em ordem:
//   1. user_roles.single() → role
//   2. eventos_calendario.insert().select('id').single() → id
function mockCriarEvento(role: string, insertOk = true) {
  vi.mocked(supabase.from).mockReset();

  // 1. user_roles
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
      }),
    }),
  } as any);

  if (!['administracao', 'admin', 'superadmin'].includes(role)) return;

  // 2. eventos_calendario.insert
  vi.mocked(supabase.from).mockReturnValueOnce({
    insert: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(
          insertOk
            ? { data: { id: 'ev-novo' }, error: null }
            : { data: null, error: { message: 'constraint violation' } }
        ),
      }),
    }),
  } as any);
}

const payloadTeste = {
  titulo: 'Formatura 2026',
  data: '2026-12-10',
  tipo: 'formatura' as const,
};

describe('criarEvento', () => {
  it('a) administracao pode criar → { data: {id}, error: null }', async () => {
    mockCriarEvento('administracao');

    const resultado = await criarEvento(payloadTeste, 'req-secretaria');

    expect(resultado.error).toBeNull();
    expect(resultado.data?.id).toBe('ev-novo');
  });

  it('b) admin pode criar', async () => {
    mockCriarEvento('admin');

    const resultado = await criarEvento(payloadTeste, 'req-admin');

    expect(resultado.error).toBeNull();
  });

  it('c) professor NÃO pode criar → erro de permissão, insert NÃO chamado', async () => {
    mockCriarEvento('professor');

    const resultado = await criarEvento(payloadTeste, 'req-prof');

    expect(resultado.data).toBeNull();
    expect(resultado.error).toContain('Permissão');
    // Apenas 1 from() chamado (user_roles) — insert nunca acontece
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });

  it('d) aluno NÃO pode criar → erro de permissão', async () => {
    mockCriarEvento('aluno');

    const resultado = await criarEvento(payloadTeste, 'req-aluno');

    expect(resultado.error).toContain('Permissão');
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });
});

// ─── excluirEvento — verificação de role ─────────────────────────────────────

function mockExcluirEvento(role: string) {
  vi.mocked(supabase.from).mockReset();

  // 1. user_roles
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
      }),
    }),
  } as any);

  if (!['administracao', 'admin', 'superadmin'].includes(role)) return;

  // 2. delete().eq()
  vi.mocked(supabase.from).mockReturnValueOnce({
    delete: vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    }),
  } as any);
}

describe('excluirEvento', () => {
  it('a) superadmin pode excluir → error: null', async () => {
    mockExcluirEvento('superadmin');

    const resultado = await excluirEvento('ev-1', 'req-super');

    expect(resultado.error).toBeNull();
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(2);
  });

  it('b) administracao pode excluir', async () => {
    mockExcluirEvento('administracao');

    const resultado = await excluirEvento('ev-1', 'req-sec');

    expect(resultado.error).toBeNull();
  });

  it('c) professor NÃO pode excluir → erro de permissão, delete NÃO chamado', async () => {
    mockExcluirEvento('professor');

    const resultado = await excluirEvento('ev-1', 'req-prof');

    expect(resultado.error).toContain('Permissão');
    expect(vi.mocked(supabase.from)).toHaveBeenCalledTimes(1);
  });
});
