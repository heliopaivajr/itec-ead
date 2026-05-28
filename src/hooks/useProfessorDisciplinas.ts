import { useState, useEffect } from 'react';
import {
  getProfessorByUserId,
  getContratosByProfessor,
  type Professor,
  type ContratoProfessor,
} from '@/services/professor.service';
import { getDisciplinaById, type Disciplina } from '@/services/academico.service';
import { getAlunosAbaixoLimite } from '@/services/frequencia.service';

export interface DisciplinaProfessor {
  contrato: ContratoProfessor;
  disciplina: Disciplina;
  alunos_em_risco: number;
  manual_disponivel: boolean;
}

export interface ProfessorDisciplinasData {
  professor: Professor | null;
  disciplinas: DisciplinaProfessor[];
  loading: boolean;
  error: string | null;
}

export function useProfessorDisciplinas(userId: string): ProfessorDisciplinasData {
  const [state, setState] = useState<ProfessorDisciplinasData>({
    professor:   null,
    disciplinas: [],
    loading:     true,
    error:       null,
  });

  useEffect(() => {
    if (!userId) return;

    async function carregar() {
      setState(s => ({ ...s, loading: true, error: null }));

      try {
        const professor = await getProfessorByUserId(userId);
        if (!professor) {
          // Usuário tem role='professor' mas ainda não tem registro na tabela professores.
          // Deixa professor=null e disciplinas=[]; ProfessorHome mostra aviso de cadastro incompleto.
          setState({ professor: null, disciplinas: [], loading: false, error: 'cadastro-incompleto' });
          return;
        }

        const contratos = await getContratosByProfessor(professor.id);
        const ativos    = contratos.filter(c => c.status !== 'encerrado');

        const disciplinas = await Promise.all(
          ativos.map(async (contrato): Promise<DisciplinaProfessor | null> => {
            const disciplina = await getDisciplinaById(contrato.disciplina_id);
            if (!disciplina) return null;

            const emRisco = await getAlunosAbaixoLimite(disciplina.id, 75);

            return {
              contrato,
              disciplina,
              alunos_em_risco:   emRisco.length,
              manual_disponivel: !!disciplina.manual_url,
            };
          })
        );

        setState({
          professor,
          disciplinas: disciplinas.filter((d): d is DisciplinaProfessor => d !== null),
          loading:     false,
          error:       null,
        });
      } catch (err) {
        setState(s => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro ao carregar dados.',
        }));
      }
    }

    carregar();
  }, [userId]);

  return state;
}
