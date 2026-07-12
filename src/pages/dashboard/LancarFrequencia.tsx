import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, CheckSquare, Square, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDisciplinaById } from '@/services/academico.service';
import {
  getFrequenciaByDisciplina,
  lancarFrequencia,
  calcularResumosPorAluno,
  type RegistroFrequencia,
} from '@/services/frequencia.service';
import { getProfessorByUserId, getAlunosOperacional } from '@/services/professor.service';
import type { Disciplina } from '@/services/academico.service';
import type { DashboardContext } from '../Dashboard';

interface AlunoRow {
  aluno_id: string;
  nome: string;
  presente: boolean;
  percentual_atual: number;
}

export default function LancarFrequencia() {
  const { disciplinaId } = useParams<{ disciplinaId: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const hoje = new Date().toISOString().split('T')[0];
  const [data, setData]             = useState(hoje);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [alunos, setAlunos]         = useState<AlunoRow[]>([]);
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [savedOk, setSavedOk]       = useState(false);
  const [professorId, setProfessorId] = useState<string | null>(null);

  // Carrega disciplina e professor na montagem
  useEffect(() => {
    async function init() {
      if (!disciplinaId) return;
      const [disc, prof] = await Promise.all([
        getDisciplinaById(disciplinaId),
        getProfessorByUserId(profile.id),
      ]);
      setDisciplina(disc);
      setProfessorId(prof?.id ?? null);
    }
    init();
  }, [disciplinaId, profile.id]);

  // Carrega chamada ao mudar data.
  // A lista de alunos vem do ROSTER (alunos MATRICULADOS via get_alunos_operacional/057),
  // não dos registros de frequência já existentes — assim uma turma sem chamada lançada
  // ainda mostra todos os matriculados. A frequência existente é sobreposta por aluno.
  const carregarChamada = useCallback(async () => {
    if (!disciplinaId) return;
    setLoading(true);

    const [roster, registros] = await Promise.all([
      getAlunosOperacional(disciplinaId),
      getFrequenciaByDisciplina(disciplinaId),
    ]);
    const doDia   = registros.filter(r => r.data_aula === data);
    const resumos = calcularResumosPorAluno(registros); // % ao vivo por aluno (2026)

    const rows: AlunoRow[] = roster.map((al): AlunoRow => {
      const resumo      = resumos.get(al.aluno_id);
      const registroDia = doDia.find(r => r.aluno_id === al.aluno_id);
      // % ao vivo se já há chamada; senão o consolidado da matrícula (retroativo); senão 100.
      const pct = resumo?.percentual_presenca
        ?? (al.frequencia_percentual !== null ? Math.round(al.frequencia_percentual) : 100);
      return {
        aluno_id:         al.aluno_id,
        nome:             al.full_name,
        presente:         registroDia?.presente ?? true,
        percentual_atual: pct,
      };
    });

    setAlunos(rows);
    setLoading(false);
  }, [disciplinaId, data]);

  useEffect(() => { carregarChamada(); }, [carregarChamada]);

  const toggleAluno = (alunoId: string) =>
    setAlunos(prev => prev.map(a => a.aluno_id === alunoId ? { ...a, presente: !a.presente } : a));

  const marcarTodos = () =>
    setAlunos(prev => prev.map(a => ({ ...a, presente: true })));

  const salvar = async () => {
    // professorId (professores.id) só valida que o cadastro de professor existe.
    if (!disciplinaId || !professorId) return;
    setSalvando(true);
    const registros: Omit<RegistroFrequencia, 'id' | 'registrado_em'>[] = alunos.map(a => ({
      disciplina_id: disciplinaId,
      aluno_id:      a.aluno_id,
      // FK: frequencia.professor_id → profiles(id) — vai o id do usuário logado
      // (auth.uid()), NÃO professores.id (que quebrava a FK/RLS). Único professor_id
      // do sistema que aponta para profiles; os demais (contratos, solicitações,
      // matriculas_disciplina) apontam para professores.
      professor_id:  profile.id,
      data_aula:     data,
      presente:      a.presente,
      justificada:   false,
      documento_url: null,
      observacao:    null,
    }));

    const { error } = await lancarFrequencia(registros);
    setSalvando(false);

    if (error) {
      toast({ title: 'Erro ao salvar chamada', description: error, variant: 'destructive' });
    } else {
      setSavedOk(true);
      const presentes = alunos.filter(a => a.presente).length;
      toast({
        title: 'Chamada salva!',
        description: `${presentes} presentes · ${alunos.length - presentes} faltas`,
      });
      setTimeout(() => setSavedOk(false), 3000);
    }
  };

  const presentes = alunos.filter(a => a.presente).length;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/professor')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-mono text-primary">{disciplina?.codigo}</p>
          <h1 className="text-xl font-merriweather font-bold text-foreground">
            {disciplina?.nome ?? 'Lançar Frequência'}
          </h1>
        </div>
      </div>

      {/* Seletor de data */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
        <label className="text-sm font-semibold text-foreground">Data da aula:</label>
        <input
          type="date"
          value={data}
          max={hoje}
          onChange={e => { setData(e.target.value); setSavedOk(false); }}
          className="bg-background border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {savedOk && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Chamada salva
          </span>
        )}
      </div>

      {/* Lista de alunos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">
            Chamada — {new Date(data + 'T12:00').toLocaleDateString('pt-BR')}
          </p>
          <p className="text-xs text-muted-foreground">
            {presentes}/{alunos.length} presentes
          </p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : alunos.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum aluno encontrado para esta disciplina.
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {alunos.map(aluno => (
              <div
                key={aluno.aluno_id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10 cursor-pointer transition-colors"
                onClick={() => toggleAluno(aluno.aluno_id)}
              >
                {aluno.presente
                  ? <CheckSquare className="h-5 w-5 text-primary shrink-0" />
                  : <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                }
                <span className="flex-1 text-sm text-foreground font-medium">{aluno.nome}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    aluno.percentual_atual >= 75 ? 'text-green-400' :
                    aluno.percentual_atual >= 60 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {aluno.percentual_atual}%
                  </span>
                  {aluno.percentual_atual < 75 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer com ações */}
        {!loading && alunos.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
            <Button variant="outline" size="sm" onClick={marcarTodos} className="border-border text-foreground/70">
              Marcar todos presentes
            </Button>
            <Button size="sm" onClick={salvar} disabled={salvando}
              className="bg-primary text-primary-foreground hover:bg-primary/80">
              {salvando
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
                : <><Save className="h-4 w-4 mr-2" /> Salvar Chamada</>
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
