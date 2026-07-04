import { useEffect, useState } from 'react';
import { getProfessorByUserId, getDisciplinasAtivasProfessor } from '@/services/professor.service';
import { getResumoDisciplinasProfessor } from '@/services/matricula-academica.service';

// Hook fino: compõe as fontes já existentes para os KPIs do ProfessorView.
// Disciplinas/turmas vêm de getDisciplinasAtivasProfessor (CONTRATO_ATIVO, R3.3a);
// alunos/notas pendentes de UMA query em matriculas_disciplina (LICAO-026).
export interface ProfessorDashboardData {
  loading: boolean;
  temProfessor: boolean;    // existe registro na tabela professores para este usuário
  temDisciplinas: boolean;
  disciplinasAtivas: number;
  turmas: number;
  alunos: number;
  notasPendentes: number;
}

const VAZIO: ProfessorDashboardData = {
  loading: false,
  temProfessor: false,
  temDisciplinas: false,
  disciplinasAtivas: 0,
  turmas: 0,
  alunos: 0,
  notasPendentes: 0,
};

export function useProfessorDashboard(userId: string): ProfessorDashboardData {
  const [state, setState] = useState<ProfessorDashboardData>({ ...VAZIO, loading: true });

  useEffect(() => {
    if (!userId) return;
    let vivo = true;

    (async () => {
      const professor = await getProfessorByUserId(userId);
      if (!professor) {
        if (vivo) setState({ ...VAZIO });
        return;
      }

      const disciplinas = await getDisciplinasAtivasProfessor(professor.id);
      const discIds = [...new Set(disciplinas.map(d => d.disciplina_id))];
      const turmas  = new Set(disciplinas.map(d => d.turma_id).filter((t): t is string => !!t)).size;

      const { alunos, notasPendentes } = await getResumoDisciplinasProfessor(discIds);
      if (!vivo) return;

      setState({
        loading: false,
        temProfessor: true,
        temDisciplinas: disciplinas.length > 0,
        disciplinasAtivas: disciplinas.length,
        turmas,
        alunos,
        notasPendentes,
      });
    })();

    return () => { vivo = false; };
  }, [userId]);

  return state;
}
