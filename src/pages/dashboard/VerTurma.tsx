import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisciplinaById } from '@/services/academico.service';
import { getFrequenciaByDisciplina, getResumoFrequencia } from '@/services/frequencia.service';
import type { Disciplina } from '@/services/academico.service';

type Filtro = 'todos' | 'risco' | 'ok';

interface AlunoTurma {
  aluno_id: string;
  nome: string;
  percentual: number;
  total_aulas: number;
  presencas: number;
  status: 'ok' | 'alerta' | 'reprovado';
}

export default function VerTurma() {
  const { disciplinaId } = useParams<{ disciplinaId: string }>();
  const navigate = useNavigate();

  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [alunos, setAlunos]         = useState<AlunoTurma[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState<Filtro>('todos');

  useEffect(() => {
    async function carregar() {
      if (!disciplinaId) return;
      setLoading(true);

      const [disc, registros] = await Promise.all([
        getDisciplinaById(disciplinaId),
        getFrequenciaByDisciplina(disciplinaId),
      ]);

      setDisciplina(disc);

      const alunosUnicos = [...new Set(registros.map(r => r.aluno_id))];
      const rows: AlunoTurma[] = await Promise.all(
        alunosUnicos.map(async (alunoId): Promise<AlunoTurma> => {
          const resumo = await getResumoFrequencia(alunoId, disciplinaId);
          return {
            aluno_id:    alunoId,
            nome:        alunoId, // nome real via join futuro
            percentual:  resumo.percentual_presenca,
            total_aulas: resumo.total_aulas,
            presencas:   resumo.presencas,
            status:      resumo.status,
          };
        })
      );

      setAlunos(rows.sort((a, b) => a.percentual - b.percentual));
      setLoading(false);
    }
    carregar();
  }, [disciplinaId]);

  const exportCsv = () => {
    const header = 'Aluno ID,Freq.%,Total Aulas,Presenças,Status\n';
    const rows   = alunos.map(a =>
      `"${a.aluno_id}",${a.percentual},${a.total_aulas},${a.presencas},"${a.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `turma-${disciplina?.codigo ?? 'disc'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visiveis = alunos.filter(a => {
    if (filtro === 'risco') return a.percentual < 75;
    if (filtro === 'ok')    return a.percentual >= 75;
    return true;
  });

  const statusIcon = (s: AlunoTurma['status']) => {
    if (s === 'ok')       return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    if (s === 'alerta')   return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
    return                        <XCircle className="h-4 w-4 text-red-400" />;
  };

  const statusLabel = (s: AlunoTurma['status']) => ({
    ok: 'Ok', alerta: 'Alerta', reprovado: 'Risco',
  }[s]);

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/professor')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-mono text-primary">{disciplina?.codigo}</p>
          <h1 className="text-xl font-merriweather font-bold text-foreground">
            {disciplina?.nome ?? 'Turma'} — Frequência
          </h1>
        </div>
      </div>

      {/* Filtros + export */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1">
          {(['todos','risco','ok'] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors capitalize ${
                filtro === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'risco' ? 'Em risco' : f}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={loading || alunos.length === 0}
          className="border-border text-muted-foreground">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/20 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Freq.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presenças</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4].map(i => (
                <tr key={i} className="border-b border-border">
                  <td className="px-4 py-3"><Skeleton className="h-4 w-40" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-14" /></td>
                </tr>
              ))
            ) : visiveis.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              visiveis.map((a, i) => (
                <tr key={a.aluno_id} className={`border-b border-border last:border-0 hover:bg-muted/10 ${i%2===0?'':'bg-muted/5'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{a.nome}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${
                      a.percentual >= 75 ? 'text-green-400' :
                      a.percentual >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>{a.percentual}%</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {a.presencas}/{a.total_aulas}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-xs">
                      {statusIcon(a.status)}
                      {statusLabel(a.status)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
