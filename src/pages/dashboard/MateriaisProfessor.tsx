import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { BookOpen, FolderOpen, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import MateriaisDisciplinaModal from '@/components/dashboard/MateriaisDisciplinaModal';
import type { DashboardContext } from '../Dashboard';

// "Meus Materiais" — professor gerencia os materiais das disciplinas do SEU
// contrato ativo (sprint Material do Professor, fecha SEC-04 metade 2).
// Reusa o MateriaisDisciplinaModal do CursosAdmin com podeAprovar=false:
// material de professor entra auto-aprovado (MATERIAL_PROFESSOR_AUTO_APROVA),
// e o RLS (migração 056) restringe a escrita à cadeira do contrato.
export default function MateriaisProfessor() {
  const { profile } = useOutletContext<DashboardContext>();
  const { disciplinas, loading, error } = useProfessorDisciplinas(profile.id);
  const [aberta, setAberta] = useState<{ id: string; codigo: string; nome: string } | null>(null);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
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
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meus Materiais</h1>
        <p className="text-muted-foreground mt-1">
          Apostilas, slides, PDFs e links de vídeo das suas disciplinas. O material que você
          publica fica disponível imediatamente para os alunos da turma.
        </p>
      </div>

      {disciplinas.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground">
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold text-foreground">Nenhuma disciplina ativa</p>
          <p className="text-sm mt-1">
            Materiais são gerenciados por disciplina — solicite um vínculo na página inicial do professor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {disciplinas.map(({ contrato, disciplina }) => (
            <div key={contrato.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
              <p className="text-xs font-mono text-primary font-semibold">{disciplina.codigo}</p>
              <h3 className="font-semibold text-foreground text-sm mt-0.5">{disciplina.nome}</h3>
              <Button
                size="sm"
                className="w-full mt-3 bg-primary hover:bg-primary/80 text-primary-foreground"
                onClick={() => setAberta({ id: disciplina.id, codigo: disciplina.codigo, nome: disciplina.nome })}
              >
                <FolderOpen className="h-4 w-4 mr-2" /> Gerenciar materiais
              </Button>
            </div>
          ))}
        </div>
      )}

      {aberta && (
        <MateriaisDisciplinaModal
          disciplina={aberta}
          onClose={() => setAberta(null)}
          podeAprovar={false}
        />
      )}
    </div>
  );
}
