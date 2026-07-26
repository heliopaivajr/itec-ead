import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { VisaoGeralAluno } from '@/services/financeiro.service';

// Financeiro 2e — PDF da Visão Geral (lista filtrada). PII-free: nome/turma/valores.
// Padrão visual do R02 (@react-pdf, navy #1F3864 / dourado #BF9000).

export interface VisaoGeralPDFProps {
  alunos: VisaoGeralAluno[];
  filtros: { busca: string; situacao: string; turma: string };
}

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', fontSize: 9, color: '#000' },
  header: { marginBottom: 12, paddingBottom: 8, borderBottom: 2, borderBottomColor: '#1F3864' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  logo: { width: 35, height: 35 },
  titulo: { fontSize: 12, fontWeight: 'bold', color: '#1F3864' },
  subtitulo: { fontSize: 8, color: '#666' },
  relatorioTitulo: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
  infoLine: { fontSize: 8, color: '#333', marginBottom: 2 },
  resumoRow: { flexDirection: 'row', gap: 8, marginTop: 6, marginBottom: 6 },
  resumoBox: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 4, padding: 6 },
  resumoLabel: { fontSize: 7, color: '#666' },
  resumoValor: { fontSize: 10, fontWeight: 'bold', color: '#1F3864' },
  table: { marginTop: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#1F3864', color: '#fff', padding: 5, fontWeight: 'bold', fontSize: 8 },
  tableRow: { flexDirection: 'row', borderBottom: 1, borderBottomColor: '#e0e0e0', padding: 4, fontSize: 8 },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  colNome: { width: '30%' },
  colTurma: { width: '18%' },
  colDisc: { width: '8%', textAlign: 'center' },
  colValor: { width: '14%', textAlign: 'right' },
  colSit: { width: '16%', textAlign: 'center' },
  colDevido: { width: '14%', textAlign: 'right' },
  stPago: { color: '#22c55e', fontWeight: 'bold' },
  stAtrasado: { color: '#ef4444', fontWeight: 'bold' },
  stPendente: { color: '#BF9000', fontWeight: 'bold' },
  emissao: { fontSize: 7, color: '#999', textAlign: 'right', marginTop: 10 },
  rodape: {
    position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, color: '#999',
    textAlign: 'center', borderTop: 1, borderTopColor: '#e0e0e0', paddingTop: 6,
  },
});

const brl = (v: number | null | undefined) =>
  (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SIT_LABEL: Record<string, string> = { em_dia: 'Em dia', pendente: 'Pendente', atrasado: 'Atrasado' };

function sitStyle(s: string) {
  if (s === 'em_dia') return styles.stPago;
  if (s === 'atrasado') return styles.stAtrasado;
  return styles.stPendente;
}

export function VisaoGeralFinanceiraPDF({ alunos, filtros }: VisaoGeralPDFProps) {
  const emissao = new Date().toLocaleDateString('pt-BR');
  const hora    = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const totalDevido = alunos.reduce((s, a) => s + a.total_devido, 0);
  const nEmDia    = alunos.filter(a => a.situacao === 'em_dia').length;
  const nPendente = alunos.filter(a => a.situacao === 'pendente').length;
  const nAtrasado = alunos.filter(a => a.situacao === 'atrasado').length;

  const filtroTxt = [
    filtros.busca ? `busca "${filtros.busca}"` : null,
    filtros.situacao !== 'todos' ? `situação ${SIT_LABEL[filtros.situacao] ?? filtros.situacao}` : null,
    filtros.turma !== 'todas' ? `turma ${filtros.turma}` : null,
  ].filter(Boolean).join(' · ') || 'sem filtros (todos os alunos ativos)';

  return (
    <Document title="Visão Geral Financeira - ITEC" author="ITEC - Instituto de Teologia Cristã">
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

        <View style={{ marginBottom: 4 }}>
          <Text style={styles.relatorioTitulo}>Visão Geral Financeira</Text>
          <Text style={styles.infoLine}>{alunos.length} aluno(s) · Filtro: {filtroTxt}</Text>
        </View>

        <View style={styles.resumoRow}>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Em dia</Text><Text style={styles.resumoValor}>{nEmDia}</Text></View>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Pendentes</Text><Text style={styles.resumoValor}>{nPendente}</Text></View>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Atrasados</Text><Text style={styles.resumoValor}>{nAtrasado}</Text></View>
          <View style={styles.resumoBox}><Text style={styles.resumoLabel}>Total em aberto</Text><Text style={styles.resumoValor}>{brl(totalDevido)}</Text></View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNome}>Aluno</Text>
            <Text style={styles.colTurma}>Turma</Text>
            <Text style={styles.colDisc}>Disc.</Text>
            <Text style={styles.colValor}>Mensalidade</Text>
            <Text style={styles.colSit}>Situação</Text>
            <Text style={styles.colDevido}>Em aberto</Text>
          </View>
          {alunos.map((a, i) => (
            <View key={a.matricula_id} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
              <Text style={styles.colNome}>{a.nome}</Text>
              <Text style={styles.colTurma}>{a.turma_nome ?? '—'}</Text>
              <Text style={styles.colDisc}>{a.qtd_disciplinas}</Text>
              <Text style={styles.colValor}>{brl(a.valor_mensalidade)}</Text>
              <Text style={[styles.colSit, sitStyle(a.situacao)]}>
                {SIT_LABEL[a.situacao]}{a.situacao === 'atrasado' ? ` ${a.maior_atraso_dias}d` : ''}
              </Text>
              <Text style={styles.colDevido}>{a.total_devido > 0 ? brl(a.total_devido) : '—'}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.emissao}>Emitido em: {emissao} às {hora}</Text>
        <View style={styles.rodape}><Text>Visão Geral Financeira — Plataforma EAD ITEC (sem valor fiscal)</Text></View>
      </Page>
    </Document>
  );
}
