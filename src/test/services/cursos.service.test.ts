import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getDisciplinas, syncPrerequisitos } from '@/services/cursos.service';
import type { Prerequisito } from '@/services/cursos.service';

// chain: from().select().order().order() → resolves
function mockSelectDoubleOrder(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  const finalOrder = vi.fn().mockResolvedValue(result);
  const firstOrder = vi.fn().mockReturnValue({ order: finalOrder });
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({ order: firstOrder }),
  } as any);
}

// Helpers para montar as 4 chamadas sequenciais de syncPrerequisitos:
// 1. SELECT backup: from().select().eq() → { data, error }
// 2. DELETE:        from().delete().eq() → { error }
// 3. INSERT novos:  from().insert()      → { error }
// 4. INSERT rollback: from().insert()    → { error }

function mockSync(calls: {
  backup:         { data: any; error: any };
  delete:         { error: any };
  insertNovos:    { error: any };
  insertRollback?: { error: any };
}) {
  // Reset garante que não há mockReturnValueOnce residual de testes anteriores
  vi.mocked(supabase.from).mockReset();

  const insertRollbackFn = calls.insertRollback
    ? vi.fn().mockResolvedValue(calls.insertRollback)
    : vi.fn().mockResolvedValue({ error: null });

  // Cada mockReturnValueOnce corresponde a uma chamada from() na ordem do service
  vi.mocked(supabase.from)
    // 1. SELECT backup
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(calls.backup),
      }),
    } as any)
    // 2. DELETE
    .mockReturnValueOnce({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue(calls.delete),
      }),
    } as any)
    // 3. INSERT novos
    .mockReturnValueOnce({
      insert: vi.fn().mockResolvedValue(calls.insertNovos),
    } as any)
    // 4. INSERT rollback (só chamado se passo 3 falhar)
    .mockReturnValueOnce({
      insert: insertRollbackFn,
    } as any);

  return { insertRollbackFn };
}

beforeEach(() => {
  vi.clearAllMocks();
});

const DISCIPLINA_CODIGO = 'T1-TEOS1';

const novosPrereqs: Prerequisito[] = [
  { disciplina_codigo: DISCIPLINA_CODIGO, prerequisito_codigo: 'B1-ANT01', tipo: 'formal' },
];

const backupData = [
  { disciplina_codigo: DISCIPLINA_CODIGO, prerequisito_codigo: 'TH01', tipo: 'recomendado' },
];

describe('cursos.service', () => {
  describe('getDisciplinas', () => {
    it('retorna disciplinas quando Supabase responde', async () => {
      mockSelectDoubleOrder({
        data: [{ codigo: 'T1-TEOS1', nome: 'Teologia Sistemática I', modulo: 1 }],
        error: null,
      });

      const resultado = await getDisciplinas();

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('T1-TEOS1');
      expect(resultado[0].nome).toBe('Teologia Sistemática I');
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      mockSelectDoubleOrder({ data: null, error: { message: 'connection error' } });

      const resultado = await getDisciplinas();

      expect(resultado).toEqual([]);
    });
  });

  describe('syncPrerequisitos', () => {
    it('executa backup → delete → insert com sucesso e retorna error=null', async () => {
      mockSync({
        backup:      { data: backupData, error: null },
        delete:      { error: null },
        insertNovos: { error: null },
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBeNull();
      // from() deve ter sido chamado 3 vezes (SELECT + DELETE + INSERT)
      expect(supabase.from).toHaveBeenCalledTimes(3);
    });

    it('retorna erro e NÃO chama DELETE quando SELECT (backup) falha', async () => {
      vi.mocked(supabase.from).mockReset();
      // Só monta o mock de backup com erro — DELETE nunca será chamado
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'read error' } }),
        }),
      } as any);

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Erro ao ler pré-requisitos atuais.');
      // from() só foi chamado 1 vez (apenas SELECT) — DELETE nunca chegou
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });

    it('retorna erro e NÃO chama INSERT quando DELETE falha', async () => {
      mockSync({
        backup:      { data: [], error: null },
        delete:      { error: { message: 'delete blocked by RLS' } },
        insertNovos: { error: null }, // nunca chegará a ser chamado
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Erro ao remover pré-requisitos antigos.');
      // from() chamado 2 vezes (SELECT + DELETE) — INSERT nunca chegou
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('executa rollback (INSERT backup) quando INSERT de novos falha', async () => {
      const { insertRollbackFn } = mockSync({
        backup:         { data: backupData, error: null },
        delete:         { error: null },
        insertNovos:    { error: { message: 'insert constraint violation' } },
        insertRollback: { error: null },
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Erro ao salvar pré-requisitos. Estado anterior restaurado.');

      // Rollback chamado com os dados do backup
      expect(insertRollbackFn).toHaveBeenCalledTimes(1);
      expect(insertRollbackFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ prerequisito_codigo: 'TH01' }),
        ])
      );

      // from() chamado 4 vezes: SELECT + DELETE + INSERT novos + INSERT rollback
      expect(supabase.from).toHaveBeenCalledTimes(4);
    });
  });
});
