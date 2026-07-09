import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Users, ChevronDown, ChevronRight, AlertTriangle, RefreshCw, Loader2, GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import { getAlunosOperacional, type AlunoOperacional } from '@/services/professor.service';
import StatusDisciplinaBadge from '@/components/dashboard/StatusDisciplinaBadge';
import type { StatusDisciplina } from '@/services/matricula-academica.service';
import type { DashboardContext } from '../Dashboard';

// "Meus Alunos" — professor vê os alunos matriculados de cada disciplina do SEU
// contrato ativo (roster via get_alunos_operacional / 057). Só campos operacionais
// (nome/foto + nota/faltas/freq/status) — sem PII sensível (LGPD-01 fase 1).
type RosterState = { loading: boolean; alunos: AlunoOperacional[]; error: string | null };

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
}

export default function MeusAlunos() {
  const { profile } = useOutletContext<DashboardContext>();
  const { disciplinas, loading, error } = useProfessorDisciplinas(profile.id);

  const [aberta, setAberta] = useState<string | null>(null);
  const [rosters, setRosters] = useState<Record<string, RosterState>>({});

  const toggle = async (disciplinaId: string) => {
    if (aberta === disciplinaId) { setAberta(null); return; }
    setAberta(disciplinaId);
    // Carrega só na primeira expansão (cache por disciplina).
    if (!rosters[disciplinaId]) {
      setRosters(prev => ({ ...prev, [disciplinaId]: { loading: true, alunos: [], error: null } }));
      const alunos = await getAlunosOperacional(disciplinaId);
      setRosters(prev => ({ ...prev, [disciplinaId]: { loading: false, alunos, error: null } }));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-56 mb-2" />
        {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">
          {error === 'cadastro-incompleto'
            ? 'Seu perfil de professor ainda não foi criado pela secretaria.'
            : error}
        </p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">Meus Alunos</h1>
        <p className="text-muted-foreground mt-1">
          Alunos matriculados nas suas disciplinas. Toque numa disciplina para ver a lista.
        </p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma disciplina ativa</p>
          <p className="text-sm mt-1">Solicite um vínculo de disciplina na página inicial do professor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplinas.map(({ contrato, disciplina }) => {
            const roster = rosters[disciplina.id];
            const isOpen = aberta === disciplina.id;
            return (
              <div key={contrato.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Cabeçalho da disciplina (clicável) */}
                <button
                  onClick={() => toggle(disciplina.id)}
                  className="w-full flex items-center justify-between gap-3 p-4 hover:bg-muted/10 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-[#BF9000] font-semibold">{disciplina.codigo}</p>
                    <h3 className="font-semibold text-foreground text-sm mt-0.5 truncate">{disciplina.nome}</h3>
                  </div>
                  <span className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    {roster && !roster.loading && (
                      <span className="text-xs flex items-center gap-1">
                        <GraduationCap className="h-3.5 w-3.5" />
                        {roster.alunos.length}
                      </span>
                    )}
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>

                {/* Lista de alunos */}
                {isOpen && (
                  <div className="border-t border-border">
                    {roster?.loading ? (
                      <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando alunos...
                      </div>
                    ) : !roster || roster.alunos.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-6 text-center px-4">
                        Nenhum aluno matriculado nesta disciplina ainda.
                      </p>
                    ) : (
                      <ul className="divide-y divide-border/50">
                        {roster.alunos.map(a => (
                          <li key={a.aluno_id} className="flex items-center gap-3 px-4 py-3">
                            {/* Avatar */}
                            {a.avatar_url ? (
                              <img src={a.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
                            ) : (
                              <span className="h-9 w-9 rounded-full bg-[#1F3864]/10 text-[#1F3864] dark:bg-primary/15 dark:text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                {iniciais(a.full_name)}
                              </span>
                            )}
                            {/* Nome + status */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{a.full_name}</p>
                              <div className="mt-0.5">
                                <StatusDisciplinaBadge status={a.status_disciplina as StatusDisciplina} />
                              </div>
                            </div>
                            {/* Métricas acadêmicas (quando houver) */}
                            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                              {a.nota !== null && (
                                <span title="Nota final">
                                  Nota <strong className={a.nota >= 7 ? 'text-green-400' : 'text-red-400'}>{a.nota.toFixed(1)}</strong>
                                </span>
                              )}
                              {a.frequencia_percentual !== null && (
                                <span title="Frequência">
                                  Freq <strong className={a.frequencia_percentual >= 75 ? 'text-green-400' : 'text-red-400'}>{Math.round(a.frequencia_percentual)}%</strong>
                                </span>
                              )}
                              {a.faltas !== null && a.faltas > 0 && (
                                <span title="Faltas">{a.faltas} falta{a.faltas > 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
