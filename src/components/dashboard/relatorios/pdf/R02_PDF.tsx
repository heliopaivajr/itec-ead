import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { ListaPresencaRelatorio } from '@/services/relatorios.service';

export interface R02_PDFProps {
  dados: ListaPresencaRelatorio;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#000000',
  },
  header: {
    marginBottom: 15,
    paddingBottom: 10,
    borderBottom: 2,
    borderBottomColor: '#1F3864',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  logo: {
    width: 35,
    height: 35,
  },
  headerText: {
    flex: 1,
  },
  titulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F3864',
    marginBottom: 2,
  },
  subtitulo: {
    fontSize: 8,
    color: '#666',
  },
  relatorioTitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  infoLine: {
    fontSize: 8,
    color: '#333',
    marginBottom: 2,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1F3864',
    color: '#ffffff',
    padding: 5,
    fontWeight: 'bold',
    fontSize: 7,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    padding: 4,
    fontSize: 7,
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5',
  },
  // Colunas fixas
  colNum: { width: '4%', textAlign: 'center' },
  colNome: { width: '20%' },
  colCod: { width: '8%', textAlign: 'center' },
  // Coluna de data (dinâmica)
  colData: { width: '5%', textAlign: 'center' },
  // Resumo
  colResumo: { width: '5%', textAlign: 'center' },
  // Status colors
  statusP: { color: '#22c55e', fontWeight: 'bold' },
  statusF: { color: '#ef4444', fontWeight: 'bold' },
  statusNull: { color: '#999' },
  footer: {
    marginTop: 15,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: '#ccc',
    fontSize: 7,
    color: '#666',
  },
  legenda: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 6,
  },
  legendaItem: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  emissaoInfo: {
    fontSize: 7,
    color: '#999',
    textAlign: 'right',
  },
  rodape: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 6,
  },
});

function formatarData(dataISO: string): string {
  return new Date(dataISO).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function formatarDataCompleta(dataISO: string): string {
  return new Date(dataISO).toLocaleDateString('pt-BR');
}

export function R02_PDF({ dados }: R02_PDFProps) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Determinar orientação baseado no número de datas
  const orientation = dados.datas_aulas.length <= 8 ? 'portrait' : 'landscape';

  // Calcular largura dinâmica das colunas de data
  const numDatas = dados.datas_aulas.length;
  const espacoDisponivel = orientation === 'portrait' ? 68 : 87; // % após colunas fixas + resumo
  const larguraData = numDatas > 0 ? Math.floor(espacoDisponivel / numDatas) : 5;

  const colDataDynamic = {
    width: `${larguraData}%`,
    textAlign: 'center' as const,
    fontSize: 6,
  };

  return (
    <Document
      title={`R02 - Lista de Presença - ${dados.turma.codigo}`}
      author="ITEC - Instituto de Teologia Cristã"
    >
      <Page size="A4" orientation={orientation} style={styles.page}>
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
        <View style={{ marginBottom: 10 }}>
          <Text style={styles.relatorioTitulo}>R02 — Lista de Presença</Text>
          <Text style={styles.infoLine}>
            Turma: {dados.turma.codigo} — {dados.turma.nome}
          </Text>
          <Text style={styles.infoLine}>Disciplina: {dados.disciplina.nome}</Text>
          <Text style={styles.infoLine}>
            Período: {formatarDataCompleta(dados.periodo.inicio)} a{' '}
            {formatarDataCompleta(dados.periodo.fim)}
          </Text>
        </View>

        {/* Tabela */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colNum}>#</Text>
            <Text style={styles.colNome}>Nome</Text>
            <Text style={styles.colCod}>Cód.</Text>
            {dados.datas_aulas.map((data, idx) => (
              <Text key={idx} style={colDataDynamic}>
                {formatarData(data)}
              </Text>
            ))}
            <Text style={styles.colResumo}>P</Text>
            <Text style={styles.colResumo}>F</Text>
            <Text style={styles.colResumo}>Total</Text>
            <Text style={styles.colResumo}>%</Text>
          </View>

          {/* Rows */}
          {dados.alunos.map((aluno, index) => (
            <View
              key={aluno.aluno_id}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={styles.colNum}>{index + 1}</Text>
              <Text style={styles.colNome}>{aluno.nome_aluno}</Text>
              <Text style={styles.colCod}>{aluno.codigo_itec || '—'}</Text>
              {aluno.presencas.map((p, idx) => {
                const statusStyle =
                  p.status === 'P'
                    ? styles.statusP
                    : p.status === 'F'
                    ? styles.statusF
                    : styles.statusNull;
                return (
                  <Text key={idx} style={[colDataDynamic, statusStyle]}>
                    {p.status || '—'}
                  </Text>
                );
              })}
              <Text style={styles.colResumo}>{aluno.resumo.presencas}</Text>
              <Text style={styles.colResumo}>{aluno.resumo.faltas}</Text>
              <Text style={styles.colResumo}>{aluno.resumo.total_aulas}</Text>
              <Text style={[styles.colResumo, { fontWeight: 'bold' }]}>
                {aluno.resumo.percentual}%
              </Text>
            </View>
          ))}
        </View>

        {/* Footer com legenda */}
        <View style={styles.footer}>
          <View style={styles.legenda}>
            <View style={styles.legendaItem}>
              <Text style={styles.statusP}>P</Text>
              <Text>= Presente</Text>
            </View>
            <View style={styles.legendaItem}>
              <Text style={styles.statusF}>F</Text>
              <Text>= Falta</Text>
            </View>
            <View style={styles.legendaItem}>
              <Text style={styles.statusNull}>—</Text>
              <Text>= Não lançado</Text>
            </View>
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
