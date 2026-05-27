import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { FileText, CheckCircle2, Clock, Printer, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getProfessorByUserId, getContratosByProfessor } from '@/services/professor.service';
import type { ContratoProfessor } from '@/services/professor.service';
import { getDisciplinaById } from '@/services/academico.service';
import type { Disciplina } from '@/services/academico.service';
import type { DashboardContext } from '../Dashboard';

interface ContratoComDisciplina {
  contrato: ContratoProfessor;
  disciplina: Disciplina | null;
}

const statusConfig: Record<ContratoProfessor['status'], { label: string; color: string; icon: React.ElementType }> = {
  pendente:    { label: 'Pendente',    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Clock },
  preenchido:  { label: 'Preenchido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',       icon: CheckCircle2 },
  impresso:    { label: 'Impresso',   color: 'bg-green-500/20 text-green-400 border-green-500/30',    icon: Printer },
  assinado:    { label: 'Assinado',   color: 'bg-primary/20 text-primary border-primary/30',          icon: CheckCircle2 },
  encerrado:   { label: 'Encerrado',  color: 'bg-muted text-muted-foreground border-border',          icon: FileText },
};

export default function MeusContratos() {
  const { profile } = useOutletContext<DashboardContext>();
  const navigate = useNavigate();

  const [itens, setItens] = useState<ContratoComDisciplina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      setError(null);

      const prof = await getProfessorByUserId(profile.id);
      if (!prof) {
        setError('Perfil de professor não encontrado. Entre em contato com a secretaria.');
        setLoading(false);
        return;
      }

      const contratos = await getContratosByProfessor(prof.id);

      // Busca disciplinas em paralelo
      const comDisciplinas = await Promise.all(
        contratos.map(async (contrato) => ({
          contrato,
          disciplina: contrato.disciplina_id
            ? await getDisciplinaById(contrato.disciplina_id)
            : null,
        }))
      );

      setItens(comDisciplinas);
      setLoading(false);
    }
    carregar();
  }, [profile.id]);

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-40" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-destructive opacity-60" />
        <p className="text-muted-foreground text-sm text-center">{error}</p>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meus Contratos</h1>
        <p className="text-muted-foreground mt-1">
          {itens.length === 0
            ? 'Nenhum contrato encontrado'
            : `${itens.length} contrato${itens.length !== 1 ? 's' : ''} encontrado${itens.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {itens.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhum contrato disponível</p>
          <p className="text-sm mt-1">Contratos são gerados pela secretaria ao vincular disciplinas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {itens.map(({ contrato, disciplina }) => {
            const sc = statusConfig[contrato.status];
            const StatusIcon = sc.icon;
            return (
              <button
                key={contrato.id}
                onClick={() => navigate(`/dashboard/professor/contrato/${contrato.id}`)}
                className="w-full text-left bg-card border border-border rounded-xl p-4 hover:border-primary/40 hover:bg-muted/10 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {disciplina ? (
                        <>
                          <p className="text-xs font-mono text-primary font-semibold">{disciplina.codigo}</p>
                          <p className="font-semibold text-foreground text-sm">{disciplina.nome}</p>
                        </>
                      ) : (
                        <p className="font-semibold text-foreground text-sm">Disciplina #{contrato.disciplina_id.slice(0, 8)}</p>
                      )}
                      {contrato.preenchido_em && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Preenchido em {new Date(contrato.preenchido_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                      {!contrato.preenchido_em && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Criado em {new Date(contrato.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${sc.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {sc.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
