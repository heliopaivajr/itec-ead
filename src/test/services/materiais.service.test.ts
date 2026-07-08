import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  listarMateriais, criarMaterial, uploadArquivo, getDownloadUrl,
  aprovarMaterial, desativarMaterial, MAX_UPLOAD_BYTES,
} from '@/services/materiais.service';

beforeEach(() => {
  vi.clearAllMocks();
  // auth.getUser não existe no mock global — adiciona aqui
  (supabase.auth as any).getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
});

// from('materiais_disciplina').select().eq().eq().order().limit() → resolve
function mockList(result: { data: any; error: any }) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve(result) }) }) }) }),
  } as any);
}

// criarMaterial consulta profiles (role do criador → auto-aprovação) antes do insert.
// Retorna o spy do insert para asserções de payload (status/aprovado_por).
function mockInsert(result: { error: any }, role: string = 'administracao') {
  vi.mocked(supabase.from).mockReset();
  const insertSpy = vi.fn().mockResolvedValue(result);
  vi.mocked(supabase.from).mockImplementation(((table: string) => {
    if (table === 'profiles') {
      return { select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: { role }, error: null }) }) }) };
    }
    return { insert: insertSpy };
  }) as any);
  return insertSpy;
}

function mockUpdateEq(result: { error: any }) {
  vi.mocked(supabase.from).mockReset();
  vi.mocked(supabase.from).mockReturnValue({
    update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(result) }),
  } as any);
}

// File com tamanho forjado (sem alocar memória)
function fakeFile(name: string, size: number): File {
  const f = new File(['x'], name, { type: 'application/octet-stream' });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('materiais.service', () => {
  describe('listarMateriais', () => {
    it('retorna materiais quando há dados', async () => {
      mockList({ data: [{ id: 'm1', titulo: 'Apostila' }], error: null });
      const r = await listarMateriais('disc-1');
      expect(r).toHaveLength(1);
      expect(r[0].titulo).toBe('Apostila');
    });

    it('retorna [] quando erro', async () => {
      mockList({ data: null, error: { message: 'rls' } });
      expect(await listarMateriais('disc-1')).toEqual([]);
    });
  });

  describe('criarMaterial', () => {
    it('staff (administracao): insere com status pendente — curadoria mantida', async () => {
      const insertSpy = mockInsert({ error: null }, 'administracao');
      const r = await criarMaterial({
        disciplina_id: 'disc-1', titulo: 'Aula 1', tipo: 'pdf', origem: 'upload', arquivo_url: 'disc-1/uuid.pdf',
      });
      expect(r.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('materiais_disciplina');
      expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'pendente' }));
      expect(insertSpy.mock.calls[0][0].aprovado_por).toBeUndefined();
    });

    // Decisão do Hélio (sprint Material do Professor): material de PROFESSOR entra
    // auto-aprovado. O RLS (056) garante que ele só insere na cadeira do contrato.
    it('professor: insere AUTO-APROVADO (status aprovado + aprovado_por/aprovado_em)', async () => {
      const insertSpy = mockInsert({ error: null }, 'professor');
      const r = await criarMaterial({
        disciplina_id: 'disc-1', titulo: 'Slides Aula 2', tipo: 'pdf', origem: 'upload', arquivo_url: 'disc-1/uuid.pdf',
      });
      expect(r.error).toBeNull();
      expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({
        status: 'aprovado',
        aprovado_por: 'u1',            // uid do mock de auth.getUser
        criado_por: 'u1',
      }));
      expect(insertSpy.mock.calls[0][0].aprovado_em).toEqual(expect.any(String));
    });

    it('professor: link (YouTube) também entra auto-aprovado', async () => {
      const insertSpy = mockInsert({ error: null }, 'professor');
      const r = await criarMaterial({
        disciplina_id: 'disc-1', titulo: 'Aula gravada', tipo: 'video', origem: 'link', arquivo_url: 'https://youtu.be/x',
      });
      expect(r.error).toBeNull();
      expect(insertSpy).toHaveBeenCalledWith(expect.objectContaining({ status: 'aprovado', origem: 'link' }));
    });

    it('propaga erro do banco', async () => {
      mockInsert({ error: { message: 'insert falhou' } });
      const r = await criarMaterial({
        disciplina_id: 'disc-1', titulo: 'x', tipo: 'outro', origem: 'link', arquivo_url: 'https://youtu.be/x',
      });
      expect(r.error).toBe('insert falhou');
    });
  });

  describe('uploadArquivo — validações', () => {
    it('bloqueia extensão não permitida', async () => {
      const { path, error } = await uploadArquivo('disc-1', fakeFile('virus.exe', 1000));
      expect(path).toBeNull();
      expect(error).toMatch(/não permitida/i);
    });

    it('bloqueia arquivo acima de 50MB e sugere link', async () => {
      const { path, error } = await uploadArquivo('disc-1', fakeFile('aula.mp4', MAX_UPLOAD_BYTES + 1));
      expect(path).toBeNull();
      expect(error).toMatch(/50 MB/);
      expect(error).toMatch(/YouTube|link/i);
    });

    it('sobe arquivo válido e retorna path + tamanho', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
      } as any);
      const file = fakeFile('apostila.pdf', 1024);
      const { path, tamanho_bytes, error } = await uploadArquivo('disc-1', file);
      expect(error).toBeNull();
      expect(tamanho_bytes).toBe(1024);
      expect(path).toMatch(/^disc-1\/.*\.pdf$/);
    });
  });

  describe('getDownloadUrl', () => {
    it('retorna signed URL', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed/url' }, error: null }),
      } as any);
      const { url, error } = await getDownloadUrl('disc-1/uuid.pdf');
      expect(error).toBeNull();
      expect(url).toBe('https://signed/url');
    });

    it('retorna erro quando o storage falha', async () => {
      vi.mocked(supabase.storage.from).mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
      } as any);
      const { url, error } = await getDownloadUrl('x');
      expect(url).toBeNull();
      expect(error).toBe('not found');
    });
  });

  describe('aprovarMaterial / desativarMaterial', () => {
    it('aprova e retorna error=null', async () => {
      mockUpdateEq({ error: null });
      const r = await aprovarMaterial('m1');
      expect(r.error).toBeNull();
      expect(supabase.from).toHaveBeenCalledWith('materiais_disciplina');
    });

    it('desativa (soft delete) e retorna error=null', async () => {
      mockUpdateEq({ error: null });
      const r = await desativarMaterial('m1');
      expect(r.error).toBeNull();
    });

    it('propaga erro ao desativar', async () => {
      mockUpdateEq({ error: { message: 'rls blocked' } });
      const r = await desativarMaterial('m1');
      expect(r.error).toBe('rls blocked');
    });
  });
});
