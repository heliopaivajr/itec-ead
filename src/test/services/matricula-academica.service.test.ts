import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  matricularEmDisciplina,
  aprovarConvalidacao,
  aprovarExcecaoPrerequisito,
  getAlunoPorEmail,
  getDisciplinaPorCodigo,
  getMatriculasDisciplinaByAluno,
  atualizarStatusDisciplina,
  solicitarConvalidacao,
  getConvalidacoesByAluno,
  rejeitarConvalidacao,
  getConvalidacoesPorStatus,
  encaminharConvalidacao,
  getExcecoesPendentes,
  negarExcecaoPrerequisito,
} from '@/services/matricula-academica.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('matricula-academica.service', () => {
  describe('matricularEmDisciplina', () => {
    it('cria matrícula na disciplina e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const resultado = await matricularEmDisciplina('mat-1', 'disc-1', 'admin-1');

      expect(resultado.error).toBeNull();
      const payload = vi.mocked(supabase.from).mock.results[0].value.insert.mock.calls[0][0];
      expect(payload.matricula_id).toBe('mat-1');
      expect(payload.disciplina_id).toBe('disc-1');
      expect(payload.status).toBe('cursando');
    });

    it('retorna erro quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
      } as any);

      const resultado = await matricularEmDisciplina('mat-1', 'disc-1', 'admin-1');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('aprovarConvalidacao', () => {
    it('muda status para aprovado e registra aprovador + data', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await aprovarConvalidacao('conv-1', 'admin-2');

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.status).toBe('aprovado');
      expect(payload.aprovado_por).toBe('admin-2');
      expect(payload.aprovado_em).toBeDefined();
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as any);

      const resultado = await aprovarConvalidacao('conv-x', 'admin-1');

      expect(resultado.error).toBe('not found');
    });
  });

  describe('aprovarExcecaoPrerequisito', () => {
    it('insere exceção com todos os campos obrigatórios', async () => {
      vi.mocked(supabase.from).mockReset();
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertFn } as any);

      const resultado = await aprovarExcecaoPrerequisito(
        'aluno-1', 'disc-1', 'prereq-1', 'superadmin-1', 'Aluno já cursou equivalente'
      );

      expect(resultado.error).toBeNull();
      const payload = insertFn.mock.calls[0][0];
      expect(payload.aluno_id).toBe('aluno-1');
      expect(payload.disciplina_id).toBe('disc-1');
      expect(payload.prerequisito_dispensado_id).toBe('prereq-1');
      expect(payload.aprovado_por).toBe('superadmin-1');
      expect(payload.motivo).toBe('Aluno já cursou equivalente');
    });

    it('retorna erro quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate key' } }),
      } as any);

      const resultado = await aprovarExcecaoPrerequisito('a', 'b', 'c', 'd', 'motivo');

      expect(resultado.error).toBe('duplicate key');
    });
  });

  describe('getAlunoPorEmail', () => {
    it('retorna aluno quando email existe', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'a1', full_name: 'Pedro Lima' },
              error: null,
            }),
          }),
        }),
      } as any);

      const aluno = await getAlunoPorEmail('pedro@itec.com');

      expect(aluno).not.toBeNull();
      expect(aluno?.id).toBe('a1');
      expect(aluno?.full_name).toBe('Pedro Lima');
    });

    it('retorna null quando email não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const aluno = await getAlunoPorEmail('inexistente@itec.com');

      expect(aluno).toBeNull();
    });
  });

  describe('getDisciplinaPorCodigo', () => {
    it('retorna disciplina quando código existe', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'd1', codigo: 'B1NTG', nome: 'NT I' },
              error: null,
            }),
          }),
        }),
      } as any);

      const disc = await getDisciplinaPorCodigo('B1NTG');

      expect(disc).not.toBeNull();
      expect(disc?.codigo).toBe('B1NTG');
    });

    it('retorna null quando código não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const disc = await getDisciplinaPorCodigo('INVALIDO');

      expect(disc).toBeNull();
    });
  });

  describe('getMatriculasDisciplinaByAluno', () => {
    it('retorna disciplinas matriculadas do aluno', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { id: 'md1', disciplina_id: 'd1', status: 'cursando' },
              { id: 'md2', disciplina_id: 'd2', status: 'aprovado' },
            ],
            error: null,
          }),
        }),
      } as any);

      const resultado = await getMatriculasDisciplinaByAluno('aluno-1');

      expect(resultado).toHaveLength(2);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
        }),
      } as any);

      const resultado = await getMatriculasDisciplinaByAluno('aluno-1');

      expect(resultado).toEqual([]);
    });
  });

  describe('atualizarStatusDisciplina', () => {
    it('atualiza status sem nota e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await atualizarStatusDisciplina('md1', 'aprovado');

      expect(resultado.error).toBeNull();
      expect(updateFn.mock.calls[0][0]).toEqual({ status: 'aprovado' });
    });

    it('inclui nota no update quando fornecida', async () => {
      vi.mocked(supabase.from).mockReset();
      const updateFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      await atualizarStatusDisciplina('md1', 'aprovado', 8.5);

      expect(updateFn.mock.calls[0][0]).toEqual({ status: 'aprovado', nota: 8.5 });
    });
  });

  describe('solicitarConvalidacao', () => {
    it('insere convalidação com status pendente', async () => {
      vi.mocked(supabase.from).mockReset();
      const insertFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({ insert: insertFn } as any);

      const resultado = await solicitarConvalidacao({
        aluno_id: 'a1', disciplina_id: 'd1',
        instituicao_origem: 'FAETEC', disciplina_origem: 'NT Avançado',
        carga_horaria_origem: 60,
        coordenador_responsavel: null, aprovado_por: null,
        documentos_url: null, observacoes: null,
      });

      expect(resultado.error).toBeNull();
      const payload = insertFn.mock.calls[0][0];
      expect(payload.status).toBe('pendente');
      expect(payload.aluno_id).toBe('a1');
    });

    it('retorna erro quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: { message: 'duplicate' } }),
      } as any);

      const resultado = await solicitarConvalidacao({
        aluno_id: 'a1', disciplina_id: 'd1',
        instituicao_origem: 'X', disciplina_origem: 'Y',
        carga_horaria_origem: null,
        coordenador_responsavel: null, aprovado_por: null,
        documentos_url: null, observacoes: null,
      });

      expect(resultado.error).toBe('duplicate');
    });
  });

  describe('getConvalidacoesByAluno', () => {
    it('retorna convalidações do aluno ordenadas por data', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [
                { id: 'c1', aluno_id: 'a1', status: 'pendente' },
                { id: 'c2', aluno_id: 'a1', status: 'aprovado' },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getConvalidacoesByAluno('a1');

      expect(resultado).toHaveLength(2);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
          }),
        }),
      } as any);

      const resultado = await getConvalidacoesByAluno('a1');

      expect(resultado).toEqual([]);
    });
  });

  describe('rejeitarConvalidacao', () => {
    it('muda status para rejeitado com motivo', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await rejeitarConvalidacao('c1', 'Documentação incompleta');

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.status).toBe('rejeitado');
      expect(payload.observacoes).toBe('Documentação incompleta');
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as any);

      const resultado = await rejeitarConvalidacao('c-x', 'motivo');

      expect(resultado.error).toBe('not found');
    });
  });

  describe('getConvalidacoesPorStatus', () => {
    it('retorna convalidações filtradas por status com LIMIT 100', async () => {
      vi.mocked(supabase.from).mockReset();
      const limitFn = vi.fn().mockResolvedValue({
        data: [{ id: 'c1', status: 'pendente' }],
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({ limit: limitFn }),
          }),
        }),
      } as any);

      const resultado = await getConvalidacoesPorStatus('pendente');

      expect(resultado).toHaveLength(1);
      expect(limitFn).toHaveBeenCalledWith(100);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
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

      const resultado = await getConvalidacoesPorStatus('aprovado');

      expect(resultado).toEqual([]);
    });
  });

  describe('encaminharConvalidacao', () => {
    it('registra coordenador_responsavel e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await encaminharConvalidacao('c1', 'coord-1');

      expect(resultado.error).toBeNull();
      expect(updateFn.mock.calls[0][0]).toEqual({ coordenador_responsavel: 'coord-1' });
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await encaminharConvalidacao('c-x', 'coord-1');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('getExcecoesPendentes', () => {
    it('retorna lista de exceções com join de disciplinas', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                { id: 'e1', aluno_id: 'a1', disciplina: { codigo: 'B1NTG', nome: 'NT I' }, prerequisito: null },
              ],
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getExcecoesPendentes();

      expect(resultado).toHaveLength(1);
      expect(resultado[0].aluno_id).toBe('a1');
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
          }),
        }),
      } as any);

      const resultado = await getExcecoesPendentes();

      expect(resultado).toEqual([]);
    });
  });

  describe('negarExcecaoPrerequisito', () => {
    it('deleta o registro e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const deleteFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ delete: deleteFn } as any);

      const resultado = await negarExcecaoPrerequisito('e1', 'Não justificado');

      expect(resultado.error).toBeNull();
      expect(deleteFn).toHaveBeenCalled();
    });

    it('retorna erro quando delete falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as any);

      const resultado = await negarExcecaoPrerequisito('e-x', 'motivo');

      expect(resultado.error).toBe('not found');
    });
  });
});
