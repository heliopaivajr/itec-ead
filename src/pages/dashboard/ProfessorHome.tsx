import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, AlertTriangle, CheckCircle2,
  FileText, ClipboardList, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import type { DashboardContext } from '../Dashboard';

export default function ProfessorHome() {
  const { profile } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();
  const { professor, disciplinas, loading, error } = useProfessorDisciplinas(profile.id);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-52 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  const nome = professor?.nome_completo ?? profile.full_name ?? 'Professor';
  const totalEmRisco = disciplinas.reduce((s, d) => s + d.alunos_em_risco, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">
          Olá, Prof. {nome.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''} ativa{disciplinas.length !== 1 ? 's' : ''}
          {totalEmRisco > 0 && ` · ${totalEmRisco} aluno${totalEmRisco > 1 ? 's' : ''} em risco de frequência`}
        </p>
      </div>

      {/* Sem disciplinas */}
      {disciplinas.length === 0 && (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma disciplina ativa</p>
          <p className="text-sm mt-1">Seu vínculo com disciplinas é gerenciado pela secretaria.</p>
        </div>
      )}

      {/* Cards por disciplina */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {disciplinas.map(({ contrato, disciplina, alunos_em_risco, manual_disponivel }) => (
          <div key={contrato.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all">
            {/* Header */}
            <div className="bg-primary/5 border-b border-border p-4">
              <p className="text-xs font-mono text-primary font-semibold">{disciplina.codigo}</p>
              <h3 className="font-semibold text-foreground text-sm mt-0.5">{disciplina.nome}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {disciplina.carga_horaria_presencial + disciplina.carga_horaria_ead}h total
                </span>
                {alunos_em_risco > 0 ? (
                  <span className="flex items-center gap-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    {alunos_em_risco} em risco
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Turma ok
                  </span>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="p-4 space-y-2">
              <Button
                size="sm"
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => navigate(`/dashboard/professor/frequencia/${disciplina.id}`)}
              >
                <ClipboardList className="h-4 w-4 mr-2" /> Lançar Frequência
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground/70 hover:text-primary"
                  onClick={() => navigate(`/dashboard/professor/turma/${disciplina.id}`)}
                >
                  <Users className="h-4 w-4 mr-1.5" /> Ver Turma
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-border text-foreground/70 hover:text-primary"
                  onClick={() => navigate(`/dashboard/professor/contrato/${contrato.id}`)}
                  disabled={!manual_disponivel && contrato.status === 'pendente'}
                >
                  <FileText className="h-4 w-4 mr-1.5" />
                  {manual_disponivel ? 'Manual ✓' : 'Contrato'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
