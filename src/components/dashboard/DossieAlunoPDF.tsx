import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { MensalidadeVw } from '@/services/financeiro.service';
import type { HistoricoAluno } from '@/services/academico.service';

// Financeiro 2i — DOSSIÊ COMPLETO DO ALUNO: vida acadêmica + financeira num só PDF.
// Reusa o padrão @react-pdf (navy #1F3864 / dourado #BF9000) do extrato 2g / R02.
// PII-FREE: gerado a partir da ficha do financeiro (fronteira 067) → sem CPF/RG/endereço.

export interface DossieAlunoPDFProps {
  aluno: {
    nome: string;
    codigo_itec: string | null;
    curso_nome: string | null;
    turma_nome: string | null;
    email: string | null;
    telefone: string | null;
    matricula_status: string | null;
    motivo_suspensao: string | null;
    data_suspensao: string | null;
  };
  mensalidades: MensalidadeVw[];
  historico: HistoricoAluno | null;
  emitidoPor: string;
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#000' },
  header: { marginBottom: 12, paddingBottom: 8, borderBottom: 2, borderBottomColor: '#1F3864' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logo: { width: 35, height: 35 },
  titulo: { fontSize: 12, fontWeight: 'bold', color: '#1F3864' },
  subtitulo: { fontSize: 8, color: '#666' },
  docTitulo: { fontSize: 13, fontWeight: 'bold', color: '#1F3864', marginBottom: 2 },
  infoLine: { fontSize: 9, color: '#333', marginBottom: 1 },
  secTitulo: { fontSize: 10, fontWeight: 'bold', color: '#1F3864', marginTop: 14, marginBottom: 4, paddingBottom: 2, borderBottom: 1, borderBottomColor: '#BF9000' },
  resumoRow: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  resumoBox: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 4, padding: 6 },
  resumoLabel: { fontSize: 7, color: '#666' },
  resumoValor: { fontSize: 10, fontWeight: 'bold', color: '#1F3864' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1F3864', color: '#fff', padding: 4, fontWeight: 'bold', fontSize: 7.5 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#e0e0e0', padding: 3.5, fontSize: 7.5 },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  stPago: { color: '#22c55e', fontWeight: 'bold' },
  stAtrasado: { color: '#ef4444', fontWeight: 'bold' },
  stPendente: { color: '#BF9000', fontWeight: 'bold' },
  stOutro: { color: '#999' },
  aviso: { fontSize: 8, color: '#ef4444', marginTop: 3 },
  vazio: { fontSize: 8, color: '#999', marginTop: 3 },
  histLinha: { fontSize: 7.5, color: '#555', marginBottom: 1 },
  emissao: { fontSize: 7, color: '#999', textAlign: 'right', marginTop: 12 },
  rodape: {
    position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, color: '#999',
    textAlign: 'center', borderTop: 1, borderTopColor: '#e0e0e0', paddingTop: 6,
  },
  // financeiro
  fMes: { width: '20%' }, fVal: { width: '13%', textAlign: 'right' }, fVenc: { width: '13%', textAlign: 'center' },
  fSit: { width: '15%', textAlign: 'center' }, fPagEm: { width: '14%', textAlign: 'center' },
  fForma: { width: '12%', textAlign: 'center' }, fPago: { width: '13%', textAlign: 'right' },
  // acadêmico
  aDisc: { width: '34%' }, aNota: { width: '10%', textAlign: 'center' }, aMedia: { width: '11%', textAlign: 'center' },
  aFreq: { width: '11%', textAlign: 'center' }, aFalta: { width: '9%', textAlign: 'center' }, aStatus: { width: '15%', textAlign: 'center' },
});

