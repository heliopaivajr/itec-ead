import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import {
  getProfessores,
  getProfessorById,
  getProfessorByUserId,
  createProfessor,
  updateProfessor,
  desativarProfessor,
  getContratosByProfessor,
  getContratoById,
  getContratoByDisciplina,
  updateStatusContrato,
  vincularDisciplina,
  preencherContrato,
  getDisciplinasAtivasProfessor,
  CONTRATO_ATIVO,
  uploadContratoAssinado,
  getContratoAssinadoUrl,
  MAX_CONTRATO_BYTES,
} from '@/services/professor.service';

beforeEach(() => { vi.clearAllMocks(); });

describe('professor.service', () => {
  describe('getProfessores', () => {
    it('retorna página 1 com total correto', async () => {
      vi.mocked(supabase.from).mockReset();
      // getProfessores(apenasAtivos=true) usa .not('status','eq','desligado') em vez de .eq('ativo',true)
      const chain = {
        not:   vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [
            { id: 'p1', nome_completo: 'Prof. João', ativo: true, status: 'ativo' },
            { id: 'p2', nome_completo: 'Prof. Maria', ativo: true, status: 'ativo' },
          ],
          count: 15,
          error: null,
        }),
      };
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chain),
      } as any);

      const resultado = await getProfessores(1, 20);

      expect(resultado.data).toHaveLength(2);
      expect(resultado.total).toBe(15);
      expect(chain.not).toHaveBeenCalledWith('status', 'eq', 'desligado');
    });

    it('retorna { data: [], total: 0 } quando Supabase retorna erro', async () => {
      vi.mocked(supabase.from).mockReset();
      const chain = {
        not:   vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, count: null, error: { message: 'error' } }),
      };
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chain),
      } as any);

      const resultado = await getProfessores();

      expect(resultado.data).toEqual([]);
      expect(resultado.total).toBe(0);
    });
  });

  describe('getProfessorByUserId', () => {
    it('retorna professor quando user_id existe', async () => {
      vi.mocked(supabase.from).mockReset();
      const mockSingle = vi.fn().mockResolvedValue({
        data: { id: 'prof-1', nome_completo: 'Prof. João', user_id: 'user-123' },
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
      } as any);

      const prof = await getProfessorByUserId('user-123');

      expect(prof).not.toBeNull();
      expect(prof?.user_id).toBe('user-123');
    });

    it('retorna null quando professor não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const prof = await getProfessorByUserId('user-inexistente');

      expect(prof).toBeNull();
    });
  });

  describe('getProfessorById', () => {
    it('retorna professor quando id existe', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'prof-1', nome_completo: 'Prof. Ana', ativo: true },
              error: null,
            }),
          }),
        }),
      } as any);

      const prof = await getProfessorById('prof-1');

      expect(prof).not.toBeNull();
      expect(prof?.id).toBe('prof-1');
    });

    it('retorna null quando não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const prof = await getProfessorById('inexistente');

      expect(prof).toBeNull();
    });
  });

  describe('createProfessor', () => {
    it('insere professor e retorna data com error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'novo-1', nome_completo: 'Dr. Paulo', email: 'paulo@itec.com' },
              error: null,
            }),
          }),
        }),
      } as any);

      const payload = {
        user_id: null, nome_completo: 'Dr. Paulo', cpf: '000.000.000-00',
        rg: null, data_nascimento: null, telefone: null,
        email: 'paulo@itec.com', endereco: null, formacao: null,
        titulacao: null, experiencia_ministerial: null, igreja_local: null, ativo: true,
      };
      const resultado = await createProfessor(payload);

      expect(resultado.error).toBeNull();
      expect(resultado.data?.nome_completo).toBe('Dr. Paulo');
    });

    it('retorna error quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'unique violation' } }),
          }),
        }),
      } as any);

      const resultado = await createProfessor({
        user_id: null, nome_completo: 'X', cpf: '000', rg: null, data_nascimento: null,
        telefone: null, email: 'x@x.com', endereco: null, formacao: null,
        titulacao: null, experiencia_ministerial: null, igreja_local: null, ativo: true,
      });

      expect(resultado.data).toBeNull();
      expect(resultado.error).toBe('unique violation');
    });
  });

  describe('updateProfessor', () => {
    it('atualiza campos e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as any);

      const resultado = await updateProfessor('prof-1', { formacao: 'Mestre em Teologia' });

      expect(resultado.error).toBeNull();
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'not found' } }),
        }),
      } as any);

      const resultado = await updateProfessor('inexistente', { formacao: 'X' });

      expect(resultado.error).toBe('not found');
    });
  });

  describe('desativarProfessor', () => {
    it('define ativo=false e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await desativarProfessor('prof-1');

      expect(resultado.error).toBeNull();
      expect(updateFn.mock.calls[0][0].ativo).toBe(false);
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await desativarProfessor('prof-1');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('getContratosByProfessor', () => {
    it('retorna contratos do professor', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  { id: 'c1', professor_id: 'prof-1', status: 'pendente' },
                  { id: 'c2', professor_id: 'prof-1', status: 'assinado' },
                ],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getContratosByProfessor('prof-1');

      expect(resultado).toHaveLength(2);
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

      const resultado = await getContratosByProfessor('prof-1');

      expect(resultado).toEqual([]);
    });
  });

  describe('getContratoById', () => {
    it('retorna contrato quando id existe', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'c1', status: 'preenchido' },
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await getContratoById('c1');

      expect(resultado?.id).toBe('c1');
    });

    it('retorna null quando não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as any);

      const resultado = await getContratoById('inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('getContratoByDisciplina', () => {
    it('retorna contrato quando professor+disciplina existem', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'c1', professor_id: 'p1', disciplina_id: 'd1', status: 'assinado' },
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const resultado = await getContratoByDisciplina('p1', 'd1');

      expect(resultado?.disciplina_id).toBe('d1');
    });

    it('retorna null quando não encontrado', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }),
      } as any);

      const resultado = await getContratoByDisciplina('p1', 'd-inexistente');

      expect(resultado).toBeNull();
    });
  });

  describe('updateStatusContrato', () => {
    it('atualiza status para assinado com timestamp assinado_em', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      const resultado = await updateStatusContrato('c1', 'assinado');

      expect(resultado.error).toBeNull();
      const payload = updateFn.mock.calls[0][0];
      expect(payload.status).toBe('assinado');
      expect(payload.assinado_em).toBeDefined();
    });

    it('não inclui timestamp extra para status encerrado', async () => {
      vi.mocked(supabase.from).mockReset();
      const eqFn = vi.fn().mockResolvedValue({ error: null });
      const updateFn = vi.fn().mockReturnValue({ eq: eqFn });
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any);

      await updateStatusContrato('c1', 'encerrado');

      const payload = updateFn.mock.calls[0][0];
      expect(payload.status).toBe('encerrado');
      expect(payload.assinado_em).toBeUndefined();
      expect(payload.preenchido_em).toBeUndefined();
    });

    it('retorna error quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'rls blocked' } }),
        }),
      } as any);

      const resultado = await updateStatusContrato('c1', 'assinado');

      expect(resultado.error).toBe('rls blocked');
    });
  });

  describe('vincularDisciplina', () => {
    it('cria contrato pendente e retorna data com error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'c-new', professor_id: 'p1', disciplina_id: 'd1', status: 'pendente' },
              error: null,
            }),
          }),
        }),
      } as any);

      const resultado = await vincularDisciplina('p1', 'd1', 'admin-1');

      expect(resultado.error).toBeNull();
      expect(resultado.data?.status).toBe('pendente');
    });

    it('retorna error quando insert falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'duplicate' } }),
          }),
        }),
      } as any);

      const resultado = await vincularDisciplina('p1', 'd1', 'admin-1');

      expect(resultado.data).toBeNull();
      expect(resultado.error).toBe('duplicate');
    });
  });

  describe('preencherContrato', () => {
    it('salva dados e retorna error=null', async () => {
      vi.mocked(supabase.from).mockReset();
      const mockUpdateFn = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: mockUpdateFn }),
      } as any);

      const dados = { nome_completo: 'Prof. João', cpf: '123.456.789-00' };
      const resultado = await preencherContrato('contrato-1', dados);

      expect(resultado.error).toBeNull();
      // Verifica que os dados e o status foram enviados
      const chamada = vi.mocked(supabase.from).mock.results[0].value.update.mock.calls[0][0];
      expect(chamada.dados_preenchidos).toEqual(dados);
      expect(chamada.status).toBe('preenchido');
      expect(chamada.preenchido_em).toBeDefined();
    });

    it('retorna erro quando update falha', async () => {
      vi.mocked(supabase.from).mockReset();
      vi.mocked(supabase.from).mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'update failed' } }),
        }),
      } as any);

      const resultado = await preencherContrato('contrato-1', {});

      expect(resultado.error).toBe('update failed');
    });
  });
});

