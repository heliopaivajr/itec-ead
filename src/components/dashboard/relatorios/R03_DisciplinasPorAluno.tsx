import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getDisciplinasPorAlunoRelatorio } from '@/services/relatorios.service';
import { exportToExcel, exportToCSV } from './exporters/excelExporter';
import type { Turma } from '@/services/turmas.service';
import type { DisciplinasPorAlunoRelatorio } from '@/services/relatorios.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { pdf } from '@react-pdf/renderer';
import { R03_PDF } from './pdf/R03_PDF';

const STATUS_CONFIG = {
  cursando: { label: 'Cursando', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  aprovado: { label: 'Aprovado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  reprovado: { label: 'Reprovado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  reprovado_falta: { label: 'Rep. Falta', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  convalidado: { label: 'Convalidado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  trancado: { label: 'Trancado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export default function R03_DisciplinasPorAluno() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('todos');
  const [buscaAluno, setBuscaAluno] = useState<string>('');
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [dados, setDados] = useState<DisciplinasPorAlunoRelatorio[]>([]);
  const [dadosFiltrados, setDadosFiltrados] = useState<DisciplinasPorAlunoRelatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [alunosExpandidos, setAlunosExpandidos] = useState<Set<string>>(new Set());

  // Carregar turmas ao montar
  useEffect(() => {
    async function load() {
      setLoadingTurmas(true);
      const data = await getTurmasAtivas();
      setTurmas(data);
      setLoadingTurmas(false);
    }
    load();
  }, []);

  // Buscar dados ao montar ou quando filtros principais mudarem
  useEffect(() => {
    async function buscar() {
      setLoading(true);
      const resultado = await getDisciplinasPorAlunoRelatorio({
        turmaId: turmaId === 'todos' ? undefined : turmaId,
        status: statusFiltro === 'todos' ? undefined : statusFiltro as any,
      });
      setDados(resultado);
      setLoading(false);
    }
    buscar();
  }, [turmaId, statusFiltro]);

  // Filtrar por busca de aluno (client-side)
  useEffect(() => {
    if (!buscaAluno.trim()) {
      setDadosFiltrados(dados);
      return;
    }

    const termo = buscaAluno.toLowerCase();
    const filtrados = dados.filter(
      (aluno) =>
        aluno.nome_aluno.toLowerCase().includes(termo) ||
        aluno.codigo_itec?.toLowerCase().includes(termo)
    );
    setDadosFiltrados(filtrados);
  }, [dados, buscaAluno]);

  const toggleAluno = (alunoId: string) => {
    const novo = new Set(alunosExpandidos);
    if (novo.has(alunoId)) {
      novo.delete(alunoId);
    } else {
      novo.add(alunoId);
    }
    setAlunosExpandidos(novo);
  };

  const expandirTodos = () => {
    setAlunosExpandidos(new Set(dadosFiltrados.map((a) => a.aluno_id)));
  };

  const recolherTodos = () => {
    setAlunosExpandidos(new Set());
  };

  const turmaAtual = turmas.find((t) => t.id === turmaId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (dadosFiltrados.length === 0) return;
    const blob = await pdf(<R03_PDF dados={dadosFiltrados} turma={turmaAtual} statusFiltro={statusFiltro} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `R03_DisciplinasPorAluno_${dataHoje}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (dadosFiltrados.length === 0) return;

    // Transformar dados para Excel (uma linha por disciplina)
    const linhas: Record<string, any>[] = [];

    for (const aluno of dadosFiltrados) {
      for (const disc of aluno.disciplinas) {
        linhas.push({
          'Nome Aluno': aluno.nome_aluno,
          'Cód. ITEC': aluno.codigo_itec || '—',
          'Turma': `${aluno.turma.codigo} — ${aluno.turma.nome}`,
          'Código Disc.': disc.codigo,
          'Disciplina': disc.nome,
          'Situação': STATUS_CONFIG[disc.status].label,
          'Nota': disc.nota !== null ? disc.nota.toFixed(2) : '—',
        });
      }
    }

    exportToExcel(linhas, 'R03_DisciplinasPorAluno', 'Disciplinas por Aluno');
  };

  const handleExportCSV = () => {
    if (dadosFiltrados.length === 0) return;

    // Transformar dados para CSV
    const linhas: Record<string, any>[] = [];

    for (const aluno of dadosFiltrados) {
      for (const disc of aluno.disciplinas) {
        linhas.push({
          'Nome Aluno': aluno.nome_aluno,
          'Cód. ITEC': aluno.codigo_itec || '—',
          'Turma': `${aluno.turma.codigo} — ${aluno.turma.nome}`,
          'Código Disc.': disc.codigo,
          'Disciplina': disc.nome,
          'Situação': STATUS_CONFIG[disc.status].label,
          'Nota': disc.nota !== null ? disc.nota.toFixed(2) : '—',
        });
      }
    }

    exportToCSV(linhas, 'R03_DisciplinasPorAluno');
  };

  // Totalizadores
  const totalAlunos = dadosFiltrados.length;
  const totalDisciplinas = dadosFiltrados.reduce((sum, a) => sum + a.disciplinas.length, 0);

  return (
    <RelatorioLayout
      titulo="R03 — Disciplinas por Aluno"
      subtitulo={`${totalAlunos} aluno(s) · ${totalDisciplinas} disciplina(s)`}
      onPrint={handlePrint}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      onExportCSV={handleExportCSV}
      loading={loading || loadingTurmas}
      hideExport={dadosFiltrados.length === 0}
      filtros={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="turma">Turma</Label>
            {loadingTurmas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando turmas...
              </div>
            ) : (
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger id="turma">
                  <SelectValue placeholder="Todas as turmas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as turmas</SelectItem>
                  {turmas.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.codigo} — {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="buscaAluno">Buscar Aluno</Label>
            <Input
              id="buscaAluno"
              type="text"
              placeholder="Nome ou código ITEC"
              value={buscaAluno}
              onChange={(e) => setBuscaAluno(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="cursando">Cursando</SelectItem>
                <SelectItem value="aprovado">Aprovado</SelectItem>
                <SelectItem value="reprovado">Reprovado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 flex items-end">
            <div className="flex gap-2">
              <button
                onClick={expandirTodos}
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={dadosFiltrados.length === 0}
              >
                Expandir todos
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                onClick={recolherTodos}
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={dadosFiltrados.length === 0}
              >
                Recolher todos
              </button>
            </div>
          </div>
        </div>
      }
    >
      {/* Conteúdo da tabela */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : dadosFiltrados.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {buscaAluno ? 'Nenhum aluno encontrado com esse nome ou código.' : 'Nenhum dado encontrado.'}
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 w-12"></th>
                  <th className="text-left p-3">Nome / Disciplina</th>
                  <th className="text-left p-3 w-32">Turma</th>
                  <th className="text-center p-3 w-24">Cursando</th>
                  <th className="text-center p-3 w-24">Aprovadas</th>
                  <th className="text-center p-3 w-24">Reprovadas</th>
                  <th className="text-center p-3 w-28">Convalidadas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dadosFiltrados.map((aluno) => {
                  const expandido = alunosExpandidos.has(aluno.aluno_id);

                  return (
                    <React.Fragment key={aluno.aluno_id}>
                      {/* Linha header do aluno */}
                      <tr
                        className="bg-muted/30 hover:bg-muted/50 cursor-pointer font-medium"
                        onClick={() => toggleAluno(aluno.aluno_id)}
                      >
                        <td className="p-3 text-center">
                          {expandido ? (
                            <ChevronDown className="h-4 w-4 inline" />
                          ) : (
                            <ChevronRight className="h-4 w-4 inline" />
                          )}
                        </td>
                        <td className="p-3">
                          {aluno.nome_aluno}
                          {aluno.codigo_itec && (
                            <span className="ml-2 text-xs text-muted-foreground">({aluno.codigo_itec})</span>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {aluno.turma.codigo} — {aluno.turma.nome}
                        </td>
                        <td className="p-3 text-center tabular-nums">{aluno.totais.cursando}</td>
                        <td className="p-3 text-center tabular-nums">{aluno.totais.aprovadas}</td>
                        <td className="p-3 text-center tabular-nums">{aluno.totais.reprovadas}</td>
                        <td className="p-3 text-center tabular-nums">{aluno.totais.convalidadas}</td>
                      </tr>

                      {/* Linhas filhas (disciplinas) */}
                      {expandido &&
                        aluno.disciplinas.map((disc) => (
                          <tr key={disc.disciplina_id} className="hover:bg-muted/10">
                            <td className="p-3"></td>
                            <td className="p-3 pl-10">
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground font-mono">{disc.codigo}</span>
                                <span>{disc.nome}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className={STATUS_CONFIG[disc.status].color}>
                                {STATUS_CONFIG[disc.status].label}
                              </Badge>
                            </td>
                            <td className="p-3 text-center text-muted-foreground" colSpan={3}>
                              {disc.nota !== null ? (
                                <span className="tabular-nums font-medium">{disc.nota.toFixed(2)}</span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="p-3"></td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rodapé com totalizadores */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <div>
                <span className="text-muted-foreground">Total de alunos:</span>
                <span className="ml-2 font-semibold">{totalAlunos}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Total de disciplinas:</span>
                <span className="ml-2 font-semibold">{totalDisciplinas}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
