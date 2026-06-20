import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getDisciplinas, syncPrerequisitos } from '@/services/cursos.service';
import type { Prerequisito } from '@/services/cursos.service';

// getDisciplinas faz 2 queries separadas (LICAO-026):
// 1. from('disciplinas_v2').select(...).limit()
// 2. from('modulos').select(...).limit()
function mockGetDisciplinas(
  discs: { data: any; error: any },
  mods: { data: any; error: any },
) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from)
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(discs) }),
    } as any)
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(mods) }),
    } as any);
}

// Disciplinas para resolver codigo→id em syncPrerequisitos
const discCodigos = [
  { id: 'id-t1dog', codigo: 'T1DOG' },
  { id: 'id-b1atg', codigo: 'B1ATG' },
];

// syncPrerequisitos faz, em sequência:
// 0. SELECT resolve codigo→id: from('disciplinas_v2').select().limit()
// 1. SELECT backup:           from('prerequisitos_v2').select().eq()
// 2. DELETE:                  from('prerequisitos_v2').delete().eq()
// 3. INSERT novos:            from('prerequisitos_v2').insert()
// 4. INSERT rollback:         from('prerequisitos_v2').insert()
function mockSync(calls: {
  resolve?:        { data: any; error: any };
  backup:          { data: any; error: any };
  delete:          { error: any };
  insertNovos:     { error: any };
  insertRollback?: { error: any };
}) {
  vi.mocked(supabase.from).mockReset();

  const resolveResult = calls.resolve ?? { data: discCodigos, error: null };
  const insertRollbackFn = calls.insertRollback
    ? vi.fn().mockResolvedValue(calls.insertRollback)
    : vi.fn().mockResolvedValue({ error: null });

  vi.mocked(supabase.from)
    // 0. resolve codigo→id
    .mockReturnValueOnce({
      select: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(resolveResult) }),
    } as any)
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

const DISCIPLINA_CODIGO = 'T1DOG';

const novosPrereqs: Prerequisito[] = [
  { disciplina_codigo: DISCIPLINA_CODIGO, prerequisito_codigo: 'B1ATG', tipo: 'prerequisito' },
];

// backup vem de prerequisitos_v2 → linhas baseadas em id
const backupData = [
  { disciplina_id: 'id-t1dog', prerequisito_id: 'id-prev', tipo: 'recomendado' },
];

describe('cursos.service', () => {
  describe('getDisciplinas', () => {
    it('retorna disciplinas (adapter sobre disciplinas_v2 + modulos)', async () => {
      mockGetDisciplinas(
        {
          data: [{
            id: 'id-b1atg', modulo_id: 'm1', codigo: 'B1ATG', nome: 'Introdução ao AT I',
            area: 'B', ano_curso: 1, carga_horaria_presencial: 30, carga_horaria_ead: 10,
            creditos: 4, tipo: 'regular', ativo: true,
          }],
          error: null,
        },
        { data: [{ id: 'm1', ordem: 1 }], error: null },
      );

      const resultado = await getDisciplinas();

      expect(resultado).toHaveLength(1);
      expect(resultado[0].codigo).toBe('B1ATG');
      expect(resultado[0].nome).toBe('Introdução ao AT I');
      expect(resultado[0].modulo).toBe(1);            // resolvido de modulos.ordem
      expect(resultado[0].carga_horaria).toBe(40);    // presencial + ead
      expect(resultado[0].horas_presencial).toBe(30);
    });

    it('retorna array vazio quando Supabase retorna erro', async () => {
      mockGetDisciplinas(
        { data: null, error: { message: 'connection error' } },
        { data: null, error: null },
      );

      const resultado = await getDisciplinas();

      expect(resultado).toEqual([]);
    });
  });

  describe('syncPrerequisitos', () => {
    it('executa resolve → backup → delete → insert com sucesso e retorna error=null', async () => {
      mockSync({
        backup:      { data: backupData, error: null },
        delete:      { error: null },
        insertNovos: { error: null },
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBeNull();
      // from(): resolve + SELECT + DELETE + INSERT = 4
      expect(supabase.from).toHaveBeenCalledTimes(4);
    });

    it('retorna erro e NÃO chama DELETE quando SELECT (backup) falha', async () => {
      mockSync({
        backup:      { data: null, error: { message: 'read error' } },
        delete:      { error: null }, // nunca chega
        insertNovos: { error: null },
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Erro ao ler pré-requisitos atuais.');
      // from(): resolve + SELECT backup = 2 (DELETE nunca chegou)
      expect(supabase.from).toHaveBeenCalledTimes(2);
    });

    it('retorna erro e NÃO chama INSERT quando DELETE falha', async () => {
      mockSync({
        backup:      { data: [], error: null },
        delete:      { error: { message: 'delete blocked by RLS' } },
        insertNovos: { error: null }, // nunca chega
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Erro ao remover pré-requisitos antigos.');
      // from(): resolve + SELECT + DELETE = 3 (INSERT nunca chegou)
      expect(supabase.from).toHaveBeenCalledTimes(3);
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

      // Rollback chamado com os dados do backup (baseado em id)
      expect(insertRollbackFn).toHaveBeenCalledTimes(1);
      expect(insertRollbackFn).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ prerequisito_id: 'id-prev' }),
        ])
      );

      // from(): resolve + SELECT + DELETE + INSERT novos + INSERT rollback = 5
      expect(supabase.from).toHaveBeenCalledTimes(5);
    });

    it('retorna erro quando a disciplina não existe em disciplinas_v2', async () => {
      mockSync({
        resolve:     { data: [{ id: 'id-x', codigo: 'OUTRA' }], error: null },
        backup:      { data: [], error: null },
        delete:      { error: null },
        insertNovos: { error: null },
      });

      const result = await syncPrerequisitos(DISCIPLINA_CODIGO, novosPrereqs);

      expect(result.error).toBe('Disciplina não encontrada.');
      // from(): apenas resolve = 1
      expect(supabase.from).toHaveBeenCalledTimes(1);
    });
  });
});
