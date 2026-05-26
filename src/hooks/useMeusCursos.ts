import { useState, useEffect } from 'react';
import {
  getCursoAtivo,
  getModulosByCurso,
  getDisciplinasByModulo,
  verificarPrerequisitos,
  type Curso,
  type Modulo,
  type Disciplina,
} from '@/services/academico.service';
import {
  getMatriculasDisciplinaByAluno,
  type MatriculaDisciplina,
} from '@/services/matricula-academica.service';
import {
  getResumoFrequencia,
  type ResumoFrequencia,
} from '@/services/frequencia.service';
import {
  getMateriaisByDisciplina,
  getPercentualProgresso,
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
  // Se nenhum ativo, retorna o próximo futuro
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

        // Carrega frequência, materiais e pré-requisitos em paralelo por disciplina
        const disciplinasComProgresso = await Promise.all(
          regulares.map(async (disc): Promise<DisciplinaComProgresso> => {
            const matricula = matriculas.find(m => m.disciplina_id === disc.id) ?? null;

            const [frequencia, materiais, prereqs, percentualMat] = await Promise.all([
              matricula ? getResumoFrequencia(alunoId, disc.id) : Promise.resolve(null),
              getMateriaisByDisciplina(disc.id, true),
              verificarPrerequisitos(alunoId, disc.id),
              matricula ? getPercentualProgresso(alunoId, disc.id) : Promise.resolve(0),
            ]);

            return {
              disciplina:           disc,
              matricula,
              frequencia,
              percentual_materiais: percentualMat,
              materiais_count:      materiais.length,
              prereqs_ok:           prereqs.aprovado,
              prereqs_faltam:       prereqs.faltam,
            };
          })
        );

        setState({
          curso,
          modulo_atual:  modulo,
          disciplinas:   disciplinasComProgresso,
          eletivas,
          loading:       false,
          error:         null,
        });
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
