import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, GraduationCap, Printer, BookOpen, Award } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { getMinhasMatriculas } from '@/services/matriculas.service';
import { getHistoricoAluno, getCursoAtivo, type HistoricoAluno, type Curso } from '@/services/academico.service';
import StatusDisciplinaBadge from '@/components/dashboard/StatusDisciplinaBadge';
import { HistoricoAlunoPDF } from '@/components/dashboard/HistoricoAlunoPDF';
import { Button } from '@/components/ui/button';
import type { DashboardContext } from '../Dashboard';

function freqCor(p: number) {
  if (p >= 75) return 'text-green-400';
  if (p >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

export default function MeuHistorico() {
  const { profile } = useOutletContext<DashboardContext>();
  const [loading, setLoading] = useState(true);
  const [historico, setHistorico] = useState<HistoricoAluno | null>(null);
  const [curso, setCurso] = useState<Curso | null>(null);
  const [numeroMatricula, setNumeroMatricula] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [mats, cursoAtivo] = await Promise.all([getMinhasMatriculas(profile.id), getCursoAtivo()]);
      const mat = mats.find(m => m.turma_id) ?? mats[0] ?? null;
      const hist = mat?.turma_id ? await getHistoricoAluno(profile.id, mat.turma_id) : null;
      if (!vivo) return;
      setCurso(cursoAtivo);
      setNumeroMatricula(mat?.numero_matricula ?? null);
      setHistorico(hist);
      setLoading(false);
    })();
    return () => { vivo = false; };
  }, [profile.id]);

  const creditosTotal = curso?.creditos_total ?? 185;
  const creditosAprov = historico?.creditos_aprovados ?? 0;
  const pct = creditosTotal > 0 ? Math.min(Math.round((creditosAprov / creditosTotal) * 100), 100) : 0;
  const creditosRestantes = Math.max(creditosTotal - creditosAprov, 0);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const temDados = historico && historico.modulos.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Meu Histórico</h1>
          <p className="text-muted-foreground mt-1">
            Seu desempenho acadêmico {numeroMatricula && <>· matrícula <span className="font-mono text-foreground">{numeroMatricula}</span></>}
          </p>
        </div>
        {temDados && (
          <PDFDownloadLink
            document={<HistoricoAlunoPDF
              aluno={{ full_name: profile.full_name ?? 'Aluno', numero_matricula: numeroMatricula }}
              curso_nome={curso?.nome ?? 'Graduação em Teologia'}
              historico={historico!}
            />}
            fileName={`historico-${(profile.full_name ?? 'aluno').replace(/\s+/g, '-').toLowerCase()}.pdf`}
          >
            {({ loading: l }) => (
              <Button disabled={l} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                {l ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
                Imprimir histórico
              </Button>
            )}
          </PDFDownloadLink>
        )}
      </div>

      {/* Card de progresso */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Progresso no curso</span>
          <span className="ml-auto text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span><strong className="text-foreground">{creditosAprov}</strong> de {creditosTotal} créditos concluídos</span>
          <span><strong className="text-foreground">{creditosRestantes}</strong> créditos restantes</span>
          <span><strong className="text-green-400">{historico?.disciplinas_aprovadas ?? 0}</strong> disciplinas aprovadas</span>
          {historico?.media_geral !== null && historico?.media_geral !== undefined && (
            <span>Média geral: <strong className="text-foreground">{historico.media_geral.toFixed(1)}</strong></span>
          )}
        </div>
      </div>

      {/* Histórico por módulo */}
      {!temDados ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium text-foreground">Seu histórico aparecerá aqui</p>
          <p className="text-xs text-muted-foreground mt-1">
            Conforme as disciplinas forem lançadas pela secretaria, suas notas e situação aparecem nesta tela.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {historico!.modulos.map(mod => (
            <div key={mod.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-primary/5">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-semibold text-foreground text-sm">{mod.ordem}º Módulo — {mod.nome}</span>
                {mod.media_modulo !== null && (
                  <span className="ml-auto text-xs text-muted-foreground">média {mod.media_modulo.toFixed(1)}</span>
                )}
              </div>
              <div className="divide-y divide-border/50">
                {mod.disciplinas.map(d => (
                  <div key={d.id} className="flex items-center gap-3 px-5 py-2.5">
                    <span className="text-sm text-foreground flex-1 truncate">{d.nome}</span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {d.notas.media_final !== null ? d.notas.media_final.toFixed(1) : '—'}
                    </span>
                    {d.status_disciplina && <StatusDisciplinaBadge status={d.status_disciplina} />}
                    <span className={`text-xs w-12 text-right ${freqCor(d.frequencia.percentual)}`}>
                      {d.frequencia.percentual}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
