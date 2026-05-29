import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getDisciplinaById } from '@/services/academico.service';
import { getProfessorByUserId } from '@/services/professor.service';
import {
  getAvaliacoesByDisciplina,
  createAvaliacao,
  getConsolidadoTurma,
  lancarNota,
  calcularStatus,
  type TipoAvaliacao,
  type ConsolidadoAluno,
  type Avaliacao,
} from '@/services/notas.service';
import type { Disciplina } from '@/services/academico.service';
import type { DashboardContext } from '../Dashboard';

const TIPOS: TipoAvaliacao[] = ['N1', 'N2', 'recuperacao'];
const LABEL: Record<TipoAvaliacao, string> = { N1: 'Nota 1', N2: 'Nota 2', recuperacao: 'Recuperação', trabalho: 'Trabalho', extra: 'Extra' };

const STATUS_LABEL: Record<string, string> = {
  aprovado: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado_nota: 'Rep. Nota',
  reprovado_falta: 'Rep. Falta',
  cursando: '—',
};

const STATUS_COLOR: Record<string, string> = {
  aprovado: 'text-green-400',
  recuperacao: 'text-yellow-400',
  reprovado_nota: 'text-red-400',
  reprovado_falta: 'text-red-400',
  cursando: 'text-muted-foreground',
};

interface NotaInput {
  aluno_id: string;
  nota: string; // string para edição livre no input
}

