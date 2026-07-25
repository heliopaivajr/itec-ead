import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { MensalidadeVw } from '@/services/financeiro.service';

// Financeiro 2g — extrato financeiro do aluno (PDF). Reusa o padrão visual do R02
// (@react-pdf/renderer, navy #1F3864 / dourado #BF9000). PII-FREE: nome, curso,
// turma e contato — NUNCA CPF/RG/endereço.

export interface ExtratoFinanceiroPDFProps {
  aluno: {
    nome: string;
    codigo_itec: string | null;
    curso_nome: string | null;
    turma_nome: string | null;
    email: string | null;
    telefone: string | null;
  };
  mensalidades: MensalidadeVw[];
  resumo: {
    total_pago: number;
    total_devido: number;
    maior_atraso_dias: number;
  };
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#000000' },
  header: { marginBottom: 12, paddingBottom: 8, borderBottom: 2, borderBottomColor: '#1F3864' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logo: { width: 35, height: 35 },
  titulo: { fontSize: 12, fontWeight: 'bold', color: '#1F3864' },
  subtitulo: { fontSize: 8, color: '#666' },
  relatorioTitulo: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  infoLine: { fontSize: 9, color: '#333', marginBottom: 2 },
  resumoRow: { flexDirection: 'row', gap: 10, marginTop: 8, marginBottom: 4 },
  resumoBox: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 4, padding: 8 },
  resumoLabel: { fontSize: 7, color: '#666', marginBottom: 2 },
  resumoValor: { fontSize: 11, fontWeight: 'bold', color: '#1F3864' },
  table: { marginTop: 12 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1F3864', color: '#ffffff', padding: 5, fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#e0e0e0', padding: 4, fontSize: 8 },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  colMes: { width: '26%' },
  colValor: { width: '18%', textAlign: 'right' },
  colVenc: { width: '18%', textAlign: 'center' },
  colStatus: { width: '20%', textAlign: 'center' },
  colPago: { width: '18%', textAlign: 'right' },
  stPago: { color: '#22c55e', fontWeight: 'bold' },
  stAtrasado: { color: '#ef4444', fontWeight: 'bold' },
  stPendente: { color: '#BF9000', fontWeight: 'bold' },
  stOutro: { color: '#999' },
  rodape: {
    position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, color: '#999',
    textAlign: 'center', borderTop: 1, borderTopColor: '#e0e0e0', paddingTop: 6,
  },
  emissao: { fontSize: 7, color: '#999', textAlign: 'right', marginTop: 10 },
});

const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function fmtMes(mesRef: string): string {
  return new Date(mesRef + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
function fmtData(d: string | null): string {
  return d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';
}
function statusStyle(s: string) {
  if (s === 'pago') return styles.stPago;
  if (s === 'atrasado') return styles.stAtrasado;
  if (s === 'pendente') return styles.stPendente;
  return styles.stOutro;
}

export function ExtratoFinanceiroPDF({ aluno, mensalidades, resumo }: ExtratoFinanceiroPDFProps) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR');
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <Document title={`Extrato Financeiro - ${aluno.nome}`} author="ITEC - Instituto de Teologia Cristã">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src="/logo_itec.png" style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.titulo}>Instituto de Teologia Cristã</Text>
              <Text style={styles.subtitulo}>Janga, Paulista/PE · www.itecedu.com</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 6 }}>
          <Text style={styles.relatorioTitulo}>Extrato Financeiro do Aluno</Text>
          <Text style={styles.infoLine}>
            Aluno: {aluno.nome}{aluno.codigo_itec ? ` (${aluno.codigo_itec})` : ''}
          </Text>
          {aluno.curso_nome && <Text style={styles.infoLine}>Curso: {aluno.curso_nome}</Text>}
          {aluno.turma_nome && <Text style={styles.infoLine}>Turma: {aluno.turma_nome}</Text>}
          {(aluno.email || aluno.telefone) && (
            <Text style={styles.infoLine}>
              Contato: {[aluno.email, aluno.telefone].filter(Boolean).join(' · ')}
            </Text>
          )}
        </View>

        <View style={styles.resumoRow}>
          <View style={styles.resumoBox}>
            <Text style={styles.resumoLabel}>Total pago</Text>
            <Text style={styles.resumoValor}>{brl(resumo.total_pago)}</Text>
          </View>
          <View style={styles.resumoBox}>
            <Text style={styles.resumoLabel}>Total em aberto</Text>
            <Text style={styles.resumoValor}>{brl(resumo.total_devido)}</Text>
          </View>
          <View style={styles.resumoBox}>
            <Text style={styles.resumoLabel}>Maior atraso</Text>
            <Text style={styles.resumoValor}>{resumo.maior_atraso_dias} dia(s)</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colMes}>Referência</Text>
            <Text style={styles.colValor}>Valor</Text>
            <Text style={styles.colVenc}>Vencimento</Text>
            <Text style={styles.colStatus}>Situação</Text>
            <Text style={styles.colPago}>Pago</Text>
          </View>
          {mensalidades.map((m, i) => (
            <View key={m.id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={[styles.colMes, { textTransform: 'capitalize' }]}>{fmtMes(m.mes_referencia)}</Text>
              <Text style={styles.colValor}>{brl(m.valor)}</Text>
              <Text style={styles.colVenc}>{fmtData(m.data_vencimento)}</Text>
              <Text style={[styles.colStatus, statusStyle(m.status_efetivo)]}>{m.status_efetivo}</Text>
              <Text style={styles.colPago}>{m.status_efetivo === 'pago' ? brl(m.valor_pago ?? m.valor) : '—'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.emissao}>Emitido em: {dataEmissao} às {horaEmissao}</Text>

        <View style={styles.rodape}>
          <Text>Extrato gerado pela Plataforma EAD ITEC — documento sem valor fiscal</Text>
        </View>
      </Page>
    </Document>
  );
}
