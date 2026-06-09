import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getInadimplentesRelatorio } from '@/services/relatorios.service';
import { exportToExcel, exportToCSV } from './exporters/excelExporter';
import type { Turma } from '@/services/turmas.service';
import type { InadimplenteRelatorio } from '@/services/relatorios.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { pdf } from '@react-pdf/renderer';
import { R05_PDF } from './pdf/R05_PDF';

export default function R05_Inadimplentes() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('todas');
  const [diasAtraso, setDiasAtraso] = useState<string>('');
  const [inadimplentes, setInadimplentes] = useState<InadimplenteRelatorio[]>([]);
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

  // Buscar inadimplentes ao montar (sem filtros) e quando filtros mudarem
  useEffect(() => {
    async function buscar() {
      setLoading(true);
      const filtro = {
        turmaId: turmaId === 'todas' ? undefined : turmaId,
        diasAtraso: diasAtraso ? parseInt(diasAtraso, 10) : undefined,
      };
      const data = await getInadimplentesRelatorio(filtro);
      setInadimplentes(data);
      setLoading(false);
      setLoadingInicial(false);
    }

    buscar();
  }, [turmaId, diasAtraso]);

  const turmaAtual = turmaId === 'todas' ? null : turmas.find(t => t.id === turmaId);

  // Totalizadores
  const totalAlunos = inadimplentes.length;
  const valorTotalGeral = inadimplentes.reduce((sum, i) => sum + i.valor_total_atrasado, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    const blob = await pdf(
      <R05_PDF
        inadimplentes={inadimplentes}
        turma={turmaAtual}
        diasAtrasoFiltro={diasAtraso ? parseInt(diasAtraso, 10) : undefined}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    link.download = `R05_Inadimplentes_${dataHoje}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const dados = inadimplentes.map(i => ({
      'Nome': i.nome_aluno,
      'Turma': i.turma,
      'Telefone': i.telefone || '—',
      'Mensalidades Atrasadas': i.mensalidades_atrasadas,
      'Valor Total (R$)': i.valor_total_atrasado.toFixed(2),
      'Vencimento Mais Antigo': new Date(i.ultima_mensalidade_vencimento).toLocaleDateString('pt-BR'),
      'Dias em Atraso': i.dias_atraso,
    }));
    exportToExcel(dados, 'R05_Inadimplentes', 'Inadimplentes');
  };

  const handleExportCSV = () => {
    const dados = inadimplentes.map(i => ({
      'Nome': i.nome_aluno,
      'Turma': i.turma,
      'Telefone': i.telefone || '—',
      'Mensalidades Atrasadas': i.mensalidades_atrasadas,
      'Valor Total (R$)': i.valor_total_atrasado.toFixed(2),
      'Vencimento Mais Antigo': new Date(i.ultima_mensalidade_vencimento).toLocaleDateString('pt-BR'),
      'Dias em Atraso': i.dias_atraso,
    }));
    exportToCSV(dados, 'R05_Inadimplentes');
  };

  return (
    <RelatorioLayout
      titulo="R05 — Alunos Inadimplentes"
      subtitulo={`${totalAlunos} aluno(s) · R$ ${valorTotalGeral.toFixed(2)} em atraso`}
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
            <Label htmlFor="diasAtraso">Dias de atraso mínimo</Label>
            <Input
              id="diasAtraso"
              type="number"
              min="0"
              placeholder="Ex: 30"
              value={diasAtraso}
              onChange={(e) => setDiasAtraso(e.target.value)}
            />
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
      ) : inadimplentes.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {turmaId === 'todas' && !diasAtraso
            ? 'Nenhum aluno inadimplente encontrado. 🎉'
            : 'Nenhum aluno encontrado com os filtros selecionados.'}
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
                  <th className="text-left p-3 font-semibold">Telefone</th>
                  <th className="text-right p-3 font-semibold">Mensalidades</th>
                  <th className="text-right p-3 font-semibold">Valor Total</th>
                  <th className="text-left p-3 font-semibold">Vencimento</th>
                  <th className="text-right p-3 font-semibold">Dias em Atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {inadimplentes.map((inadimplente, index) => (
                  <tr key={inadimplente.aluno_id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3 font-medium">{inadimplente.nome_aluno}</td>
                    <td className="p-3 text-sm">{inadimplente.turma}</td>
                    <td className="p-3">{inadimplente.telefone || '—'}</td>
                    <td className="p-3 text-right tabular-nums">
                      {inadimplente.mensalidades_atrasadas}
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium">
                      R$ {inadimplente.valor_total_atrasado.toFixed(2)}
                    </td>
                    <td className="p-3">
                      {new Date(inadimplente.ultima_mensalidade_vencimento).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-bold tabular-nums ${
                          inadimplente.dias_atraso > 30
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        }`}
                      >
                        {inadimplente.dias_atraso} dias
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
              <span className="text-muted-foreground">Total de alunos inadimplentes:</span>
              <span className="text-lg font-bold">{totalAlunos}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium">
              <span className="text-muted-foreground">Valor total em atraso:</span>
              <span className="text-lg font-bold text-red-400">
                R$ {valorTotalGeral.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
