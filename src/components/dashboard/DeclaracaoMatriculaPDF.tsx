import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface DeclaracaoProps {
  aluno: {
    full_name: string;
    cpf?: string | null;
    codigo_itec?: string | null;
  };
  matricula: {
    turma_nome: string;
    curso_nome: string;
    data_inicio?: string | null;
  };
}

const s = StyleSheet.create({
  page:       { padding: 56, fontFamily: 'Helvetica', fontSize: 11, color: '#1a1a1a' },
  cabTitle:   { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  cabSub:     { fontSize: 10, textAlign: 'center', color: '#555', marginBottom: 4 },
  divider:    { borderBottom: 1, borderBottomColor: '#ccc', marginVertical: 20 },
  secLabel:   { fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  corpo:      { lineHeight: 1.8, marginBottom: 16, textAlign: 'justify' },
  matriculaRow: { flexDirection: 'row', gap: 6, marginBottom: 24 },
  matriculaLabel: { fontSize: 9, color: '#888' },
  matriculaVal:   { fontWeight: 'bold' },
  dataLocal:  { marginBottom: 32 },
  assinRow:   { flexDirection: 'row', justifyContent: 'space-around', marginTop: 48 },
  assinBox:   { width: '40%', alignItems: 'center' },
  assinLinha: { borderTop: 1, borderTopColor: '#333', width: '100%', marginBottom: 6 },
  assinLabel: { fontSize: 9, color: '#555', textAlign: 'center' },
  rodape:     { position: 'absolute', bottom: 32, left: 56, right: 56,
                borderTop: 1, borderTopColor: '#eee', paddingTop: 8,
                fontSize: 8, color: '#aaa', textAlign: 'center' },
});

function fmtData(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR');
}

function dataExtenso(): string {
  return new Date().toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function DeclaracaoMatriculaPDF({ aluno, matricula }: DeclaracaoProps) {
  const cpfFormatado = aluno.cpf
    ? aluno.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    : 'não informado';

  return (
    <Document title={`Declaração de Matrícula — ${aluno.full_name}`}>
      <Page size="A4" style={s.page}>

        {/* Cabeçalho */}
        <Text style={s.cabTitle}>INSTITUTO DE TEOLOGIA CRISTÃ — ITEC</Text>
        <Text style={s.cabSub}>Janga, Paulista/PE · www.itecedu.com</Text>
        <View style={s.divider} />

        {/* Título do documento */}
        <View style={{ marginBottom: 20, alignItems: 'center' }}>
          <Text style={s.secLabel}>DECLARAÇÃO DE MATRÍCULA</Text>
        </View>

        {/* Corpo */}
        <Text style={s.corpo}>
          Declaramos, para os devidos fins, que{' '}
          <Text style={{ fontWeight: 'bold' }}>{aluno.full_name}</Text>,
          portador(a) do CPF {cpfFormatado},
          está regularmente matriculado(a) no curso de{' '}
          <Text style={{ fontWeight: 'bold' }}>{matricula.curso_nome}</Text>,
          turma <Text style={{ fontWeight: 'bold' }}>{matricula.turma_nome}</Text>,
          com início em {fmtData(matricula.data_inicio)},
          no Instituto de Teologia Cristã — ITEC, unidade Janga, Paulista/PE.
        </Text>

        {/* Número de matrícula */}
        <View style={s.matriculaRow}>
          <View>
            <Text style={s.matriculaLabel}>Matrícula nº</Text>
            <Text style={s.matriculaVal}>{aluno.codigo_itec ?? '—'}</Text>
          </View>
        </View>

        {/* Data e local */}
        <View style={s.dataLocal}>
          <Text>Paulista/PE, {dataExtenso()}.</Text>
        </View>

        {/* Assinaturas */}
        <View style={s.assinRow}>
          <View style={s.assinBox}>
            <View style={s.assinLinha} />
            <Text style={s.assinLabel}>Diretor(a) / Coordenador(a)</Text>
          </View>
          <View style={s.assinBox}>
            <View style={s.assinLinha} />
            <Text style={s.assinLabel}>Secretaria</Text>
          </View>
        </View>

        {/* Rodapé */}
        <Text style={s.rodape}>
          itecedu.com · Validade: 90 dias a partir da emissão
        </Text>
      </Page>
    </Document>
  );
}
