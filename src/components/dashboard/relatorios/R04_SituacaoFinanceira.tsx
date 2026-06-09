import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getSituacaoFinanceiraRelatorio } from '@/services/relatorios.service';
import { exportToExcel, exportToCSV } from './exporters/excelExporter';
import type { Turma } from '@/services/turmas.service';
import type { SituacaoFinanceiraRelatorio } from '@/services/relatorios.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { pdf } from '@react-pdf/renderer';
import { R04_PDF } from './pdf/R04_PDF';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'em_dia', label: 'Em dia' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'isento', label: 'Isento (Bolsista/Desconto)' },
];

const TIPO_FINANCIAMENTO_LABEL: Record<string, string> = {
  integral: 'Integral',
  bolsista: 'Bolsista',
  desconto_indicacao: 'Desc. Indicação',
  desconto_familia: 'Desc. Família',
};

export default function R04_SituacaoFinanceira() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('todas');
  const [status, setStatus] = useState<string>('todos');
  const [alunos, setAlunos] = useState<SituacaoFinanceiraRelatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingInicial, setLoadingInicial] = useState(true);

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

  // Buscar situação financeira ao montar e quando filtros mudarem
  useEffect(() => {
    async function buscar() {
      setLoading(true);
      const filtro = {
        turmaId: turmaId === 'todas' ? undefined : turmaId,
        status: status === 'todos' ? undefined : (status as 'em_dia' | 'atrasado' | 'isento'),
      };
      const data = await getSituacaoFinanceiraRelatorio(filtro);
      setAlunos(data);
      setLoading(false);
      setLoadingInicial(false);
    }

    buscar();
  }, [turmaId, status]);

  const turmaAtual = turmaId === 'todas' ? null : turmas.find(t => t.id === turmaId);

  // Totalizadores
  const totalAlunos = alunos.length;
  const valorTotalEmAberto = alunos.reduce((sum, a) => sum + a.valor_em_aberto, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const blob = await pdf(
      <R04_PDF
        alunos={alunos}
        turma={turmaAtual}
        statusFiltro={status === 'todos' ? undefined : status}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `R04_SituacaoFinanceira_${dataHoje}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const dados = alunos.map(a => ({
      'Nome': a.nome_aluno,
      'Turma': a.turma,
      'Tipo Financiamento': TIPO_FINANCIAMENTO_LABEL[a.tipo_financiamento],
      'Desconto %': a.percentual_desconto,
      'Mensalidades Pagas': a.mensalidades_pagas,
      'Mensalidades Pendentes': a.mensalidades_pendentes,
      'Valor em Aberto (R$)': a.valor_em_aberto.toFixed(2),
      'Status': a.status_geral,
    }));
    exportToExcel(dados, 'R04_SituacaoFinanceira', 'Situação Financeira');
  };

  const handleExportCSV = () => {
    const dados = alunos.map(a => ({
      'Nome': a.nome_aluno,
      'Turma': a.turma,
      'Tipo Financiamento': TIPO_FINANCIAMENTO_LABEL[a.tipo_financiamento],
      'Desconto %': a.percentual_desconto,
      'Mensalidades Pagas': a.mensalidades_pagas,
      'Mensalidades Pendentes': a.mensalidades_pendentes,
      'Valor em Aberto (R$)': a.valor_em_aberto.toFixed(2),
      'Status': a.status_geral,
    }));
    exportToCSV(dados, 'R04_SituacaoFinanceira');
  };

  return (
    <RelatorioLayout
      titulo="R04 — Situação Financeira dos Alunos"
      subtitulo={`${totalAlunos} aluno(s) · R$ ${valorTotalEmAberto.toFixed(2)} em aberto`}
      onPrint={handlePrint}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      onExportCSV={handleExportCSV}
      loading={loading || loadingTurmas}
      filtros={
        <div className="grid gap-4 sm:grid-cols-2">
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
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as turmas</SelectItem>
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
            <Label htmlFor="status">Status Financeiro</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      {/* Conteúdo da tabela */}
      {loadingInicial ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : alunos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          Nenhum aluno encontrado com os filtros selecionados.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Nome</th>
                  <th className="text-left p-3 font-semibold">Turma</th>
                  <th className="text-left p-3 font-semibold">Tipo Financ.</th>
                  <th className="text-right p-3 font-semibold">Desc. %</th>
                  <th className="text-right p-3 font-semibold">Pagas</th>
                  <th className="text-right p-3 font-semibold">Pendentes</th>
                  <th className="text-right p-3 font-semibold">Valor Aberto</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alunos.map((aluno, index) => (
                  <tr key={aluno.aluno_id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3 font-medium">{aluno.nome_aluno}</td>
                    <td className="p-3 text-sm">{aluno.turma}</td>
                    <td className="p-3 text-xs">
                      {TIPO_FINANCIAMENTO_LABEL[aluno.tipo_financiamento]}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {aluno.percentual_desconto > 0 ? `${aluno.percentual_desconto}%` : '—'}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {aluno.mensalidades_pagas}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {aluno.mensalidades_pendentes}
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium">
                      R$ {aluno.valor_em_aberto.toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                          aluno.status_geral === 'em_dia'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : aluno.status_geral === 'atrasado'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {aluno.status_geral === 'em_dia' && 'Em dia'}
                        {aluno.status_geral === 'atrasado' && 'Atrasado'}
                        {aluno.status_geral === 'isento' && 'Isento'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com totalizadores */}
          <div className="mt-6 pt-4 border-t space-y-2">
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Total de alunos:</span>
              <span className="text-lg font-bold">{totalAlunos}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Valor total em aberto:</span>
              <span className="text-lg font-bold text-orange-400">
                R$ {valorTotalEmAberto.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
