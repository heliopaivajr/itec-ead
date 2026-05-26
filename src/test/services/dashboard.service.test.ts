import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { getKpis, getLeadsPorCurso } from '@/services/dashboard.service';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('dashboard.service', () => {
  describe('getKpis', () => {
    it('retorna KPIs corretos com 4 COUNTs em Promise.all', async () => {
      // Ordem das chamadas em getKpis:
      // 1. profiles.select.eq('role','aluno')   → count: 8
      // 2. profiles.select.eq('role','professor')→ count: 2
      // 3. leads_cursos.select                  → count: 10
      // 4. matriculas.select                    → count: 5
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 8, error: null }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({ count: 10, error: null }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({ count: 5, error: null }),
        } as any);

      const kpis = await getKpis();

      expect(kpis.alunos).toBe(8);
      expect(kpis.professores).toBe(2);
      expect(kpis.leads).toBe(10);
      expect(kpis.matriculas).toBe(5);
    });

    it('retorna zeros quando Supabase retorna count=null', async () => {
      const nullCountMock = { count: null, error: { message: 'error' } };
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(nullCountMock),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue(nullCountMock),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue(nullCountMock),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue(nullCountMock),
        } as any);

      const kpis = await getKpis();

      expect(kpis.alunos).toBe(0);
      expect(kpis.professores).toBe(0);
      expect(kpis.leads).toBe(0);
      expect(kpis.matriculas).toBe(0);
    });
  });

  describe('getLeadsPorCurso', () => {
    it('agrupa leads por curso com totais corretos', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { curso_interesse: 'Teologia' },
            { curso_interesse: 'Teologia' },
            { curso_interesse: 'SETEB' },
          ],
          error: null,
        }),
      } as any);

      const resultado = await getLeadsPorCurso();

      // Verifica totais independente da ordem (Object.entries não garante sort)
      expect(resultado).toHaveLength(2);
      expect(resultado).toEqual(
        expect.arrayContaining([
          { curso: 'Teologia', total: 2 },
          { curso: 'SETEB',    total: 1 },
        ])
      );
    });

    it('retorna array vazio quando Supabase retorna data=null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'error' } }),
      } as any);

      const resultado = await getLeadsPorCurso();

      expect(resultado).toEqual([]);
    });
  });
});