export default function LancarNotas() {
  const { turmaId, disciplinaId } = useParams<{ turmaId: string; disciplinaId: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [disciplina, setDisciplina]       = useState<Disciplina | null>(null);
  const [avaliacoes, setAvaliacoes]       = useState<Avaliacao[]>([]);
  const [tipoAtivo, setTipoAtivo]         = useState<TipoAvaliacao>('N1');
  const [consolidado, setConsolidado]     = useState<ConsolidadoAluno[]>([]);
  const [inputs, setInputs]               = useState<Map<string, string>>(new Map());
  const [loading, setLoading]             = useState(true);
  const [salvando, setSalvando]           = useState(false);
  const [professorId, setProfessorId]     = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!disciplinaId || !turmaId) return;
      const [disc, prof] = await Promise.all([
        getDisciplinaById(disciplinaId),
        getProfessorByUserId(profile.id),
      ]);
      setDisciplina(disc);
      setProfessorId(prof?.id ?? null);
    }
    init();
  }, [disciplinaId, turmaId, profile.id]);

  const carregar = useCallback(async () => {
    if (!disciplinaId || !turmaId) return;
    setLoading(true);
    const [avs, cons] = await Promise.all([
      getAvaliacoesByDisciplina(disciplinaId, turmaId),
      getConsolidadoTurma(turmaId, disciplinaId),
    ]);
    setAvaliacoes(avs);
    setConsolidado(cons);

    // pré-preenche os inputs com notas já lançadas
    const av = avs.find(a => a.tipo === tipoAtivo);
    const novaMap = new Map<string, string>();
    if (av) {
      for (const c of cons) {
        const nota = tipoAtivo === 'N1' ? c.n1
          : tipoAtivo === 'N2' ? c.n2
          : c.recuperacao;
        novaMap.set(c.aluno_id, nota !== null ? String(nota) : '');
      }
    }
    setInputs(novaMap);
    setLoading(false);
  }, [disciplinaId, turmaId, tipoAtivo]);

  useEffect(() => { carregar(); }, [carregar]);

  const avaliacaoAtiva = avaliacoes.find(a => a.tipo === tipoAtivo);

  const setNota = (alunoId: string, valor: string) => {
    setInputs(prev => new Map(prev).set(alunoId, valor));
  };

  const salvar = async () => {
    if (!disciplinaId || !turmaId || !profile.id) return;
    setSalvando(true);

    // Garante avaliação criada
    let av = avaliacaoAtiva;
    if (!av) {
      const { data, error } = await createAvaliacao(disciplinaId, turmaId, tipoAtivo, profile.id);
      if (error || !data) {
        toast({ title: 'Erro ao criar avaliação', description: error ?? '', variant: 'destructive' });
        setSalvando(false);
        return;
      }
      av = data;
    }

    const erros: string[] = [];
    for (const [alunoId, valorStr] of inputs) {
      if (valorStr === '' || valorStr === undefined) continue;
      const nota = parseFloat(valorStr);
      if (isNaN(nota) || nota < 0 || nota > 10) { erros.push(alunoId); continue; }
      const { error } = await lancarNota(av.id, alunoId, disciplinaId, turmaId, nota, profile.id);
      if (error) erros.push(alunoId);
    }

    setSalvando(false);
    if (erros.length > 0) {
      toast({ title: `${erros.length} erro(s) ao salvar`, variant: 'destructive' });
    } else {
      toast({ title: 'Notas salvas com sucesso!' });
      carregar();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-mono text-primary">{disciplina?.codigo}</p>
          <h1 className="text-xl font-merriweather font-bold text-foreground">
            {disciplina?.nome ?? 'Lançar Notas'}
          </h1>
        </div>
      </div>

      {/* Selector de tipo de avaliação */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-lg p-1 w-fit">
        {TIPOS.map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoAtivo(tipo)}
            className={`text-xs px-4 py-1.5 rounded-md transition-colors ${
              tipoAtivo === tipo
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {LABEL[tipo]}
          </button>
        ))}
      </div>

      {/* Tabela de notas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{LABEL[tipoAtivo]}</p>
          <p className="text-xs text-muted-foreground">{consolidado.length} alunos</p>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : consolidado.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Nenhum aluno encontrado para esta turma/disciplina.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/10 border-b border-border">
                <th className="text-left px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Aluno</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Freq.</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">N1</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">N2</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Média</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">{LABEL[tipoAtivo]}</th>
                <th className="text-center px-4 py-2 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {consolidado.map(aluno => {
                const notaInput = inputs.get(aluno.aluno_id) ?? '';
                const notaNum = notaInput !== '' ? parseFloat(notaInput) : null;
                const mediaPreview = tipoAtivo === 'N1'
                  ? (aluno.n2 !== null && notaNum !== null ? (notaNum + aluno.n2) / 2 : null)
                  : tipoAtivo === 'N2'
                  ? (aluno.n1 !== null && notaNum !== null ? (aluno.n1 + notaNum) / 2 : null)
                  : aluno.media;
                const statusPreview = calcularStatus(mediaPreview ?? aluno.media, aluno.frequencia);

                return (
                  <tr key={aluno.aluno_id} className="border-b border-border last:border-0 hover:bg-muted/10">
                    <td className="px-4 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {aluno.nome}
                        {aluno.frequencia < 75 && (
                          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500 shrink-0" title="Frequência abaixo de 75%" />
                        )}
                      </div>
                    </td>
                    <td className={`px-4 py-2 text-center text-xs font-semibold ${aluno.frequencia >= 75 ? 'text-green-400' : 'text-red-400'}`}>
                      {aluno.frequencia}%
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground text-xs">
                      {aluno.n1 !== null ? aluno.n1.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-muted-foreground text-xs">
                      {aluno.n2 !== null ? aluno.n2.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center text-xs font-semibold text-foreground">
                      {(mediaPreview ?? aluno.media) !== null
                        ? (mediaPreview ?? aluno.media)!.toFixed(1)
                        : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={notaInput}
                        onChange={e => setNota(aluno.aluno_id, e.target.value)}
                        className="w-16 bg-background border border-border rounded-md px-2 py-1 text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0–10"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`text-xs font-semibold ${STATUS_COLOR[statusPreview]}`}>
                        {STATUS_LABEL[statusPreview]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!loading && consolidado.length > 0 && (
          <div className="px-4 py-3 border-t border-border bg-muted/10 flex justify-end">
            <Button size="sm" onClick={salvar} disabled={salvando}
              className="bg-primary text-primary-foreground hover:bg-primary/80">
              {salvando
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
                : <><Save className="h-4 w-4 mr-2" /> Salvar {LABEL[tipoAtivo]}</>
              }
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
