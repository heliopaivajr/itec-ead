import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  BookOpen, AlertTriangle, RefreshCw, ClipboardList, Star, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import type { DashboardContext } from '../Dashboard';

// Picker de disciplina para os itens de MENU do professor (Frequência / Notas),
// que não têm :disciplinaId na rota. Lista as disciplinas ativas (mesma fonte dos
// cards do ProfessorHome — useProfessorDisciplinas) e leva à tela real de cada uma.
// destino='frequencia' → professor/frequencia/:disciplinaId (LancarFrequencia)
// destino='notas'      → professor/notas/:turmaId/:disciplinaId (LancarNotas, precisa turma)
interface Props {
  destino: 'frequencia' | 'notas';
}

const META = {
  frequencia: { titulo: 'Lançar Frequência', descricao: 'Escolha a disciplina para lançar a presença da aula.', Icone: ClipboardList },
  notas:      { titulo: 'Lançar Notas',       descricao: 'Escolha a disciplina para lançar as notas da turma.',   Icone: Star },
} as const;

export default function SelecionarDisciplinaProfessor({ destino }: Props) {
  const { profile } = useOutletContext<DashboardContext>();
  const { disciplinas, loading, error } = useProfessorDisciplinas(profile.id);
  const navigate = useNavigate();
  const { titulo, descricao, Icone } = META[destino];

  const abrir = (disciplinaId: string, turmaId: string | null) => {
    if (destino === 'frequencia') {
      navigate(`/dashboard/professor/frequencia/${disciplinaId}`);
    } else if (turmaId) {
      navigate(`/dashboard/professor/notas/${turmaId}/${disciplinaId}`);
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
        <h1 className="text-2xl font-merriweather font-bold text-[#1F3864] dark:text-primary">{titulo}</h1>
        <p className="text-muted-foreground mt-1">{descricao}</p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma disciplina ativa</p>
          <p className="text-sm mt-1">Solicite um vínculo de disciplina na página inicial do professor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disciplinas.map(({ contrato, disciplina, turma_id }) => {
            const semTurma = destino === 'notas' && !turma_id;
            return (
              <button
                key={contrato.id}
                onClick={() => !semTurma && abrir(disciplina.id, turma_id)}
                disabled={semTurma}
                title={semTurma ? 'Nenhuma turma vinculada a esta disciplina' : undefined}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                  semTurma
                    ? 'bg-card border-border opacity-50 cursor-not-allowed'
                    : 'bg-card border-border hover:border-primary/40 hover:bg-muted/10'
                }`}
              >
                <Icone className="h-5 w-5 shrink-0 text-[#BF9000]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-[#BF9000] font-semibold">{disciplina.codigo}</p>
                  <h3 className="font-semibold text-foreground text-sm mt-0.5 truncate">{disciplina.nome}</h3>
                  {semTurma && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">Sem turma vinculada — não é possível lançar notas.</p>
                  )}
                </div>
                {!semTurma && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