// ─── getDisciplinasAtivasProfessor ────────────────────────────────────────────

describe('getDisciplinasAtivasProfessor', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('professor sem contratos ativos → retorna []', async () => {
    vi.mocked(supabase.from).mockReset();
    const inStatusFn = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ in: inStatusFn }),
      }),
    } as any);

    const resultado = await getDisciplinasAtivasProfessor('prof-1');

    expect(resultado).toEqual([]);
    // Decisão C: filtra por status NÃO-encerrado (lista CONTRATO_ATIVO)
    expect(inStatusFn).toHaveBeenCalledWith('status', CONTRATO_ATIVO);
    expect(CONTRATO_ATIVO).toContain('pendente');
    expect(CONTRATO_ATIVO).toContain('impresso');
    expect(CONTRATO_ATIVO).not.toContain('encerrado');
  });

  it('contratos PENDENTE/IMPRESSO contam (não-encerrados destravam o professor)', async () => {
    vi.mocked(supabase.from).mockReset();

    // Call 1: contrato ainda 'pendente' (sem assinatura) — deve aparecer
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{
                id: 'cont-pend', disciplina_id: 'disc-9',
                disciplinas_v2: { nome: 'Hermenêutica', modulos: { curso_id: 'curso-1' } },
              }],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    // Call 2: turma ativa
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{ id: 't9', nome: 'Turma X', ano: 2026, semestre: 1, curso_id: 'curso-1' }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any);

    const resultado = await getDisciplinasAtivasProfessor('prof-pend');

    expect(resultado).toHaveLength(1);
    expect(resultado[0].disciplina_nome).toBe('Hermenêutica');
  });

  it('professor com contrato → retorna disciplina com turma', async () => {
    vi.mocked(supabase.from).mockReset();

    // Call 1: contratos_professor com join
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{
                id: 'cont-1',
                disciplina_id: 'disc-1',
                disciplinas_v2: {
                  nome: 'Novo Testamento I',
                  modulos: { curso_id: 'curso-1' },
                },
              }],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    // Call 2: turmas ativas por curso
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [{
                  id: 'turma-1', nome: '2ª Turma Teologia — 2026',
                  ano: 2026, semestre: 1, curso_id: 'curso-1',
                }],
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any);

    const resultado = await getDisciplinasAtivasProfessor('prof-1');

    expect(resultado).toHaveLength(1);
    expect(resultado[0].contrato_id).toBe('cont-1');
    expect(resultado[0].disciplina_id).toBe('disc-1');
    expect(resultado[0].disciplina_nome).toBe('Novo Testamento I');
    expect(resultado[0].turma_nome).toBe('2ª Turma Teologia — 2026');
    expect(resultado[0].turma_ano).toBe(2026);
    expect(resultado[0].turma_semestre).toBe(1);
  });

  it('professor com contrato mas sem turma ativa → retorna disciplina com turma null', async () => {
    vi.mocked(supabase.from).mockReset();

    // Call 1: contratos com disciplina + modulo
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [{
                id: 'cont-2', disciplina_id: 'disc-2',
                disciplinas_v2: { nome: 'AT I', modulos: { curso_id: 'curso-1' } },
              }],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    // Call 2: nenhuma turma ativa para esse curso
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    } as any);

    const resultado = await getDisciplinasAtivasProfessor('prof-2');

    expect(resultado).toHaveLength(1);
    expect(resultado[0].disciplina_nome).toBe('AT I');
    expect(resultado[0].turma_id).toBeNull();
    expect(resultado[0].turma_nome).toBeNull();
  });
});

