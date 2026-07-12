import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getListaPresencaRelatorio } from '@/services/relatorios.service';
import { useProfessorDisciplinas } from '@/hooks/useProfessorDisciplinas';
import type { DashboardContext } from '@/pages/Dashboard';
import { exportToExcel } from './exporters/excelExporter';
import type { Turma } from '@/services/turmas.service';
import type { ListaPresencaRelatorio } from '@/services/relatorios.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { pdf } from '@react-pdf/renderer';
import { R02_PDF } from './pdf/R02_PDF';

interface Disciplina {
  id: string;
  nome: string;
  codigo: string;
}

const MENSAGENS_ERRO: Record<string, string> = {
  sem_calendario: 'Nenhuma aula recorrente cadastrada. Cadastre a grade horária no Calendário Acadêmico antes de gerar a lista de presença.',
  sem_datas: 'Nenhuma aula encontrada no período selecionado. Verifique o calendário acadêmico.',
  sem_alunos: 'Nenhum aluno matriculado nesta turma.',
  sem_alunos_disciplina: 'Nenhum aluno matriculado nesta disciplina.',
};

export default function R02_ListaPresenca() {
  // Escopo por role (LGPD-01 fase 2 · Mov.2): o professor só enxerga/seleciona as
  // turmas e disciplinas dos SEUS contratos ativos; staff (admin/superadmin/
  // administracao) continua vendo tudo. O gate do roster já bloqueia dados de
  // disciplina alheia — isto aqui é a camada de UI (não oferecer a escolha).
  const { profile } = useOutletContext<DashboardContext>();
  const ehProfessor = profile.role === 'professor';
  const prof = useProfessorDisciplinas(profile.id);

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('');
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [disciplinaId, setDisciplinaId] = useState<string>('');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [dados, setDados] = useState<ListaPresencaRelatorio | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingDisciplinas, setLoadingDisciplinas] = useState(false);

  // Carregar turmas ao montar (staff = todas; professor = só as dos seus contratos)
  useEffect(() => {
    // Professor: espera as disciplinas do contrato antes de montar a lista de turmas.
    if (ehProfessor && prof.loading) return;

    async function load() {
      setLoadingTurmas(true);
      const data = await getTurmasAtivas();
      if (ehProfessor) {
        const minhasTurmas = new Set(
          prof.disciplinas.map((d) => d.turma_id).filter(Boolean) as string[]
        );
        setTurmas(data.filter((t) => minhasTurmas.has(t.id)));
      } else {
        setTurmas(data);
      }
      setLoadingTurmas(false);
    }
    load();
  }, [ehProfessor, prof.loading, prof.disciplinas]);

  // Carregar disciplinas quando turma mudar
  useEffect(() => {
    if (!turmaId) {
      setDisciplinas([]);
      setDisciplinaId('');
      return;
    }

    // Professor: disciplinas vêm dos SEUS contratos filtrados pela turma escolhida —
    // sem tocar em aulas_recorrentes (que listaria todas as disciplinas da turma).
    if (ehProfessor) {
      const discsUnicas = new Map<string, Disciplina>();
      for (const d of prof.disciplinas) {
        if (d.turma_id === turmaId) {
          discsUnicas.set(d.disciplina.id, {
            id: d.disciplina.id,
            nome: d.disciplina.nome,
            codigo: d.disciplina.codigo,
          });
        }
      }
      setDisciplinas(Array.from(discsUnicas.values()));
      return;
    }

    async function loadDisciplinas() {
      setLoadingDisciplinas(true);
      // Staff: buscar disciplinas da turma via aulas_recorrentes
      const { supabase } = await import('@/lib/supabase');
      const { data } = await supabase
        .from('aulas_recorrentes')
        .select('disciplina_id, disciplinas_v2(id, nome, codigo)')
        .eq('turma_id', turmaId)
        .eq('ativo', true);

      if (data) {
        const discsUnicas = new Map<string, Disciplina>();
        for (const row of data as any[]) {
          if (row.disciplinas_v2) {
            discsUnicas.set(row.disciplina_id, {
              id: row.disciplinas_v2.id,
              nome: row.disciplinas_v2.nome,
              codigo: row.disciplinas_v2.codigo,
            });
          }
        }
        setDisciplinas(Array.from(discsUnicas.values()));
      }
      setLoadingDisciplinas(false);
    }

    loadDisciplinas();
  }, [turmaId, ehProfessor, prof.disciplinas]);

  // Buscar lista de presença quando filtros mudarem
  useEffect(() => {
    if (!turmaId || !disciplinaId) {
      setDados(null);
      setErro(null);
      return;
    }

    async function buscar() {
      setLoading(true);
      setErro(null);
      const resultado = await getListaPresencaRelatorio({
        turmaId,
        disciplinaId,
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
      });

      if ('erro' in resultado) {
        setErro(resultado.erro);
        setDados(null);
      } else {
        setDados(resultado);
        setErro(null);
      }
      setLoading(false);
    }

    buscar();
  }, [turmaId, disciplinaId, dataInicio, dataFim]);

  const turmaAtual = turmas.find(t => t.id === turmaId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!dados) return;
    const blob = await pdf(<R02_PDF dados={dados} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `R02_ListaPresenca_${dados.turma.codigo}_${dataHoje}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!dados) return;

    // Transformar grade para formato Excel
    const linhas = dados.alunos.map((aluno, index) => {
      const linha: Record<string, any> = {
        '#': index + 1,
        'Nome': aluno.nome_aluno,
        'Cód. ITEC': aluno.codigo_itec || '—',
      };

      // Adicionar colunas de datas
      aluno.presencas.forEach((p, idx) => {
        const dataFormatada = new Date(p.data_aula).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        linha[dataFormatada] = p.status || '—';
      });

      // Adicionar resumo
      linha['Presenças'] = aluno.resumo.presencas;
      linha['Faltas'] = aluno.resumo.faltas;
      linha['Total'] = aluno.resumo.total_aulas;
      linha['%'] = `${aluno.resumo.percentual}%`;

      return linha;
    });

    exportToExcel(linhas, `R02_ListaPresenca_${dados.turma.codigo}`, 'Lista de Presença');
  };

  const formatarData = (dataISO: string) => {
    return new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <RelatorioLayout
      titulo="R02 — Lista de Presença"
      subtitulo={dados ? `${dados.disciplina.nome} · ${dados.turma.codigo} · ${dados.alunos.length} aluno(s)` : undefined}
      onPrint={handlePrint}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      loading={loading || loadingTurmas}
      hideExport={!dados}
      filtros={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="turma">Turma *</Label>
            {loadingTurmas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando turmas...
              </div>
            ) : (
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger id="turma">
                  <SelectValue placeholder="Selecione uma turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.codigo} — {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="disciplina">Disciplina *</Label>
            {loadingDisciplinas ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </div>
            ) : !turmaId ? (
              <Select disabled>
                <SelectTrigger id="disciplina">
                  <SelectValue placeholder="Selecione a turma primeiro" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={disciplinaId} onValueChange={setDisciplinaId} disabled={disciplinas.length === 0}>
                <SelectTrigger id="disciplina">
                  <SelectValue placeholder={disciplinas.length === 0 ? 'Nenhuma disciplina' : 'Selecione uma disciplina'} />
                </SelectTrigger>
                <SelectContent>
                  {disciplinas.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.codigo} — {d.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataInicio">Data Início</Label>
            <Input
              id="dataInicio"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataFim">Data Fim</Label>
            <Input
              id="dataFim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>
      }
    >
      {/* Conteúdo da tabela */}
      {erro ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{MENSAGENS_ERRO[erro] || 'Erro ao buscar dados.'}</AlertDescription>
        </Alert>
      ) : !turmaId || !disciplinaId ? (
        <div className="text-center py-20 text-muted-foreground">
          Selecione uma turma e disciplina para visualizar a lista de presença.
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !dados ? (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum dado encontrado.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 bg-muted/50 z-10 text-left p-2 font-semibold border-r">#</th>
                  <th className="sticky left-10 bg-muted/50 z-10 text-left p-2 font-semibold border-r min-w-[180px]">Nome</th>
                  <th className="sticky left-[240px] bg-muted/50 z-10 text-left p-2 font-semibold border-r">Cód.</th>
                  {dados.datas_aulas.map((data, idx) => (
                    <th key={idx} className="text-center p-2 font-semibold border-r min-w-[50px]">
                      {formatarData(data)}
                    </th>
                  ))}
                  <th className="sticky right-0 bg-muted/50 z-10 text-center p-2 font-semibold border-l" colSpan={4}>
                    Resumo (P/F/Total/%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dados.alunos.map((aluno, index) => (
                  <tr key={aluno.aluno_id} className="hover:bg-muted/20">
                    <td className="sticky left-0 bg-background z-10 p-2 text-muted-foreground border-r">{index + 1}</td>
                    <td className="sticky left-10 bg-background z-10 p-2 font-medium border-r">{aluno.nome_aluno}</td>
                    <td className="sticky left-[240px] bg-background z-10 p-2 text-xs text-muted-foreground border-r">
                      {aluno.codigo_itec || '—'}
                    </td>
                    {aluno.presencas.map((p, idx) => (
                      <td key={idx} className="text-center p-2 border-r">
                        <span
                          className={`inline-block w-8 h-8 leading-8 rounded font-bold ${
                            p.status === 'P'
                              ? 'bg-green-500/20 text-green-400'
                              : p.status === 'F'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {p.status || '—'}
                        </span>
                      </td>
                    ))}
                    <td className="sticky right-[90px] bg-background z-10 text-center p-2 border-l tabular-nums">
                      {aluno.resumo.presencas}
                    </td>
                    <td className="sticky right-[60px] bg-background z-10 text-center p-2 tabular-nums">
                      {aluno.resumo.faltas}
                    </td>
                    <td className="sticky right-[30px] bg-background z-10 text-center p-2 tabular-nums">
                      {aluno.resumo.total_aulas}
                    </td>
                    <td className="sticky right-0 bg-background z-10 text-center p-2 font-bold tabular-nums">
                      {aluno.resumo.percentual}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com legenda */}
          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-green-500/20 text-green-400 rounded text-center font-bold">P</span>
              <span className="text-muted-foreground">Presente</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-red-500/20 text-red-400 rounded text-center font-bold">F</span>
              <span className="text-muted-foreground">Falta</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-6 h-6 bg-muted text-muted-foreground rounded text-center">—</span>
              <span className="text-muted-foreground">Não lançado</span>
            </div>
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
