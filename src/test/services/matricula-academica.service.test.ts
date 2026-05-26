import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  matricularEmDisciplina,
  aprovarConvalidacao,
  aprovarExcecaoPrerequisito,
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

      const resultado = await aprovarExcecaoPrerequisito(
        'a', 'b', 'c', 'd', 'motivo'
      );

      expect(resultado.error).toBe('duplicate key');
    });
  });
});
