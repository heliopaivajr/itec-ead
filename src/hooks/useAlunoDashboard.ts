import { useEffect, useState } from 'react';
import { getMinhasMatriculas } from '@/services/matriculas.service';
import { getHistoricoAluno, getCursoAtivo, type HistoricoAluno } from '@/services/academico.service';

// Hook fino: compõe as MESMAS fontes do Meu Histórico (R2.3) para que os
// números do dashboard do aluno batam com a tela de histórico.
// Não duplica getHistoricoAluno — apenas deriva agregados para os KPIs.
export interface AlunoDashboardData {
  loading: boolean;
  temMatricula: boolean;      // tem matrícula com turma
  temDados: boolean;          // histórico com disciplinas lançadas
  cursoNome: string | null;
  moduloAtual: string | null; // matricula.modulo_atual (texto livre)
  numeroMatricula: string | null;
  cursosAtivos: number;       // matrículas com status 'ativa'
  freqMedia: number | null;   // média das frequências das disciplinas lançadas
  mediaGeral: number | null;  // historico.media_geral
  creditosAprov: number;
  creditosTotal: number;
  pctProgresso: number;
}

const VAZIO: AlunoDashboardData = {
  loading: false,
  temMatricula: false,
  temDados: false,
  cursoNome: null,
  moduloAtual: null,
  numeroMatricula: null,
  cursosAtivos: 0,
  freqMedia: null,
  mediaGeral: null,
  creditosAprov: 0,
  creditosTotal: 185,
  pctProgresso: 0,
};

// Frequência média = média das frequências das disciplinas efetivamente
// lançadas (status_disciplina presente). Sem lançamento → null (não inventa).
function calcFreqMedia(hist: HistoricoAluno): number | null {
  const lancadas = hist.modulos
    .flatMap(m => m.disciplinas)
    .filter(d => d.status_disciplina != null);
  if (lancadas.length === 0) return null;
  const soma = lancadas.reduce((acc, d) => acc + (d.frequencia?.percentual ?? 0), 0);
  return Math.round(soma / lancadas.length);
}

export function useAlunoDashboard(alunoId: string): AlunoDashboardData {
  const [state, setState] = useState<AlunoDashboardData>({ ...VAZIO, loading: true });

  useEffect(() => {
    if (!alunoId) return;
    let vivo = true;

    (async () => {
      const [mats, cursoAtivo] = await Promise.all([getMinhasMatriculas(alunoId), getCursoAtivo()]);
      const mat = mats.find(m => m.turma_id) ?? mats[0] ?? null;
      const hist = mat?.turma_id ? await getHistoricoAluno(alunoId, mat.turma_id) : null;
      if (!vivo) return;

      const creditosTotal = cursoAtivo?.creditos_total ?? 185;
      const creditosAprov = hist?.creditos_aprovados ?? 0;
      const pct = creditosTotal > 0 ? Math.min(Math.round((creditosAprov / creditosTotal) * 100), 100) : 0;
      const temDados = !!hist && hist.modulos.length > 0;

      setState({
        loading: false,
        temMatricula: !!mat?.turma_id,
        temDados,
        cursoNome: cursoAtivo?.nome ?? null,
        moduloAtual: mat?.modulo_atual ?? null,
        numeroMatricula: mat?.numero_matricula ?? null,
        cursosAtivos: mats.filter(m => m.status === 'ativa').length,
        freqMedia: hist ? calcFreqMedia(hist) : null,
        mediaGeral: hist?.media_geral ?? null,
        creditosAprov,
        creditosTotal,
        pctProgresso: pct,
      });
    })();

    return () => { vivo = false; };
  }, [alunoId]);

  return state;
}
