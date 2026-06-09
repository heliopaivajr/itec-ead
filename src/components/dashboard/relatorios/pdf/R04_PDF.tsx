import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Turma } from '@/services/turmas.service';
import type { SituacaoFinanceiraRelatorio } from '@/services/relatorios.service';

export interface R04_PDFProps {
  alunos: SituacaoFinanceiraRelatorio[];
  turma?: Turma | null;
  statusFiltro?: string;
}

const TIPO_FINANCIAMENTO_LABEL: Record<string, string> = {
  integral: 'Integral',
  bolsista: 'Bolsista',
  desconto_indicacao: 'Desc. Indicação',
  desconto_familia: 'Desc. Família',
};

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
    fontSize: 7,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    padding: 6,
    fontSize: 7,
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5',
  },
  tableRowIsento: {
    backgroundColor: '#e3f2fd',
  },
  tableRowAtrasado: {
    backgroundColor: '#ffebee',
  },
  col1: { width: '5%' },   // #
  col2: { width: '20%' },  // Nome
  col3: { width: '15%' },  // Turma
  col4: { width: '12%' },  // Tipo Financ.
  col5: { width: '7%', textAlign: 'right' },  // Desc. %
  col6: { width: '7%', textAlign: 'right' },  // Pagas
  col7: { width: '7%', textAlign: 'right' },  // Pendentes
  col8: { width: '14%', textAlign: 'right' },  // Valor Aberto
  col9: { width: '13%' },  // Status
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
  footerValueWarning: {
    fontWeight: 'bold',
    color: '#f57c00',
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

export function R04_PDF({ alunos, turma, statusFiltro }: R04_PDFProps) {
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
  const totalAlunos = alunos.length;
  const valorTotalEmAberto = alunos.reduce((sum, a) => sum + a.valor_em_aberto, 0);

  // Texto do filtro
  const filtroTexto = [];
  if (turma) {
    filtroTexto.push(`Turma: ${turma.codigo} — ${turma.nome}`);
  } else {
    filtroTexto.push('Turma: Todas');
  }
  if (statusFiltro && statusFiltro !== 'todos') {
    const statusLabel: Record<string, string> = {
      em_dia: 'Em dia',
      atrasado: 'Atrasado',
      isento: 'Isento (Bolsista/Desconto)',
    };
    filtroTexto.push(`Status: ${statusLabel[statusFiltro] || statusFiltro}`);
  }

  return (
    <Document
      title="R04 - Situação Financeira dos Alunos"
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
          <Text style={styles.relatorioTitulo}>R04 — Situação Financeira dos Alunos</Text>
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
            <Text style={styles.col4}>Tipo Financ.</Text>
            <Text style={styles.col5}>Desc.%</Text>
            <Text style={styles.col6}>Pagas</Text>
            <Text style={styles.col7}>Pend.</Text>
            <Text style={styles.col8}>Valor Aberto</Text>
            <Text style={styles.col9}>Status</Text>
          </View>

          {/* Rows */}
          {alunos.map((aluno, index) => {
            let rowStyle = [styles.tableRow];

            // Aplicar cor de fundo baseado no status
            if (aluno.status_geral === 'isento') {
              rowStyle.push(styles.tableRowIsento);
            } else if (aluno.status_geral === 'atrasado') {
              rowStyle.push(styles.tableRowAtrasado);
            } else if (index % 2 === 1) {
              rowStyle.push(styles.tableRowAlt);
            }

            return (
              <View key={aluno.aluno_id} style={rowStyle}>
                <Text style={styles.col1}>{index + 1}</Text>
                <Text style={styles.col2}>{aluno.nome_aluno}</Text>
                <Text style={styles.col3}>{aluno.turma}</Text>
                <Text style={styles.col4}>
                  {TIPO_FINANCIAMENTO_LABEL[aluno.tipo_financiamento]}
                </Text>
                <Text style={styles.col5}>
                  {aluno.percentual_desconto > 0 ? `${aluno.percentual_desconto}%` : '—'}
                </Text>
                <Text style={styles.col6}>{aluno.mensalidades_pagas}</Text>
                <Text style={styles.col7}>{aluno.mensalidades_pendentes}</Text>
                <Text style={styles.col8}>
                  R$ {aluno.valor_em_aberto.toFixed(2)}
                </Text>
                <Text style={styles.col9}>
                  {aluno.status_geral === 'em_dia' && 'Em dia'}
                  {aluno.status_geral === 'atrasado' && 'Atrasado'}
                  {aluno.status_geral === 'isento' && 'Isento'}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Footer com totalizadores */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total de alunos:</Text>
            <Text style={styles.footerValue}>{totalAlunos}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Valor total em aberto:</Text>
            <Text style={styles.footerValueWarning}>
              R$ {valorTotalEmAberto.toFixed(2)}
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
