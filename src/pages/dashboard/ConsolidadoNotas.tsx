import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getDisciplinaById } from '@/services/academico.service';
import { getConsolidadoTurma, type ConsolidadoAluno } from '@/services/notas.service';
import type { Disciplina } from '@/services/academico.service';

type Filtro = 'todos' | 'aprovado' | 'recuperacao' | 'reprovado';

const STATUS_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado_nota: 'Rep. Nota',
  reprovado_falta: 'Rep. Falta',
  cursando: 'Em curso',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'aprovado')   return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (status === 'recuperacao') return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
  if (status === 'cursando')   return <Clock className="h-4 w-4 text-muted-foreground" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
}

export default function ConsolidadoNotas() {
  const { turmaId, disciplinaId } = useParams<{ turmaId: string; disciplinaId: string }>();
  const navigate = useNavigate();

  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [alunos, setAlunos]         = useState<ConsolidadoAluno[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState<Filtro>('todos');

  useEffect(() => {
    async function carregar() {
      if (!disciplinaId || !turmaId) return;
      setLoading(true);
      const [disc, cons] = await Promise.all([
        getDisciplinaById(disciplinaId),
        getConsolidadoTurma(turmaId, disciplinaId),
      ]);
      setDisciplina(disc);
      setAlunos(cons.sort((a, b) => (a.nome).localeCompare(b.nome)));
      setLoading(false);
    }
    carregar();
  }, [disciplinaId, turmaId]);

  const visiveis = alunos.filter(a => {
    if (filtro === 'aprovado')    return a.status === 'aprovado';
    if (filtro === 'recuperacao') return a.status === 'recuperacao';
    if (filtro === 'reprovado')   return a.status === 'reprovado_nota' || a.status === 'reprovado_falta';
    return true;
  });

  const exportCsv = () => {
    const header = 'Nome,Freq.%,N1,N2,Média,Status\n';
    const rows   = alunos.map(a =>
      `"${a.nome}",${a.frequencia},${a.n1 ?? ''},${a.n2 ?? ''},${a.media ?? ''},"${STATUS_LABEL[a.status]}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `notas-${disciplina?.codigo ?? 'disc'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const contagem = {
    aprovados:    alunos.filter(a => a.status === 'aprovado').length,
    recuperacao:  alunos.filter(a => a.status === 'recuperacao').length,
    reprovados:   alunos.filter(a => a.status === 'reprovado_nota' || a.status === 'reprovado_falta').length,
    cursando:     alunos.filter(a => a.status === 'cursando').length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-mono text-primary">{disciplina?.codigo}</p>
          <h1 className="text-xl font-merriweather font-bold text-foreground">
            {disciplina?.nome ?? 'Notas'} — Consolidado
          </h1>
        </div>
      </div>

      {/* Badges de contagem */}
      {!loading && alunos.length > 0 && (
        <div className="flex gap-3 flex-wrap text-xs">
          <span className="px-3 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 font-semibold">
            {contagem.aprovados} aprovados
          </span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 font-semibold">
            {contagem.recuperacao} recuperação
          </span>
          <span className="px-3 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-semibold">
            {contagem.reprovados} reprovados
          </span>
          {contagem.cursando > 0 && (
            <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border font-semibold">
              {contagem.cursando} em curso
            </span>
          )}
        </div>
      )}

      {/* Filtros + export */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1">
          {(['todos', 'aprovado', 'recuperacao', 'reprovado'] as Filtro[]).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`text-xs px-3 py-1.5 rounded-md transition-colors capitalize ${
                filtro === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'reprovado' ? 'Reprovados' : f === 'recuperacao' ? 'Recuperação' : f}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Aluno</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Freq.</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">N1</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">N2</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Média</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Rec.</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1,2,3,4].map(i => (
                <tr key={i} className="border-b border-border">
                  {[1,2,3,4,5,6,7].map(j => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                  ))}
                </tr>
              ))
            ) : visiveis.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              visiveis.map((a, i) => (
                <tr key={a.aluno_id} className={`border-b border-border last:border-0 hover:bg-muted/10 ${i%2===0?'':'bg-muted/5'}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{a.nome}</td>
                  <td className={`px-4 py-3 text-center text-xs font-semibold ${a.frequencia >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                    {a.frequencia}%
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                    {a.n1 !== null ? a.n1.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                    {a.n2 !== null ? a.n2.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-xs font-bold text-foreground">
                    {a.media !== null ? a.media.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                    {a.recuperacao !== null ? a.recuperacao.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1.5 text-xs">
                      <StatusIcon status={a.status} />
                      {STATUS_LABEL[a.status]}
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
