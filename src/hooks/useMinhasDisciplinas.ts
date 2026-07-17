import { useEffect, useState } from 'react';
import { getMinhasMatriculas } from '@/services/matriculas.service';
import { getHistoricoAluno, type DisciplinaHistorico } from '@/services/academico.service';

// Hook fino do ALUNO para Minha Frequência / Minhas Notas (Fase C1).
// MESMA fonte do Meu Histórico e dos KPIs da home (getHistoricoAluno) — os
// números batem entre as telas (LICAO-042: consolidado 065 + fallback live).
// LGPD: só dados do próprio aluno — getMinhasMatriculas/getHistoricoAluno filtram
// por alunoId e a RLS (061/062) garante que outro aluno_id retornaria vazio.
export interface DisciplinaDoAluno extends DisciplinaHistorico {
  modulo_nome: string;
  modulo_ordem: number;
}

export interface MinhasDisciplinasData {
  loading: boolean;
  temMatricula: boolean;   // matrícula vinculada a uma turma
  disciplinas: DisciplinaDoAluno[];
}

export function useMinhasDisciplinas(alunoId: string): MinhasDisciplinasData {
  const [state, setState] = useState<MinhasDisciplinasData>({
    loading: true, temMatricula: false, disciplinas: [],
  });

  useEffect(() => {
    if (!alunoId) return;
    let vivo = true;

    (async () => {
      const mats = await getMinhasMatriculas(alunoId);
      const mat = mats.find(m => m.turma_id) ?? null;
      if (!mat?.turma_id) {
        if (vivo) setState({ loading: false, temMatricula: false, disciplinas: [] });
        return;
      }

      const hist = await getHistoricoAluno(alunoId, mat.turma_id);
      if (!vivo) return;

      const disciplinas: DisciplinaDoAluno[] = hist.modulos
        .flatMap(m => m.disciplinas.map(d => ({
          ...d, modulo_nome: m.nome, modulo_ordem: m.ordem,
        })))
        .sort((a, b) => a.modulo_ordem - b.modulo_ordem || a.nome.localeCompare(b.nome));

      setState({ loading: false, temMatricula: true, disciplinas });
    })();

    return () => { vivo = false; };
  }, [alunoId]);

  return state;
}