const brl = (v: number | null | undefined) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtData = (d: string | null | undefined) => d ? new Date(d.slice(0, 10) + 'T12:00').toLocaleDateString('pt-BR') : '—';
const fmtMes = (m: string) => new Date(m + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const num = (n: number | null) => (n === null || n === undefined ? '—' : n.toFixed(1));

const SIT_FIN: Record<string, string> = { pago: 'Pago', atrasado: 'Atrasado', pendente: 'Pendente', isento: 'Isento', cancelado: 'Cancelado' };
function sitFinStyle(s: string) {
  if (s === 'pago') return styles.stPago;
  if (s === 'atrasado') return styles.stAtrasado;
  if (s === 'pendente') return styles.stPendente;
  return styles.stOutro;
}

const STATUS_ACAD: Record<string, string> = {
  aprovado_direto: 'Aprovado', recuperacao: 'Recuperação', reprovado_nota: 'Reprovado',
  reprovado_falta: 'Rep. Falta', convalidado: 'Convalidado', em_andamento: 'Cursando', pendente: 'Cursando',
};

export function DossieAlunoPDF({ aluno, mensalidades, historico, emitidoPor }: DossieAlunoPDFProps) {
  const emissao = new Date().toLocaleDateString('pt-BR');
  const hora    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const anoAtual = String(new Date().getFullYear());

  const totalPagoAno = mensalidades
    .filter(m => m.status_efetivo === 'pago' && (m.data_pagamento ?? '').startsWith(anoAtual))
    .reduce((s, m) => s + (m.valor_pago ?? m.valor), 0);
  const totalAberto = mensalidades
    .filter(m => m.status_efetivo === 'pendente' || m.status_efetivo === 'atrasado')
    .reduce((s, m) => s + m.valor, 0);
  const hojeMs = Date.now();
  const maiorAtraso = mensalidades
    .filter(m => m.status_efetivo === 'atrasado')
    .reduce((mx, m) => Math.max(mx, Math.round((hojeMs - new Date(m.data_vencimento + 'T12:00').getTime()) / 86_400_000)), 0);

  const correcoes = mensalidades.filter(m => m.data_estorno || m.motivo_cancelamento);
  const suspensa = aluno.matricula_status === 'suspensa';

  const disciplinas = (historico?.modulos ?? []).flatMap(mod => mod.disciplinas);

  return (
    <Document title={`Dossiê - ${aluno.nome}`} author="ITEC - Instituto de Teologia Cristã">
      <Page size="A4" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src="/logo_itec.png" style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>Instituto de Teologia Cristã</Text>
              <Text style={styles.subtitulo}>Janga, Paulista/PE · www.itecedu.com</Text>
            </View>
          </View>
          <Text style={styles.docTitulo}>Dossiê do Aluno</Text>
        </View>

        {/* SEÇÃO 1 — DADOS */}
        <Text style={styles.secTitulo}>1. Dados do aluno</Text>
        <Text style={styles.infoLine}>Nome: {aluno.nome}{aluno.codigo_itec ? `  ·  Código: ${aluno.codigo_itec}` : ''}</Text>
        {aluno.curso_nome && <Text style={styles.infoLine}>Curso: {aluno.curso_nome}</Text>}
        {aluno.turma_nome && <Text style={styles.infoLine}>Turma: {aluno.turma_nome}</Text>}
        {(aluno.email || aluno.telefone) && (
          <Text style={styles.infoLine}>Contato: {[aluno.email, aluno.telefone].filter(Boolean).join(' · ')}</Text>
        )}
        <Text style={styles.infoLine}>
          Situação da matrícula: {suspensa ? 'SUSPENSA' : (aluno.matricula_status ?? '—')}
          {suspensa && aluno.motivo_suspensao ? ` (motivo: ${aluno.motivo_suspensao}${aluno.data_suspensao ? `, desde ${fmtData(aluno.data_suspensao)}` : ''})` : ''}
        </Text>

        {/* SEÇÃO 2 — FINANCEIRO */}
        <Text style={styles.secTitulo}>2. Situação financeira</Text>
        <View style={styles.resumoRow}>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Total pago em {anoAtual}</Text><Text style={styles.resumoValor}>{brl(totalPagoAno)}</Text></View>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Total em aberto</Text><Text style={styles.resumoValor}>{brl(totalAberto)}</Text></View>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Maior atraso</Text><Text style={styles.resumoValor}>{maiorAtraso} dia(s)</Text></View>
        </View>

        {mensalidades.length === 0 ? (
          <Text style={styles.vazio}>Nenhuma mensalidade lançada.</Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.fMes}>Referência</Text>
              <Text style={styles.fVal}>Valor</Text>
              <Text style={styles.fVenc}>Vencimento</Text>
              <Text style={styles.fSit}>Situação</Text>
              <Text style={styles.fPagEm}>Pago em</Text>
              <Text style={styles.fForma}>Forma</Text>
              <Text style={styles.fPago}>Valor pago</Text>
            </View>
            {mensalidades.map((m, i) => (
              <View key={m.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.fMes, { textTransform: 'capitalize' }]}>{fmtMes(m.mes_referencia)}</Text>
                <Text style={styles.fVal}>{brl(m.valor)}</Text>
                <Text style={styles.fVenc}>{fmtData(m.data_vencimento)}</Text>
                <Text style={[styles.fSit, sitFinStyle(m.status_efetivo)]}>{SIT_FIN[m.status_efetivo] ?? m.status_efetivo}</Text>
                <Text style={styles.fPagEm}>{m.status_efetivo === 'pago' ? fmtData(m.data_pagamento) : '—'}</Text>
                <Text style={styles.fForma}>{m.forma_pagamento ? m.forma_pagamento.toUpperCase() : '—'}</Text>
                <Text style={styles.fPago}>{m.status_efetivo === 'pago' ? brl(m.valor_pago ?? m.valor) : '—'}</Text>
              </View>
            ))}
          </View>
        )}

        {/* histórico de correções (auditoria 075) */}
        {correcoes.length > 0 && (
          <View>
            <Text style={[styles.infoLine, { fontWeight: 'bold', marginTop: 6 }]}>Histórico de correções (estornos / cancelamentos):</Text>
            {correcoes.map(m => (
              <Text key={`c-${m.id}`} style={styles.histLinha}>
                • {fmtMes(m.mes_referencia)} —
                {m.data_estorno ? ` estornado em ${fmtData(m.data_estorno)}${m.motivo_estorno ? `: ${m.motivo_estorno}` : ''}` : ''}
                {m.motivo_cancelamento ? ` cancelado: ${m.motivo_cancelamento}` : ''}
              </Text>
            ))}
          </View>
        )}

        {/* SEÇÃO 3 — ACADÊMICO */}
        <Text style={styles.secTitulo}>3. Resumo acadêmico</Text>
        {!historico || disciplinas.length === 0 ? (
          <Text style={styles.vazio}>
            {aluno.turma_nome ? 'Sem histórico acadêmico lançado para este aluno.' : 'Aluno sem turma vinculada — histórico acadêmico indisponível.'}
          </Text>
        ) : (
          <View>
            <View style={styles.resumoRow}>
              <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Média geral</Text><Text style={styles.resumoValor}>{num(historico.media_geral)}</Text></View>
              <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Aprovadas</Text><Text style={styles.resumoValor}>{historico.disciplinas_aprovadas}</Text></View>
              <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Cursando</Text><Text style={styles.resumoValor}>{historico.disciplinas_em_andamento}</Text></View>
              <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Reprovadas</Text><Text style={styles.resumoValor}>{historico.disciplinas_reprovadas}</Text></View>
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.aDisc}>Disciplina</Text>
              <Text style={styles.aNota}>N1</Text>
              <Text style={styles.aNota}>N2</Text>
              <Text style={styles.aMedia}>Média</Text>
              <Text style={styles.aFreq}>Freq.</Text>
              <Text style={styles.aFalta}>Faltas</Text>
              <Text style={styles.aStatus}>Status</Text>
            </View>
            {disciplinas.map((d, i) => (
              <View key={d.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={styles.aDisc}>{d.nome}</Text>
                <Text style={styles.aNota}>{num(d.notas.n1)}</Text>
                <Text style={styles.aNota}>{num(d.notas.n2)}</Text>
                <Text style={styles.aMedia}>{num(d.notas.media_final)}</Text>
                <Text style={styles.aFreq}>{d.frequencia.percentual}%</Text>
                <Text style={styles.aFalta}>{Math.max(0, d.frequencia.total_aulas - d.frequencia.presencas)}</Text>
                <Text style={styles.aStatus}>{STATUS_ACAD[d.status] ?? d.status}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.emissao}>Emitido por {emitidoPor} em {emissao} às {hora}</Text>
        <View style={styles.rodape}>
          <Text>Dossiê do Aluno — Plataforma EAD ITEC · documento interno, sem valor fiscal</Text>
        </View>
      </Page>
    </Document>
  );
}
