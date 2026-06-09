import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Turma } from '@/services/turmas.service';
import type { InadimplenteRelatorio } from '@/services/relatorios.service';

export interface R05_PDFProps {
  inadimplentes: InadimplenteRelatorio[];
  turma?: Turma | null;
  diasAtrasoFiltro?: number;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#000000',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: 2,
    borderBottomColor: '#1F3864',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    width: 40,
    height: 40,
  },
  headerText: {
    flex: 1,
  },
  titulo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F3864',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 9,
    color: '#666',
  },
  relatorioTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  filtroInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 12,
  },
  table: {
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F3864',
    color: '#ffffff',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    padding: 6,
    fontSize: 8,
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5',
  },
  tableRowAlert: {
    backgroundColor: '#ffebee',
  },
  col1: { width: '5%' },   // #
  col2: { width: '22%' },  // Nome
  col3: { width: '15%' },  // Turma
  col4: { width: '13%' },  // Telefone
  col5: { width: '8%', textAlign: 'right' },  // Mensalidades
  col6: { width: '12%', textAlign: 'right' },  // Valor Total
  col7: { width: '13%' },  // Vencimento
  col8: { width: '12%', textAlign: 'right' },  // Dias em Atraso
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: '#ccc',
    fontSize: 9,
    color: '#333',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  footerLabel: {
    color: '#666',
  },
  footerValue: {
    fontWeight: 'bold',
  },
  footerValueAlert: {
    fontWeight: 'bold',
    color: '#c62828',
  },
  emissaoInfo: {
    marginTop: 8,
    fontSize: 8,
    color: '#999',
    textAlign: 'right',
  },
  rodape: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
});

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

function formatarTelefone(tel: string | null): string {
  if (!tel) return '—';
  const numeros = tel.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return tel;
}

export function R05_PDF({ inadimplentes, turma, diasAtrasoFiltro }: R05_PDFProps) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Totalizadores
  const totalAlunos = inadimplentes.length;
  const valorTotalGeral = inadimplentes.reduce((sum, i) => sum + i.valor_total_atrasado, 0);

  // Texto do filtro
  const filtroTexto = [];
  if (turma) {
    filtroTexto.push(`Turma: ${turma.codigo} — ${turma.nome}`);
  } else {
    filtroTexto.push('Turma: Todas');
  }
  if (diasAtrasoFiltro) {
    filtroTexto.push(`Dias de atraso mínimo: ${diasAtrasoFiltro}`);
  }

  return (
    <Document
      title="R05 - Alunos Inadimplentes"
      author="ITEC - Instituto de Teologia Cristã"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Image src="/logo_itec.png" style={styles.logo} />
            <View style={styles.headerText}>
              <Text style={styles.titulo}>Instituto de Teologia Cristã</Text>
              <Text style={styles.subtitulo}>Janga, Paulista/PE · www.itecedu.com</Text>
            </View>
          </View>
        </View>

        {/* Título do Relatório */}
        <View style={{ marginBottom: 12 }}>
          <Text style={styles.relatorioTitulo}>R05 — Alunos Inadimplentes</Text>
          {filtroTexto.length > 0 && (
            <Text style={styles.filtroInfo}>Filtros: {filtroTexto.join(' · ')}</Text>
          )}
        </View>

        {/* Tabela */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Nome</Text>
            <Text style={styles.col3}>Turma</Text>
            <Text style={styles.col4}>Telefone</Text>
            <Text style={styles.col5}>Mens.</Text>
            <Text style={styles.col6}>Valor Total</Text>
            <Text style={styles.col7}>Vencimento</Text>
            <Text style={styles.col8}>Dias Atraso</Text>
          </View>

          {/* Rows */}
          {inadimplentes.map((inadimplente, index) => {
            const isAlert = inadimplente.dias_atraso > 30;
            const rowStyle = [
              styles.tableRow,
              isAlert ? styles.tableRowAlert : index % 2 === 1 && styles.tableRowAlt,
            ];

            return (
              <View key={inadimplente.aluno_id} style={rowStyle}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{inadimplente.nome_aluno}</Text>
                <Text style={styles.col3}>{inadimplente.turma}</Text>
                <Text style={styles.col4}>{formatarTelefone(inadimplente.telefone)}</Text>
                <Text style={styles.col5}>{inadimplente.mensalidades_atrasadas}</Text>
                <Text style={styles.col6}>
                  R$ {inadimplente.valor_total_atrasado.toFixed(2)}
                </Text>
                <Text style={styles.col7}>
                  {formatarData(inadimplente.ultima_mensalidade_vencimento)}
                </Text>
                <Text style={styles.col8}>{inadimplente.dias_atraso} dias</Text>
              </View>
            );
          })}
        </View>

        {/* Footer com totalizadores */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total de alunos inadimplentes:</Text>
            <Text style={styles.footerValue}>{totalAlunos}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Valor total em atraso:</Text>
            <Text style={styles.footerValueAlert}>
              R$ {valorTotalGeral.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.emissaoInfo}>
            Emitido em: {dataEmissao} às {horaEmissao}
          </Text>
        </View>

        {/* Rodapé da página */}
        <View style={styles.rodape}>
          <Text>Relatório gerado pela Plataforma EAD ITEC</Text>
        </View>
      </Page>
    </Document>
  );
}
