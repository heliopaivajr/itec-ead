import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getResumoFrequencia,
  lancarFrequencia,
  getAlunosAbaixoLimite,
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
        eq: vi.fn().mockResolvedValue(result),
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

  describe('getAlunosAbaixoLimite', () => {
    it('retorna apenas alunos abaixo do limite com nome (não UUID)', async () => {
      vi.mocked(supabase.from).mockReset();
      // 3 alunos: A=80%, B=60%, C=50% — apenas B e C abaixo de 75%
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              // aluno-A: 4 presenças / 5 aulas = 80%
              { aluno_id: 'aluno-A', presente: true,  aluno: { full_name: 'Ana Silva', email: 'ana@itec.com' } },
              { aluno_id: 'aluno-A', presente: true,  aluno: { full_name: 'Ana Silva', email: 'ana@itec.com' } },
              { aluno_id: 'aluno-A', presente: true,  aluno: { full_name: 'Ana Silva', email: 'ana@itec.com' } },
              { aluno_id: 'aluno-A', presente: true,  aluno: { full_name: 'Ana Silva', email: 'ana@itec.com' } },
              { aluno_id: 'aluno-A', presente: false, aluno: { full_name: 'Ana Silva', email: 'ana@itec.com' } },
              // aluno-B: 3 presenças / 5 aulas = 60%
              { aluno_id: 'aluno-B', presente: true,  aluno: { full_name: 'Bruno Costa', email: 'b@itec.com' } },
              { aluno_id: 'aluno-B', presente: true,  aluno: { full_name: 'Bruno Costa', email: 'b@itec.com' } },
              { aluno_id: 'aluno-B', presente: true,  aluno: { full_name: 'Bruno Costa', email: 'b@itec.com' } },
              { aluno_id: 'aluno-B', presente: false, aluno: { full_name: 'Bruno Costa', email: 'b@itec.com' } },
              { aluno_id: 'aluno-B', presente: false, aluno: { full_name: 'Bruno Costa', email: 'b@itec.com' } },
            ],
            error: null,
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
