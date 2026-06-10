import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { DisciplinasPorAlunoRelatorio } from '@/services/relatorios.service';
import type { Turma } from '@/services/turmas.service';

export interface R03_PDFProps {
  dados: DisciplinasPorAlunoRelatorio[];
  turma?: Turma | null;
  statusFiltro?: string;
}

const STATUS_LABEL: Record<string, string> = {
  cursando: 'Cursando',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  reprovado_falta: 'Rep. Falta',
  convalidado: 'Convalidado',
  trancado: 'Trancado',
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
    marginBottom: 4,
  },
  filtroInfo: {
    fontSize: 8,
    color: '#666',
    marginBottom: 12,
  },
  alunoSection: {
    marginBottom: 12,
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 8,
  },
  alunoHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    padding: 6,
    marginBottom: 4,
    borderRadius: 3,
  },
  alunoNome: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  alunoTurma: {
    width: '15%',
    fontSize: 8,
    color: '#666',
  },
  alunoTotal: {
    width: '10%',
    textAlign: 'center',
    fontSize: 8,
  },
  disciplinaRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingLeft: 12,
    borderBottom: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  discCodigo: {
    width: '12%',
    fontSize: 7,
    color: '#666',
    fontFamily: 'Courier',
  },
  discNome: {
    flex: 1,
    fontSize: 8,
  },
  discStatus: {
    width: '15%',
    fontSize: 7,
    textAlign: 'center',
  },
  discNota: {
    width: '10%',
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
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

export function R03_PDF({ dados, turma, statusFiltro }: R03_PDFProps) {
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
  const totalAlunos = dados.length;
  const totalDisciplinas = dados.reduce((sum, a) => sum + a.disciplinas.length, 0);

  // Texto do filtro
  const filtroTexto = [];
  if (turma) {
    filtroTexto.push(`Turma: ${turma.codigo} — ${turma.nome}`);
  } else {
    filtroTexto.push('Turma: Todas');
  }
  if (statusFiltro && statusFiltro !== 'todos') {
    const statusLabel: Record<string, string> = {
      cursando: 'Cursando',
      aprovado: 'Aprovado',
      reprovado: 'Reprovado',
    };
    filtroTexto.push(`Status: ${statusLabel[statusFiltro] || statusFiltro}`);
  }

  return (
    <Document
      title="R03 - Disciplinas por Aluno"
      author="ITEC - Instituto de Teologia Cristã"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
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
          <Text style={styles.relatorioTitulo}>R03 — Disciplinas por Aluno</Text>
          {filtroTexto.length > 0 && (
            <Text style={styles.filtroInfo}>Filtros: {filtroTexto.join(' · ')}</Text>
          )}
        </View>

        {/* Alunos e disciplinas */}
        {dados.map((aluno, index) => (
          <View key={aluno.aluno_id} style={styles.alunoSection} wrap={false}>
            {/* Header do aluno */}
            <View style={styles.alunoHeader}>
              <Text style={styles.alunoNome}>
                {aluno.nome_aluno}
                {aluno.codigo_itec && ` (${aluno.codigo_itec})`}
              </Text>
              <Text style={styles.alunoTurma}>
                {aluno.turma.codigo}
              </Text>
              <Text style={styles.alunoTotal}>C: {aluno.totais.cursando}</Text>
              <Text style={styles.alunoTotal}>A: {aluno.totais.aprovadas}</Text>
              <Text style={styles.alunoTotal}>R: {aluno.totais.reprovadas}</Text>
              <Text style={styles.alunoTotal}>V: {aluno.totais.convalidadas}</Text>
            </View>

            {/* Disciplinas do aluno */}
            {aluno.disciplinas.map((disc) => (
              <View key={disc.disciplina_id} style={styles.disciplinaRow}>
                <Text style={styles.discCodigo}>{disc.codigo}</Text>
                <Text style={styles.discNome}>{disc.nome}</Text>
                <Text style={styles.discStatus}>
                  {STATUS_LABEL[disc.status] || disc.status}
                </Text>
                <Text style={styles.discNota}>
                  {disc.nota !== null ? disc.nota.toFixed(2) : '—'}
                </Text>
              </View>
            ))}
          </View>
        ))}

        {/* Footer com totalizadores */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total de alunos:</Text>
            <Text style={styles.footerValue}>{totalAlunos}</Text>
          </View>
          <View style={styles.footerRow}>
            <Text style={styles.footerLabel}>Total de disciplinas:</Text>
            <Text style={styles.footerValue}>{totalDisciplinas}</Text>
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
