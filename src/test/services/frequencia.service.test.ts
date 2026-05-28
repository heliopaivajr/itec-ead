import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getResumoFrequencia,
  lancarFrequencia,
  getAlunosAbaixoLimite,
  getFrequenciaByDisciplina,
  justificarFalta,
  calcularResumosPorAluno,
  getResumoFrequenciaBatch,
  type RegistroFrequencia,
} from '@/services/frequencia.service';

// Monta registros de presença para teste de resumo
function makeRegistros(total: number, presentes: number) {
  return Array.from({ length: total }, (_, i) => ({
    presente:    i < presentes,
    justificada: false,
  }));
}

function mockSelectEq(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(result),
        }),
      }),
    }),
  } as any);
}

beforeEach(() => { vi.clearAllMocks(); });

describe('frequencia.service', () => {
  describe('getResumoFrequencia', () => {
    it('calcula percentual e status ok (>= 75%)', async () => {
      // 8 aulas, 6 presenças → 75%
      mockSelectEq({ data: makeRegistros(8, 6), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.total_aulas).toBe(8);
      expect(resumo.presencas).toBe(6);
      expect(resumo.percentual_presenca).toBe(75);
      expect(resumo.status).toBe('ok');
    });

    it('retorna status alerta (60-74%)', async () => {
      // 10 aulas, 6 presenças → 60%
      mockSelectEq({ data: makeRegistros(10, 6), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.percentual_presenca).toBe(60);
      expect(resumo.status).toBe('alerta');
    });

    it('retorna status reprovado (< 60%)', async () => {
      // 10 aulas, 5 presenças → 50%
      mockSelectEq({ data: makeRegistros(10, 5), error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.percentual_presenca).toBe(50);
      expect(resumo.status).toBe('reprovado');
    });

    it('retorna zeros quando não há registros de frequência', async () => {
      mockSelectEq({ data: [], error: null });

      const resumo = await getResumoFrequencia('aluno-1', 'disc-1');

      expect(resumo.total_aulas).toBe(0);
      expect(resumo.presencas).toBe(0);
      // Sem aulas → 100% por padrão (não reprovar aluno sem dados)
      expect(resumo.percentual_presenca).toBe(100);
      expect(resumo.status).toBe('ok');
    });
  });

  describe('lancarFrequencia', () => {
    it('insere registros em batch e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const upsertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ upsert: upsertFn } as any);

      const registros = [
        { disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-26', presente: true, justificada: false, documento_url: null, observacao: null },
      ];

      const resultado = await lancarFrequencia(registros);

      expect(resultado.error).toBeNull();
      expect(upsertFn).toHaveBeenCalledWith(registros, { onConflict: 'disciplina_id,aluno_id,data_aula' });
    });

    it('retorna erro quando upsert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
      } as any);

      const resultado = await lancarFrequencia([{
        disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1',
        data_aula: '2026-05-26', presente: true, justificada: false,
        documento_url: null, observacao: null,
      }]);

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('getFrequenciaByDisciplina', () => {
    it('retorna registros da disciplina com limit=120', async () => {
      vi.mocked(supabase.from).mockReset();
      const limitFn = vi.fn().mockResolvedValue({
        data: [
          { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', presente: true, data_aula: '2026-05-01' },
          { id: 'f2', disciplina_id: 'd1', aluno_id: 'a2', presente: false, data_aula: '2026-05-01' },
        ],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ limit: limitFn }),
          }),
        }),
      } as any);

      const resultado = await getFrequenciaByDisciplina('d1');

      expect(resultado).toHaveLength(2);
      expect(limitFn).toHaveBeenCalledWith(120);
    });

    it('retorna array vazio quando erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getFrequenciaByDisciplina('d1');

      expect(resultado).toEqual([]);
    });
  });

  describe('justificarFalta', () => {
    it('atualiza justificada=true com documento_url e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await justificarFalta('freq-1', 'https://doc.pdf');

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.justificada).toBe(true);
      expect(payload.documento_url).toBe('https://doc.pdf');
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await justificarFalta('freq-1', 'https://doc.pdf');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('calcularResumosPorAluno', () => {
    it('calcula resumos corretos para múltiplos alunos sem queries', () => {
      const registros: RegistroFrequencia[] = [
        { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-01', presente: true,  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f2', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-08', presente: true,  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f3', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-15', presente: false, justificada: true,  documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f4', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-22', presente: false, justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f5', disciplina_id: 'd1', aluno_id: 'a2', professor_id: 'p1', data_aula: '2026-05-01', presente: true,  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
        { id: 'f6', disciplina_id: 'd1', aluno_id: 'a2', professor_id: 'p1', data_aula: '2026-05-08', presente: true,  justificada: false, documento_url: null, observacao: null, registrado_em: '' },
      ];

      const resultado = calcularResumosPorAluno(registros);

      // a1: 4 aulas, 2 presenças = 50% → reprovado
      const resumoA1 = resultado.get('a1')!;
      expect(resumoA1.total_aulas).toBe(4);
      expect(resumoA1.presencas).toBe(2);
      expect(resumoA1.faltas_justificadas).toBe(1);
      expect(resumoA1.percentual_presenca).toBe(50);
      expect(resumoA1.status).toBe('reprovado');

      // a2: 2 aulas, 2 presenças = 100% → ok
      const resumoA2 = resultado.get('a2')!;
      expect(resumoA2.total_aulas).toBe(2);
      expect(resumoA2.percentual_presenca).toBe(100);
      expect(resumoA2.status).toBe('ok');
    });

    it('retorna Map vazio para array vazio', () => {
      const resultado = calcularResumosPorAluno([]);
      expect(resultado.size).toBe(0);
    });

    it('retorna percentual=100 e status=ok quando aluno não tem faltas', () => {
      const registros: RegistroFrequencia[] = [
        { id: 'f1', disciplina_id: 'd1', aluno_id: 'a1', professor_id: 'p1', data_aula: '2026-05-01', presente: true, justificada: false, documento_url: null, observacao: null, registrado_em: '' },
      ];
      const resultado = calcularResumosPorAluno(registros);
      expect(resultado.get('a1')?.status).toBe('ok');
    });
  });

  describe('getResumoFrequenciaBatch', () => {
    it('retorna Map vazio quando disciplinaIds está vazio', async () => {
      const resultado = await getResumoFrequenciaBatch('aluno-1', []);
      expect(resultado.size).toBe(0);
    });

    it('calcula resumo correto por disciplina para o aluno', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { disciplina_id: 'd1', presente: true,  justificada: false },
                  { disciplina_id: 'd1', presente: true,  justificada: false },
                  { disciplina_id: 'd1', presente: false, justificada: false },
                  { disciplina_id: 'd1', presente: false, justificada: false },
                  { disciplina_id: 'd2', presente: true,  justificada: false },
                  { disciplina_id: 'd2', presente: true,  justificada: false },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getResumoFrequenciaBatch('aluno-1', ['d1', 'd2']);

      // d1: 4 aulas, 2 presenças = 50% → reprovado
      expect(resultado.get('d1')?.percentual_presenca).toBe(50);
      expect(resultado.get('d1')?.status).toBe('reprovado');
      // d2: 2 aulas, 2 presenças = 100% → ok
      expect(resultado.get('d2')?.percentual_presenca).toBe(100);
      expect(resultado.get('d2')?.status).toBe('ok');
    });

    it('retorna Map vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getResumoFrequenciaBatch('aluno-1', ['d1']);

      expect(resultado.size).toBe(0);
    });
  });

  describe('getAlunosAbaixoLimite', () => {
    it('retorna apenas alunos abaixo do limite com nome (não UUID)', async () => {
      vi.mocked(supabase.from).mockReset();
      // 3 alunos: A=80%, B=60%, C=50% — apenas B e C abaixo de 75%
      // Supabase retorna join como array — aluno: [{ full_name, email }]
      const makeRow = (aluno_id: string, presente: boolean, nome: string, email: string) => ({
        aluno_id, presente, aluno: [{ full_name: nome, email }],
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                // aluno-A: 4 presenças / 5 aulas = 80%
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', true,  'Ana Silva',   'ana@itec.com'),
                makeRow('aluno-A', false, 'Ana Silva',   'ana@itec.com'),
                // aluno-B: 3 presenças / 5 aulas = 60%
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', true,  'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', false, 'Bruno Costa', 'b@itec.com'),
                makeRow('aluno-B', false, 'Bruno Costa', 'b@itec.com'),
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getAlunosAbaixoLimite('disc-1', 75);

      expect(resultado).toHaveLength(1);
      expect(resultado[0].aluno_id).toBe('aluno-B');
      expect(resultado[0].nome).toBe('Bruno Costa');  // nome real, não UUID
      expect(resultado[0].email).toBe('b@itec.com');
      expect(resultado[0].percentual).toBe(60);
    });
  });
});
