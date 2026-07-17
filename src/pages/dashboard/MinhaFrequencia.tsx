import { useOutletContext } from 'react-router-dom';
import { CalendarCheck, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasDisciplinas } from '@/hooks/useMinhasDisciplinas';
import type { DashboardContext } from '../Dashboard';

// Minha Frequência (Fase C1) — o aluno vê a PRÓPRIA presença por disciplina.
// Fonte: useMinhasDisciplinas (getHistoricoAluno = consolidado 065 + live 061) —
// mesmos números do Meu Histórico. RLS garante só os dados do próprio aluno.

// Régua visual de presença (mesma do resto do sistema: ok ≥75 · alerta 60–74).
function statusFreq(pct: number): { label: string; cls: string } {
  if (pct >= 75) return { label: 'Em dia',   cls: 'bg-green-500/20 text-green-400' };
  if (pct >= 60) return { label: 'Atenção',  cls: 'bg-amber-500/20 text-amber-400' };
  return             { label: 'Em risco',  cls: 'bg-red-500/20 text-red-400' };
}

export default function MinhaFrequencia() {
  const { profile } = useOutletContext<DashboardContext>();
  const { loading, temMatricula, disciplinas } = useMinhasDisciplinas(profile.id);

  // "Tem chamada" = frequência live OU consolidado da matrícula
  const comDado = disciplinas.filter(d => d.frequencia.total_aulas > 0 || d.consolidado);

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">
          Minha Frequência
        </h1>
        <p className="text-muted-foreground mt-1">
          Sua presença por disciplina — mínimo de 75% para aprovação.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : !temMatricula ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Matrícula ainda não vinculada a uma turma</p>
          <p className="text-sm mt-1">Fale com a secretaria para concluir sua matrícula.</p>
        </div>
      ) : comDado.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma chamada lançada ainda</p>
          <p className="text-sm mt-1">Assim que seus professores lançarem a presença, ela aparece aqui.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comDado.map(d => {
            const st = statusFreq(d.frequencia.percentual);
            const faltas = d.frequencia.total_aulas - d.frequencia.presencas;
            return (
              <div key={d.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-[#BF9000] font-semibold">{d.modulo_nome}</p>
                    <h3 className="font-semibold text-foreground text-sm mt-0.5 truncate">{d.nome}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.frequencia.total_aulas > 0
                        ? `${d.frequencia.presencas} presença${d.frequencia.presencas !== 1 ? 's' : ''} · ${faltas} falta${faltas !== 1 ? 's' : ''} · ${d.frequencia.total_aulas} aula${d.frequencia.total_aulas !== 1 ? 's' : ''}`
                        : 'Consolidado da matrícula'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-bold tabular-nums text-foreground">{d.frequencia.percentual}%</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${st.cls}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
                {/* Barra de presença */}
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${d.frequencia.percentual >= 75 ? 'bg-green-500' : d.frequencia.percentual >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(d.frequencia.percentual, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}

          {/* Disciplinas ainda sem chamada */}
          {disciplinas.length > comDado.length && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
              <BookOpen className="h-3.5 w-3.5" />
              {disciplinas.length - comDado.length} disciplina(s) do curso ainda sem chamada lançada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
