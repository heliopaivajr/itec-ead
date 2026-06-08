import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getAlunosPorTurma } from '@/services/relatorios.service';
import { exportToExcel, exportToCSV } from './exporters/excelExporter';
import type { Turma } from '@/services/turmas.service';
import type { AlunoTurmaRelatorio } from '@/services/relatorios.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { pdf } from '@react-pdf/renderer';
import { R01_PDF } from './pdf/R01_PDF';

const STATUS_OPTIONS = [
  { value: 'todos', label: 'Todos os status' },
  { value: 'ativa', label: 'Ativa' },
  { value: 'trancada', label: 'Trancada' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'cancelada', label: 'Cancelada' },
];

export default function R01_AlunosPorTurma() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('');
  const [status, setStatus] = useState<string>('todos');
  const [alunos, setAlunos] = useState<AlunoTurmaRelatorio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(true);

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

  // Buscar alunos quando turma ou status mudar
  useEffect(() => {
    if (!turmaId) {
      setAlunos([]);
      return;
    }

    async function buscar() {
      setLoading(true);
      const filtro = {
        turmaId,
        status: status === 'todos' ? undefined : (status as 'ativa' | 'trancada' | 'concluida' | 'cancelada'),
      };
      const data = await getAlunosPorTurma(filtro);
      setAlunos(data);
      setLoading(false);
    }

    buscar();
  }, [turmaId, status]);

  const turmaAtual = turmas.find(t => t.id === turmaId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!turmaAtual) return;
    const blob = await pdf(
      <R01_PDF turma={turmaAtual} alunos={alunos} status={status} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `R01_Alunos_${turmaAtual.codigo}_${new Date().toISOString().split('T')[0]}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (!turmaAtual) return;
    const dados = alunos.map(a => ({
      'Código ITEC': a.codigo_itec || '—',
      'Nome Completo': a.nome_completo,
      'E-mail': a.email,
      'Telefone': a.telefone || '—',
      'Status': a.status_matricula,
      'Data Matrícula': new Date(a.data_matricula).toLocaleDateString('pt-BR'),
    }));
    exportToExcel(dados, `R01_Alunos_${turmaAtual.codigo}`, 'Alunos');
  };

  const handleExportCSV = () => {
    if (!turmaAtual) return;
    const dados = alunos.map(a => ({
      'Código ITEC': a.codigo_itec || '—',
      'Nome Completo': a.nome_completo,
      'E-mail': a.email,
      'Telefone': a.telefone || '—',
      'Status': a.status_matricula,
      'Data Matrícula': new Date(a.data_matricula).toLocaleDateString('pt-BR'),
    }));
    exportToCSV(dados, `R01_Alunos_${turmaAtual.codigo}`);
  };

  return (
    <RelatorioLayout
      titulo="R01 — Alunos por Turma"
      subtitulo={turmaAtual ? `${turmaAtual.nome} · ${alunos.length} aluno(s)` : undefined}
      onPrint={handlePrint}
      onExportPDF={handleExportPDF}
      onExportExcel={handleExportExcel}
      onExportCSV={handleExportCSV}
      loading={loading || loadingTurmas}
      filtros={
        <div className="grid gap-4 sm:grid-cols-2">
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
            <Label htmlFor="status">Status da Matrícula</Label>
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
      {!turmaId ? (
        <div className="text-center py-20 text-muted-foreground">
          Selecione uma turma para visualizar os alunos matriculados.
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
                  <th className="text-left p-3 font-semibold">Código ITEC</th>
                  <th className="text-left p-3 font-semibold">Nome Completo</th>
                  <th className="text-left p-3 font-semibold">Telefone</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Data Matrícula</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {alunos.map((aluno, index) => (
                  <tr key={aluno.aluno_id} className="hover:bg-muted/20">
                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                    <td className="p-3 font-mono text-xs">
                      {aluno.codigo_itec || '—'}
                    </td>
                    <td className="p-3 font-medium">{aluno.nome_completo}</td>
                    <td className="p-3">{aluno.telefone || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          aluno.status_matricula === 'ativa'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : aluno.status_matricula === 'trancada'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : aluno.status_matricula === 'concluida'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {aluno.status_matricula}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(aluno.data_matricula).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé com total */}
          <div className="mt-4 pt-4 border-t text-sm font-medium text-muted-foreground">
            Total: {alunos.length} aluno(s) matriculado(s)
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
