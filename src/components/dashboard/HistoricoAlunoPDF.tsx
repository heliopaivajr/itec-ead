import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { HistoricoAluno } from '@/services/academico.service';
import { STATUS_DISCIPLINA_LABEL } from '@/components/dashboard/StatusDisciplinaBadge';

export interface HistoricoAlunoPDFProps {
  aluno: { full_name: string; numero_matricula?: string | null; codigo_itec?: string | null };
  curso_nome: string;
  historico: HistoricoAluno;
}

const NAVY = '#1F3864';
const GOLD = '#BF9000';

const s = StyleSheet.create({
  page:      { padding: 48, fontFamily: 'Helvetica', fontSize: 10, color: '#1a1a1a' },
  cabTitle:  { fontSize: 14, fontWeight: 'bold', textAlign: 'center', color: NAVY },
  cabSub:    { fontSize: 9, textAlign: 'center', color: '#555', marginBottom: 4 },
  docTitle:  { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: GOLD, letterSpacing: 1, marginTop: 10, marginBottom: 12 },
  divider:   { borderBottom: 1, borderBottomColor: '#ccc', marginVertical: 10 },
  idRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  idLabel:   { fontSize: 8, color: '#888' },
  idVal:     { fontSize: 10, fontWeight: 'bold' },
  modTitle:  { fontSize: 10, fontWeight: 'bold', color: NAVY, marginTop: 12, marginBottom: 4 },
  trHead:    { flexDirection: 'row', backgroundColor: '#f2f2f2', borderBottom: 1, borderBottomColor: '#ccc', paddingVertical: 3 },
  tr:        { flexDirection: 'row', borderBottom: 0.5, borderBottomColor: '#eee', paddingVertical: 3 },
  cDisc:     { width: '55%', paddingHorizontal: 4 },
  cNota:     { width: '13%', paddingHorizontal: 4, textAlign: 'center' },
  cSit:      { width: '20%', paddingHorizontal: 4 },
  cFreq:     { width: '12%', paddingHorizontal: 4, textAlign: 'center' },
  th:        { fontSize: 8, color: '#555', fontWeight: 'bold' },
  rodapeBox: { marginTop: 16, borderTop: 1, borderTopColor: '#ccc', paddingTop: 8, flexDirection: 'row', gap: 16 },
  rodape:    { position: 'absolute', bottom: 28, left: 48, right: 48, borderTop: 1, borderTopColor: '#eee', paddingTop: 6, fontSize: 8, color: '#aaa', textAlign: 'center' },
});

function n(v: number | null | undefined) { return v === null || v === undefined ? '—' : Number(v).toFixed(1); }

export function HistoricoAlunoPDF({ aluno, curso_nome, historico }: HistoricoAlunoPDFProps) {
  return (
    <Document title={`Histórico Acadêmico — ${aluno.full_name}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.cabTitle}>INSTITUTO DE TEOLOGIA CRISTÃ — ITEC</Text>
        <Text style={s.cabSub}>Janga, Paulista/PE · www.itecedu.com</Text>
        <Text style={s.docTitle}>HISTÓRICO ACADÊMICO</Text>

        <View style={s.idRow}>
          <View>
            <Text style={s.idLabel}>Aluno(a)</Text>
            <Text style={s.idVal}>{aluno.full_name}</Text>
          </View>
          <View>
            <Text style={s.idLabel}>Nº de matrícula</Text>
            <Text style={s.idVal}>{aluno.numero_matricula ?? aluno.codigo_itec ?? '—'}</Text>
          </View>
          <View>
            <Text style={s.idLabel}>Curso</Text>
            <Text style={s.idVal}>{curso_nome}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {historico.modulos.length === 0 ? (
          <Text style={{ color: '#888' }}>Nenhuma disciplina lançada.</Text>
        ) : historico.modulos.map(mod => (
          <View key={mod.id} wrap={false}>
            <Text style={s.modTitle}>{mod.ordem}º Módulo — {mod.nome}</Text>
            <View style={s.trHead}>
              <Text style={[s.cDisc, s.th]}>Disciplina</Text>
              <Text style={[s.cNota, s.th]}>Nota</Text>
              <Text style={[s.cSit, s.th]}>Situação</Text>
              <Text style={[s.cFreq, s.th]}>Freq.</Text>
            </View>
            {mod.disciplinas.map(d => (
              <View key={d.id} style={s.tr}>
                <Text style={s.cDisc}>{d.nome}</Text>
                <Text style={s.cNota}>{n(d.notas.media_final)}</Text>
                <Text style={s.cSit}>{d.status_disciplina ? STATUS_DISCIPLINA_LABEL[d.status_disciplina] : '—'}</Text>
                <Text style={s.cFreq}>{d.frequencia.percentual}%</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={s.rodapeBox}>
          <Text>Média geral: <Text style={{ fontWeight: 'bold' }}>{n(historico.media_geral)}</Text></Text>
          <Text>Créditos concluídos: <Text style={{ fontWeight: 'bold' }}>{historico.creditos_aprovados ?? 0}</Text></Text>
          <Text>Disciplinas aprovadas: <Text style={{ fontWeight: 'bold' }}>{historico.disciplinas_aprovadas}</Text></Text>
        </View>

        <Text style={s.rodape}>itecedu.com · Documento informativo (não substitui o histórico oficial assinado)</Text>
      </Page>
    </Document>
  );
}
