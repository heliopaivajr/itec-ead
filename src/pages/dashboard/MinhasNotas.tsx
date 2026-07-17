import { useOutletContext } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMinhasDisciplinas } from '@/hooks/useMinhasDisciplinas';
import type { DashboardContext } from '../Dashboard';
import type { StatusHistorico } from '@/services/academico.service';

// Minhas Notas (Fase C1) — o aluno vê as PRÓPRIAS notas por disciplina.
// Fonte: useMinhasDisciplinas (getHistoricoAluno = consolidado 065 + notas live
// 062) — mesmos números do Meu Histórico. RLS garante só os dados do aluno.

const STATUS_BADGE: Record<StatusHistorico, { label: string; cls: string }> = {
  aprovado_direto: { label: 'Aprovado',    cls: 'bg-green-500/20 text-green-400' },
  recuperacao:     { label: 'Recuperação', cls: 'bg-amber-500/20 text-amber-400' },
  reprovado_nota:  { label: 'Reprovado',   cls: 'bg-red-500/20 text-red-400' },
  reprovado_falta: { label: 'Rep. Falta',  cls: 'bg-red-500/20 text-red-400' },
  convalidado:     { label: 'Convalidado', cls: 'bg-blue-500/20 text-blue-400' },
  em_andamento:    { label: 'Cursando',    cls: 'bg-muted text-muted-foreground' },
  pendente:        { label: 'Cursando',    cls: 'bg-muted text-muted-foreground' },
};

const fmt = (n: number | null) => (n !== null ? n.toFixed(1) : '—');

export default function MinhasNotas() {
  const { profile } = useOutletContext<DashboardContext>();
  const { loading, temMatricula, disciplinas } = useMinhasDisciplinas(profile.id);

  // "Tem nota" = alguma nota lançada OU resultado consolidado
  const comNota = disciplinas.filter(
    d => d.notas.n1 !== null || d.notas.n2 !== null || d.notas.media_final !== null
  );
  const temRecuperacao = comNota.some(d => d.notas.recuperacao !== null);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">
          Minhas Notas
        </h1>
        <p className="text-muted-foreground mt-1">
          Suas notas por disciplina — média mínima 7,0 e frequência 75% para aprovação.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : !temMatricula ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Matrícula ainda não vinculada a uma turma</p>
          <p className="text-sm mt-1">Fale com a secretaria para concluir sua matrícula.</p>
        </div>
      ) : comNota.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <Star className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma nota lançada ainda</p>
          <p className="text-sm mt-1">Assim que seus professores lançarem as avaliações, elas aparecem aqui.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold">Disciplina</th>
                  <th className="text-center p-3 font-semibold w-16">N1</th>
                  <th className="text-center p-3 font-semibold w-16">N2</th>
                  {temRecuperacao && <th className="text-center p-3 font-semibold w-16">Rec.</th>}
                  <th className="text-center p-3 font-semibold w-20">Média</th>
                  <th className="text-center p-3 font-semibold w-28">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {comNota.map(d => {
                  const badge = STATUS_BADGE[d.status] ?? STATUS_BADGE.pendente;
                  return (
                    <tr key={d.id} className="hover:bg-muted/10">
                      <td className="p-3">
                        <p className="text-[11px] text-[#BF9000] font-semibold">{d.modulo_nome}</p>
                        <p className="font-medium text-foreground">{d.nome}</p>
                      </td>
                      <td className="text-center p-3 tabular-nums">{fmt(d.notas.n1)}</td>
                      <td className="text-center p-3 tabular-nums">{fmt(d.notas.n2)}</td>
                      {temRecuperacao && (
                        <td className="text-center p-3 tabular-nums">{fmt(d.notas.recuperacao)}</td>
                      )}
                      <td className="text-center p-3">
                        <span className={`font-bold tabular-nums ${
                          d.notas.media_final === null ? 'text-muted-foreground'
                          : d.notas.media_final >= 7 ? 'text-green-400'
                          : d.notas.media_final >= 5 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {fmt(d.notas.media_final)}
                        </span>
                      </td>
                      <td className="text-center p-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {disciplinas.length > comNota.length && (
            <p className="px-4 py-2.5 border-t border-border text-xs text-muted-foreground">
              {disciplinas.length - comNota.length} disciplina(s) do curso ainda sem nota lançada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
