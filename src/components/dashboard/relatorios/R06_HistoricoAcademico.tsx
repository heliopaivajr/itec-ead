import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { RelatorioLayout } from './RelatorioLayout';
import { getTurmasAtivas } from '@/services/turmas.service';
import { getHistoricoAcademicoR06, getAlunosDaTurma } from '@/services/relatorios.service';
import type { Turma } from '@/services/turmas.service';
import type { R06_HistoricoAcademicoRelatorio } from '@/services/relatorios.service';
import type { StatusHistorico } from '@/services/academico.service';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { pdf } from '@react-pdf/renderer';
import { R06_PDF } from './pdf/R06_PDF';

const STATUS_CONFIG: Record<StatusHistorico, { label: string; color: string }> = {
  aprovado_direto: { label: 'Aprovado', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  recuperacao: { label: 'Recuperação', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  reprovado_nota: { label: 'Rep. Nota', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  reprovado_falta: { label: 'Rep. Falta', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  em_andamento: { label: 'Cursando', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  pendente: { label: 'Pendente', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

type AlunoOption = {
  id: string;
  nome: string;
  codigo_itec: string | null;
};

export default function R06_HistoricoAcademico() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('');
  const [alunos, setAlunos] = useState<AlunoOption[]>([]);
  const [alunoId, setAlunoId] = useState<string>('');
  const [dados, setDados] = useState<R06_HistoricoAcademicoRelatorio | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);

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

  // Carregar alunos quando turma mudar
  useEffect(() => {
    if (!turmaId) {
      setAlunos([]);
      setAlunoId('');
      setDados(null);
      return;
    }

    async function loadAlunos() {
      setLoadingAlunos(true);
      setAlunoId('');
      setDados(null);

      const alunosData = await getAlunosDaTurma(turmaId);
      setAlunos(alunosData);

      setLoadingAlunos(false);
    }

    loadAlunos();
  }, [turmaId]);

  // Buscar histórico quando aluno mudar
  useEffect(() => {
    if (!turmaId || !alunoId) {
      setDados(null);
      return;
    }

    async function buscar() {
      setLoading(true);
      const resultado = await getHistoricoAcademicoR06({
        alunoId,
        turmaId,
      });
      setDados(resultado);
      setLoading(false);
    }

    buscar();
  }, [turmaId, alunoId]);

  const turmaAtual = turmas.find((t) => t.id === turmaId);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!dados) return;
    const blob = await pdf(<R06_PDF dados={dados} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dataHoje = new Date().toISOString().split('T')[0];
    const nomeAluno = dados.dados_pessoais.nome_completo.replace(/\s+/g, '_');
    link.download = `R06_HistoricoAcademico_${nomeAluno}_${dataHoje}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <RelatorioLayout
      titulo="R06 — Histórico Acadêmico Individual"
      subtitulo={
        dados
          ? `${dados.dados_pessoais.nome_completo} — ${dados.dados_pessoais.turma_codigo}`
          : 'Selecione turma e aluno'
      }
      onPrint={handlePrint}
      onExportPDF={handleExportPDF}
      onExportExcel={undefined}
      onExportCSV={undefined}
      loading={loading || loadingTurmas}
      hideExport={!dados}
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
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
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
            <Label htmlFor="aluno">Aluno *</Label>
            {loadingAlunos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando alunos...
              </div>
            ) : !turmaId ? (
              <Select disabled>
                <SelectTrigger id="aluno">
                  <SelectValue placeholder="Selecione a turma primeiro" />
                </SelectTrigger>
              </Select>
            ) : alunos.length === 0 ? (
              <Select disabled>
                <SelectTrigger id="aluno">
                  <SelectValue placeholder="Nenhum aluno encontrado" />
                </SelectTrigger>
              </Select>
            ) : (
              <Select value={alunoId} onValueChange={setAlunoId}>
                <SelectTrigger id="aluno">
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                      {a.codigo_itec && ` (${a.codigo_itec})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      }
    >
      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !dados ? (
        <div className="text-center py-20 text-muted-foreground">
          {!turmaId
            ? 'Selecione uma turma para continuar'
            : !alunoId
            ? 'Selecione um aluno para gerar o histórico acadêmico'
            : 'Gerando histórico...'}
        </div>
      ) : (
        <>
          {/* Cabeçalho dados pessoais */}
          <div className="bg-muted/30 border rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <span className="text-sm text-muted-foreground">Nome Completo:</span>
                <p className="font-medium">{dados.dados_pessoais.nome_completo}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Código ITEC:</span>
                <p className="font-medium font-mono">
                  {dados.dados_pessoais.codigo_itec || '—'}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CPF:</span>
                <p className="font-medium font-mono">{dados.dados_pessoais.cpf || '—'}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Turma:</span>
                <p className="font-medium">
                  {dados.dados_pessoais.turma_codigo} — {dados.dados_pessoais.turma_nome}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela agrupada por módulo */}
          {dados.historico.modulos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Aluno não possui disciplinas cursadas.
            </div>
          ) : (
            <div className="space-y-6">
              {dados.historico.modulos.map((modulo) => (
                <div key={modulo.id} className="border rounded-lg overflow-hidden">
                  {/* Header do módulo */}
                  <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{modulo.nome}</h4>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Média do módulo:{' '}
                          <span className="font-semibold tabular-nums">
                            {modulo.media_modulo !== null
                              ? modulo.media_modulo.toFixed(1)
                              : '—'}
                          </span>
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            modulo.status_modulo === 'aprovado'
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : modulo.status_modulo === 'em_andamento'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }
                        >
                          {modulo.status_modulo === 'aprovado'
                            ? 'Aprovado'
                            : modulo.status_modulo === 'em_andamento'
                            ? 'Em Andamento'
                            : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de disciplinas */}
                  <table className="w-full text-sm">
                    <thead className="bg-muted/30 border-b">
                      <tr>
                        <th className="text-left p-3">Disciplina</th>
                        <th className="text-center p-3 w-20">C.H.</th>
                        <th className="text-center p-3 w-20">Créd.</th>
                        <th className="text-center p-3 w-16">N1</th>
                        <th className="text-center p-3 w-16">N2</th>
                        <th className="text-center p-3 w-16">Rec.</th>
                        <th className="text-center p-3 w-20">Média</th>
                        <th className="text-center p-3 w-20">Freq.%</th>
                        <th className="text-center p-3 w-32">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {modulo.disciplinas.map((disc) => (
                        <tr key={disc.id} className="hover:bg-muted/10">
                          <td className="p-3">{disc.nome}</td>
                          <td className="p-3 text-center tabular-nums">{disc.carga_horaria}</td>
                          <td className="p-3 text-center tabular-nums font-medium">
                            {disc.creditos}
                          </td>
                          <td className="p-3 text-center tabular-nums">
                            {disc.notas.n1 !== null ? disc.notas.n1.toFixed(1) : '—'}
                          </td>
                          <td className="p-3 text-center tabular-nums">
                            {disc.notas.n2 !== null ? disc.notas.n2.toFixed(1) : '—'}
                          </td>
                          <td className="p-3 text-center tabular-nums">
                            {disc.notas.recuperacao !== null
                              ? disc.notas.recuperacao.toFixed(1)
                              : '—'}
                          </td>
                          <td className="p-3 text-center tabular-nums font-semibold">
                            {disc.notas.media_final !== null
                              ? disc.notas.media_final.toFixed(1)
                              : '—'}
                          </td>
                          <td className="p-3 text-center tabular-nums">
                            {disc.frequencia.percentual.toFixed(0)}%
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={STATUS_CONFIG[disc.status].color}>
                              {STATUS_CONFIG[disc.status].label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Resumo final */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <span className="text-sm text-muted-foreground block mb-1">
                  Total Carga Horária
                </span>
                <p className="text-2xl font-bold tabular-nums">
                  {dados.historico.total_carga_horaria}h
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <span className="text-sm text-muted-foreground block mb-1">Total Créditos</span>
                <p className="text-2xl font-bold tabular-nums">
                  {dados.historico.total_creditos}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <span className="text-sm text-muted-foreground block mb-1">Média Geral</span>
                <p className="text-2xl font-bold tabular-nums">
                  {dados.historico.media_geral !== null
                    ? dados.historico.media_geral.toFixed(1)
                    : '—'}
                </p>
              </div>
              <div className="bg-muted/20 rounded-lg p-4">
                <span className="text-sm text-muted-foreground block mb-1">Disciplinas</span>
                <p className="text-sm">
                  <span className="text-green-400 font-semibold">
                    {dados.historico.disciplinas_aprovadas} aprov.
                  </span>
                  {' · '}
                  <span className="text-red-400 font-semibold">
                    {dados.historico.disciplinas_reprovadas} reprov.
                  </span>
                  {' · '}
                  <span className="text-blue-400 font-semibold">
                    {dados.historico.disciplinas_em_andamento} cursando
                  </span>
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </RelatorioLayout>
  );
}
