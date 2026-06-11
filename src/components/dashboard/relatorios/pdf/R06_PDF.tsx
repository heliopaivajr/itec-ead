import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { R06_HistoricoAcademicoRelatorio } from '@/services/relatorios.service';
import type { StatusHistorico } from '@/services/academico.service';

export interface R06_PDFProps {
  dados: R06_HistoricoAcademicoRelatorio;
}

const STATUS_LABEL: Record<StatusHistorico, string> = {
  aprovado_direto: 'Aprovado',
  recuperacao: 'Recuperação',
  reprovado_nota: 'Rep. Nota',
  reprovado_falta: 'Rep. Falta',
  em_andamento: 'Cursando',
  pendente: 'Pendente',
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
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
    marginBottom: 12,
  },
  dadosPessoais: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  dadosHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dadosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  dadosItem: {
    width: '48%',
    marginBottom: 6,
  },
  dadosLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 2,
  },
  dadosValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  moduloSection: {
    marginBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  moduloHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 8,
    marginBottom: 6,
    borderRadius: 3,
  },
  moduloNome: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  moduloInfo: {
    flexDirection: 'row',
    gap: 12,
    fontSize: 8,
  },
  moduloMedia: {
    color: '#666',
  },
  moduloStatus: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9f9f9',
    padding: 4,
    borderBottom: 1,
    borderBottomColor: '#ddd',
    fontSize: 7,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: 0.5,
    borderBottomColor: '#f0f0f0',
    fontSize: 8,
  },
  colDisciplina: {
    width: '28%',
  },
  colCH: {
    width: '8%',
    textAlign: 'center',
  },
  colCred: {
    width: '8%',
    textAlign: 'center',
  },
  colNota: {
    width: '7%',
    textAlign: 'center',
  },
  colMedia: {
    width: '8%',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  colFreq: {
    width: '8%',
    textAlign: 'center',
  },
  colStatus: {
    width: '12%',
    textAlign: 'center',
    fontSize: 7,
  },
  resumo: {
    marginTop: 16,
    paddingTop: 12,
    borderTop: 2,
    borderTopColor: '#1F3864',
  },
  resumoTitulo: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  resumoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  resumoCard: {
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 3,
    width: '23%',
    textAlign: 'center',
  },
  resumoLabel: {
    fontSize: 7,
    color: '#666',
    marginBottom: 4,
  },
  resumoValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  resumoDisciplinas: {
    fontSize: 7,
    marginTop: 4,
  },
  emissaoInfo: {
    marginTop: 12,
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

export function R06_PDF({ dados }: R06_PDFProps) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Document
      title={`Histórico Acadêmico - ${dados.dados_pessoais.nome_completo}`}
      author="ITEC - Instituto de Teologia Cristã"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Cabeçalho ITEC */}
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
          <Text style={styles.relatorioTitulo}>Histórico Acadêmico</Text>
        </View>

        {/* Dados Pessoais */}
        <View style={styles.dadosPessoais}>
          <Text style={styles.dadosHeader}>Dados Pessoais</Text>
          <View style={styles.dadosGrid}>
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>Nome Completo</Text>
              <Text style={styles.dadosValue}>{dados.dados_pessoais.nome_completo}</Text>
            </View>
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>Código ITEC</Text>
              <Text style={styles.dadosValue}>
                {dados.dados_pessoais.codigo_itec || '—'}
              </Text>
            </View>
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>CPF</Text>
              <Text style={styles.dadosValue}>{dados.dados_pessoais.cpf || '—'}</Text>
            </View>
            <View style={styles.dadosItem}>
              <Text style={styles.dadosLabel}>Turma</Text>
              <Text style={styles.dadosValue}>
                {dados.dados_pessoais.turma_codigo} — {dados.dados_pessoais.turma_nome}
              </Text>
            </View>
          </View>
        </View>

        {/* Módulos e Disciplinas */}
        {dados.historico.modulos.map((modulo) => (
          <View key={modulo.id} style={styles.moduloSection} wrap={false}>
            {/* Header do módulo */}
            <View style={styles.moduloHeader}>
              <Text style={styles.moduloNome}>{modulo.nome}</Text>
              <View style={styles.moduloInfo}>
                <Text style={styles.moduloMedia}>
                  Média:{' '}
                  {modulo.media_modulo !== null ? modulo.media_modulo.toFixed(1) : '—'}
                </Text>
                <Text style={styles.moduloStatus}>
                  {modulo.status_modulo === 'aprovado'
                    ? 'Aprovado'
                    : modulo.status_modulo === 'em_andamento'
                    ? 'Em Andamento'
                    : 'Pendente'}
                </Text>
              </View>
            </View>

            {/* Tabela de disciplinas */}
            <View style={styles.tableHeader}>
              <Text style={styles.colDisciplina}>Disciplina</Text>
              <Text style={styles.colCH}>C.H.</Text>
              <Text style={styles.colCred}>Créd.</Text>
              <Text style={styles.colNota}>N1</Text>
              <Text style={styles.colNota}>N2</Text>
              <Text style={styles.colNota}>Rec.</Text>
              <Text style={styles.colMedia}>Média</Text>
              <Text style={styles.colFreq}>Freq.%</Text>
              <Text style={styles.colStatus}>Status</Text>
            </View>

            {modulo.disciplinas.map((disc) => (
              <View key={disc.id} style={styles.tableRow}>
                <Text style={styles.colDisciplina}>{disc.nome}</Text>
                <Text style={styles.colCH}>{disc.carga_horaria}</Text>
                <Text style={styles.colCred}>{disc.creditos}</Text>
                <Text style={styles.colNota}>
                  {disc.notas.n1 !== null ? disc.notas.n1.toFixed(1) : '—'}
                </Text>
                <Text style={styles.colNota}>
                  {disc.notas.n2 !== null ? disc.notas.n2.toFixed(1) : '—'}
                </Text>
                <Text style={styles.colNota}>
                  {disc.notas.recuperacao !== null
                    ? disc.notas.recuperacao.toFixed(1)
                    : '—'}
                </Text>
                <Text style={styles.colMedia}>
                  {disc.notas.media_final !== null
                    ? disc.notas.media_final.toFixed(1)
                    : '—'}
                </Text>
                <Text style={styles.colFreq}>{disc.frequencia.percentual.toFixed(0)}%</Text>
                <Text style={styles.colStatus}>{STATUS_LABEL[disc.status]}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Resumo Final */}
        <View style={styles.resumo}>
          <Text style={styles.resumoTitulo}>Resumo Acadêmico</Text>
          <View style={styles.resumoGrid}>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Total C.H.</Text>
              <Text style={styles.resumoValue}>
                {dados.historico.total_carga_horaria}h
              </Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Total Créditos</Text>
              <Text style={styles.resumoValue}>{dados.historico.total_creditos}</Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Média Geral</Text>
              <Text style={styles.resumoValue}>
                {dados.historico.media_geral !== null
                  ? dados.historico.media_geral.toFixed(1)
                  : '—'}
              </Text>
            </View>
            <View style={styles.resumoCard}>
              <Text style={styles.resumoLabel}>Disciplinas</Text>
              <Text style={styles.resumoDisciplinas}>
                {dados.historico.disciplinas_aprovadas} aprov. ·{' '}
                {dados.historico.disciplinas_reprovadas} reprov. ·{' '}
                {dados.historico.disciplinas_em_andamento} cursando
              </Text>
            </View>
          </View>
        </View>

        {/* Data de emissão */}
        <Text style={styles.emissaoInfo}>
          Emitido em: {dataEmissao} às {horaEmissao}
        </Text>

        {/* Rodapé */}
        <View style={styles.rodape}>
          <Text>Documento gerado pela Plataforma EAD ITEC</Text>
        </View>
      </Page>
    </Document>
  );
}
