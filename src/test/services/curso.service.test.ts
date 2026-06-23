import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { uploadManualAluno, getManualAlunoUrl, MAX_MANUAL_BYTES } from '@/services/curso.service';

const CURSO = { id: 'curso-1', codigo: 'TEO', nome: 'Teologia', ativo: true, manual_aluno_url: null as string | null };

// getCursoAtivo → from('cursos').select().eq().order().limit().single()
function cursoChain(curso: any) {
  return { select: () => ({ eq: () => ({ order: () => ({ limit: () => ({ single: () => Promise.resolve({ data: curso, error: null }) }) }) }) }) };
}

function fakeFile(name: string, size: number, type = 'application/pdf'): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

beforeEach(() => { vi.clearAllMocks(); });

describe('curso.service — Manual do Aluno', () => {
  describe('uploadManualAluno — validações', () => {
    it('rejeita arquivo não-PDF', async () => {
      const r = await uploadManualAluno(fakeFile('manual.docx', 1000, 'application/msword'));
      expect(r.error).toMatch(/PDF/i);
    });

    it('rejeita PDF acima de 50MB', async () => {
      const r = await uploadManualAluno(fakeFile('manual.pdf', MAX_MANUAL_BYTES + 1));
      expect(r.error).toMatch(/50 MB/);
    });
  });

  describe('uploadManualAluno — sucesso', () => {
    it('sobe o PDF e grava o path no curso ativo', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from)
        .mockReturnValueOnce(cursoChain(CURSO) as any)                                  // getCursoAtivo
        .mockReturnValueOnce({ update: () => ({ eq: () => Promise.resolve({ error: null }) }) } as any); // update cursos
      const uploadFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.storage.from).mockReturnValue({ upload: uploadFn } as any);

      const r = await uploadManualAluno(fakeFile('manual-aluno.pdf', 2048));
      expect(r.error).toBeNull();
      expect(uploadFn).toHaveBeenCalledWith('handbook/manual-aluno.pdf', expect.anything(), expect.objectContaining({ upsert: true }));
    });

    it('retorna erro se não há curso ativo', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue(cursoChain(null) as any);
      const r = await uploadManualAluno(fakeFile('manual.pdf', 1000));
      expect(r.error).toMatch(/curso ativo/i);
    });
  });

  describe('getManualAlunoUrl', () => {
    it('retorna signed URL quando há manual', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue(cursoChain({ ...CURSO, manual_aluno_url: 'handbook/manual-aluno.pdf' }) as any);
      vi.mocked(supabase.storage.from).mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed/manual' }, error: null }),
      } as any);

      const r = await getManualAlunoUrl();
      expect(r.error).toBeNull();
      expect(r.url).toBe('https://signed/manual');
    });

    it('retorna url=null quando o curso não tem manual', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue(cursoChain({ ...CURSO, manual_aluno_url: null }) as any);
      const r = await getManualAlunoUrl();
      expect(r.url).toBeNull();
      expect(r.error).toBeNull();
    });
  });
});
