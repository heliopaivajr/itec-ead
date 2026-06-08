import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Turma } from '@/services/turmas.service';
import type { AlunoTurmaRelatorio } from '@/services/relatorios.service';

export interface R01_PDFProps {
  turma: Turma;
  alunos: AlunoTurmaRelatorio[];
  status: string;
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
  turmaInfo: {
    fontSize: 10,
    color: '#333',
    marginBottom: 2,
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
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    padding: 6,
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#f5f5f5',
  },
  col1: { width: '6%' },   // #
  col2: { width: '15%' },  // Código ITEC
  col3: { width: '30%' },  // Nome
  col4: { width: '18%' },  // Telefone
  col5: { width: '15%' },  // Status
  col6: { width: '16%' },  // Data
  footer: {
    marginTop: 16,
    paddingTop: 8,
    borderTop: 1,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#666',
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

export function R01_PDF({ turma, alunos, status }: R01_PDFProps) {
  const dataEmissao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaEmissao = new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const filtroTexto = status === 'todos' ? 'Todos os status' : `Status: ${status}`;

  return (
    <Document
      title={`R01 - Alunos por Turma - ${turma.codigo}`}
      author="ITEC - Instituto de Teologia Cristã"
    >
      <Page size="A4" style={styles.page}>
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
          <Text style={styles.relatorioTitulo}>R01 — Alunos por Turma</Text>
          <Text style={styles.turmaInfo}>
            Turma: {turma.codigo} — {turma.nome}
          </Text>
          <Text style={styles.turmaInfo}>
            Período: {formatarData(turma.data_inicio)} a{' '}
            {turma.data_fim ? formatarData(turma.data_fim) : 'em andamento'}
          </Text>
          <Text style={styles.filtroInfo}>Filtro: {filtroTexto}</Text>
        </View>

        {/* Tabela */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>#</Text>
            <Text style={styles.col2}>Cód. ITEC</Text>
            <Text style={styles.col3}>Nome Completo</Text>
            <Text style={styles.col4}>Telefone</Text>
            <Text style={styles.col5}>Status</Text>
            <Text style={styles.col6}>Data Matrícula</Text>
          </View>

          {/* Rows */}
          {alunos.map((aluno, index) => (
            <View
              key={aluno.aluno_id}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={styles.col1}>{index + 1}</Text>
              <Text style={styles.col2}>{aluno.codigo_itec || '—'}</Text>
              <Text style={styles.col3}>{aluno.nome_completo}</Text>
              <Text style={styles.col4}>{formatarTelefone(aluno.telefone)}</Text>
              <Text style={styles.col5}>{aluno.status_matricula}</Text>
              <Text style={styles.col6}>{formatarData(aluno.data_matricula)}</Text>
            </View>
          ))}
        </View>

        {/* Footer com total */}
        <View style={styles.footer}>
          <Text>Total: {alunos.length} aluno(s) matriculado(s)</Text>
          <Text>
            Emitido em: {dataEmissao} às {horaEmissao}
          </Text>
        </View>

        {/* Rodapé da página */}
        <View style={styles.rodape}>
          <Text>
            Relatório gerado pela Plataforma EAD ITEC — Documento sem validade jurídica
          </Text>
        </View>
      </Page>
    </Document>
  );
}
