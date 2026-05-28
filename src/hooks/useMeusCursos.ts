import { useState, useEffect } from 'react';
import {
  getCursoAtivo,
  getModulosByCurso,
  getDisciplinasByModulo,
  verificarPrerequisitoBatch,
  type Curso,
  type Modulo,
  type Disciplina,
} from '@/services/academico.service';
import {
  getMatriculasDisciplinaByAluno,
  type MatriculaDisciplina,
} from '@/services/matricula-academica.service';
import {
  getResumoFrequenciaBatch,
  type ResumoFrequencia,
} from '@/services/frequencia.service';
import {
  getMateriaiseProgressoBatch,
} from '@/services/material.service';

export interface DisciplinaComProgresso {
  disciplina: Disciplina;
  matricula: MatriculaDisciplina | null;
  frequencia: ResumoFrequencia | null;
  percentual_materiais: number;
  materiais_count: number;
  prereqs_ok: boolean;
  prereqs_faltam: Disciplina[];
}

export interface MeusCursosData {
  curso: Curso | null;
  modulo_atual: Modulo | null;
  disciplinas: DisciplinaComProgresso[];
  eletivas: Disciplina[];
  loading: boolean;
  error: string | null;
}

function moduloAtual(modulos: Modulo[]): Modulo | null {
  const hoje = new Date().toISOString().split('T')[0];
  const ativo = modulos.find(
    m => m.data_inicio && m.data_fim && m.data_inicio <= hoje && m.data_fim >= hoje
  );
  if (ativo) return ativo;
  return modulos
    .filter(m => m.data_inicio && m.data_inicio > hoje)
    .sort((a, b) => (a.data_inicio ?? '').localeCompare(b.data_inicio ?? ''))[0] ?? null;
}

export function useMeusCursos(alunoId: string): MeusCursosData {
  const [state, setState] = useState<MeusCursosData>({
    curso: null,
    modulo_atual: null,
    disciplinas: [],
    eletivas: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!alunoId) return;

    async function carregar() {
      setState(s => ({ ...s, loading: true, error: null }));

      try {
        const curso = await getCursoAtivo();
        if (!curso) {
          setState({ curso: null, modulo_atual: null, disciplinas: [], eletivas: [], loading: false, error: null });
          return;
        }

        const [modulos, matriculas] = await Promise.all([
          getModulosByCurso(curso.id),
          getMatriculasDisciplinaByAluno(alunoId),
        ]);

        const modulo = moduloAtual(modulos);
        if (!modulo) {
          setState({ curso, modulo_atual: null, disciplinas: [], eletivas: [], loading: false, error: null });
          return;
        }

        const todasDisciplinas = await getDisciplinasByModulo(modulo.id);
        const regulares = todasDisciplinas.filter(d => d.tipo !== 'eletiva');
        const eletivas  = todasDisciplinas.filter(d => d.tipo === 'eletiva');

        const ids = regulares.map(d => d.id);

        // 3 queries batch em paralelo — eram 32–40 queries individuais
        const [freqMap, materialMap, prereqMap] = await Promise.all([
          getResumoFrequenciaBatch(alunoId, ids),
          getMateriaiseProgressoBatch(alunoId, ids, true),
          verificarPrerequisitoBatch(alunoId, ids, todasDisciplinas),
        ]);

        const disciplinas: DisciplinaComProgresso[] = regulares.map(disc => {
          const matricula = matriculas.find(m => m.disciplina_id === disc.id) ?? null;
          const freq      = freqMap.get(disc.id) ?? null;
          const mat       = materialMap.get(disc.id) ?? { count: 0, percentual: 100 };
          const prereq    = prereqMap.get(disc.id) ?? { aprovado: true, faltam: [] };

          return {
            disciplina:           disc,
            matricula,
            frequencia:           matricula ? freq : null,
            percentual_materiais: mat.percentual,
            materiais_count:      mat.count,
            prereqs_ok:           prereq.aprovado,
            prereqs_faltam:       prereq.faltam,
          };
        });

        setState({ curso, modulo_atual: modulo, disciplinas, eletivas, loading: false, error: null });
      } catch (err) {
        setState(s => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro ao carregar dados acadêmicos.',
        }));
      }
    }

    carregar();
  }, [alunoId]);

  return state;
}
