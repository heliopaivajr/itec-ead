import { useState, useEffect } from 'react';
import {
  getProfessorByUserId,
  getContratosByProfessor,
  getAlunosOperacional,
  type Professor,
  type ContratoProfessor,
} from '@/services/professor.service';
import { getDisciplinaById, getTurmaIdByDisciplina, type Disciplina } from '@/services/academico.service';
import { getAlunosAbaixoLimite } from '@/services/frequencia.service';

export interface DisciplinaProfessor {
  contrato: ContratoProfessor;
  disciplina: Disciplina;
  alunos_em_risco: number;
  manual_disponivel: boolean;
  turma_id: string | null;
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

            const [emRisco, roster] = await Promise.all([
              getAlunosAbaixoLimite(disciplina.id, 75),
              getAlunosOperacional(disciplina.id),
            ]);

            // Turma pelo ROSTER (fonte prioritária — 064): SECURITY DEFINER, o
            // professor sempre lê; não depende de grade em aulas_recorrentes nem
            // de policy de matriculas. No modelo atual todos os matriculados da
            // disciplina são da mesma turma; se vierem 2+, warn e usa a primeira
            // (multi-turma futuro usa a lista completa).
            const turmasDistintas = [...new Set(
              roster.map(r => r.turma_id).filter(Boolean)
            )] as string[];
            if (turmasDistintas.length > 1) {
              console.warn(`[useProfessorDisciplinas] disciplina ${disciplina.id} com ${turmasDistintas.length} turmas no roster — usando a primeira`);
            }
            // Fallback: disciplina SEM matriculados (roster vazio) mas COM grade
            // em aulas_recorrentes (getTurmasByDisciplina via wrapper).
            const turmaId = turmasDistintas[0]
              ?? await getTurmaIdByDisciplina(disciplina.id);

            return {
              contrato,
              disciplina,
              alunos_em_risco:   emRisco.length,
              manual_disponivel: !!disciplina.manual_url,
              turma_id:          turmaId,
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