// ─── Contrato assinado (sprint Material do Professor, migração 056) ─────────────

function fakePdf(name: string, size: number, type = 'application/pdf'): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('uploadContratoAssinado', () => {
  it('bloqueia arquivo que não é PDF', async () => {
    const { error } = await uploadContratoAssinado('c1', fakePdf('foto.png', 1000, 'image/png'));
    expect(error).toMatch(/PDF/i);
  });

  it('bloqueia PDF acima de 20MB', async () => {
    const { error } = await uploadContratoAssinado('c1', fakePdf('contrato.pdf', MAX_CONTRATO_BYTES + 1));
    expect(error).toMatch(/20 MB/);
  });

  it('sobe o PDF em {contratoId}/{uuid}.pdf e grava pdf_url na linha do contrato', async () => {
    const uploadSpy = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({ upload: uploadSpy } as any);

    const updateSpy = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    vi.mocked(supabase.from).mockReset();
    vi.mocked(supabase.from).mockReturnValue({ update: updateSpy } as any);

    const { error } = await uploadContratoAssinado('contrato-1', fakePdf('assinado.pdf', 1024));

    expect(error).toBeNull();
    expect(supabase.storage.from).toHaveBeenCalledWith('contratos-professor');
    // path começa com o contratoId (foldername[1] — gate da policy 056)
    expect(uploadSpy.mock.calls[0][0]).toMatch(/^contrato-1\/.*\.pdf$/);
    // grava SÓ pdf_url — professor não muda status (quem confirma é a secretaria)
    expect(supabase.from).toHaveBeenCalledWith('contratos_professor');
    expect(updateSpy).toHaveBeenCalledWith({ pdf_url: expect.stringMatching(/^contrato-1\//) });
    expect(updateSpy.mock.calls[0][0].status).toBeUndefined();
  });

  it('propaga erro do storage sem tocar na tabela', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: { message: 'bucket negado' } }),
    } as any);
    vi.mocked(supabase.from).mockReset();

    const { error } = await uploadContratoAssinado('c1', fakePdf('a.pdf', 1024));
    expect(error).toBe('bucket negado');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('getContratoAssinadoUrl', () => {
  it('retorna signed URL (1h)', async () => {
    const signedSpy = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed/contrato' }, error: null });
    vi.mocked(supabase.storage.from).mockReturnValue({ createSignedUrl: signedSpy } as any);

    const { url, error } = await getContratoAssinadoUrl('c1/uuid.pdf');
    expect(error).toBeNull();
    expect(url).toBe('https://signed/contrato');
    expect(signedSpy).toHaveBeenCalledWith('c1/uuid.pdf', 3600);
  });

  it('retorna erro quando o storage falha', async () => {
    vi.mocked(supabase.storage.from).mockReturnValue({
      createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    } as any);
    const { url, error } = await getContratoAssinadoUrl('x');
    expect(url).toBeNull();
    expect(error).toBe('not found');
  });
});
