import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Professor } from '@/services/professor.service';
import type { Disciplina } from '@/services/academico.service';

interface ContratoPDFProps {
  professor: Professor;
  disciplina: Disciplina;
  dados: Record<string, string>;
}

const s = StyleSheet.create({
  page:       { padding: 48, fontFamily: 'Helvetica', fontSize: 11 },
  titulo:     { fontSize: 14, textAlign: 'center', marginBottom: 6, fontWeight: 'bold' },
  subtitulo:  { fontSize: 11, textAlign: 'center', marginBottom: 24, color: '#555' },
  secaoLabel: { fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  linha:      { marginBottom: 6 },
  divider:    { borderBottom: 1, borderBottomColor: '#ddd', marginVertical: 14 },
  clausula:   { marginBottom: 8, lineHeight: 1.5 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginTop: 48 },
  assinatura: { width: '44%', borderTop: 1, borderTopColor: '#333', paddingTop: 8 },
  assinLabel: { fontSize: 9, color: '#555' },
});

export function ContratoPDF({ professor, disciplina, dados }: ContratoPDFProps) {
  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const cargaTotal = disciplina.carga_horaria_presencial + disciplina.carga_horaria_ead;

  return (
    <Document title={`Contrato — ${dados.nome_completo ?? professor.nome_completo} — ${disciplina.codigo}`}>
      <Page size="A4" style={s.page}>

        {/* Cabeçalho */}
        <Text style={s.titulo}>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DOCENTES</Text>
        <Text style={s.subtitulo}>ITEC — Instituto de Teologia Cristã · Janga, Paulista/PE</Text>
        <View style={s.divider} />

        {/* Disciplina */}
        <View style={{ marginBottom: 14 }}>
          <Text style={s.secaoLabel}>Disciplina</Text>
          <Text style={s.linha}>{disciplina.codigo} — {disciplina.nome}</Text>
          <Text style={s.linha}>
            Carga horária: {cargaTotal}h total ({disciplina.carga_horaria_presencial}h presencial + {disciplina.carga_horaria_ead}h EAD)
          </Text>
          <Text style={s.linha}>Créditos: {disciplina.creditos}</Text>
        </View>
        <View style={s.divider} />

        {/* Professor */}
        <View style={{ marginBottom: 14 }}>
          <Text style={s.secaoLabel}>Professor(a) contratado(a)</Text>
          <Text style={s.linha}>Nome: {dados.nome_completo ?? professor.nome_completo}</Text>
          <Text style={s.linha}>CPF: {dados.cpf ?? professor.cpf}</Text>
          {(dados.rg ?? professor.rg) && <Text style={s.linha}>RG: {dados.rg ?? professor.rg}</Text>}
          {dados.data_nascimento && <Text style={s.linha}>Data de nascimento: {dados.data_nascimento}</Text>}
          {(dados.endereco ?? professor.endereco) && <Text style={s.linha}>Endereço: {dados.endereco ?? professor.endereco}</Text>}
          {(dados.telefone ?? professor.telefone) && <Text style={s.linha}>Telefone: {dados.telefone ?? professor.telefone}</Text>}
          {(dados.formacao ?? professor.formacao) && <Text style={s.linha}>Formação: {dados.formacao ?? professor.formacao}</Text>}
          {(dados.titulacao ?? professor.titulacao) && <Text style={s.linha}>Titulação: {dados.titulacao ?? professor.titulacao}</Text>}
          {(dados.igreja_local ?? professor.igreja_local) && <Text style={s.linha}>Igreja local: {dados.igreja_local ?? professor.igreja_local}</Text>}
        </View>
        <View style={s.divider} />

        {/* Cláusulas */}
        <View style={{ marginBottom: 14 }}>
          <Text style={s.secaoLabel}>Cláusulas</Text>
          <Text style={s.clausula}>
            1. O(A) professor(a) compromete-se a ministrar as aulas conforme calendário estabelecido pela coordenação acadêmica do ITEC, cumprindo integralmente a carga horária da disciplina.
          </Text>
          <Text style={s.clausula}>
            2. O(A) professor(a) declara ter lido e concordar com o Manual da Disciplina disponibilizado pelo ITEC, seguindo as diretrizes pedagógicas e avaliativas nele estabelecidas.
          </Text>
          <Text style={s.clausula}>
            3. O(A) professor(a) compromete-se a lançar a frequência dos alunos no sistema dentro de 48 horas após cada aula, garantindo a precisão dos registros acadêmicos.
          </Text>
          <Text style={s.clausula}>
            4. Este contrato é válido pelo período letivo da disciplina acima identificada, encerrando-se automaticamente ao término do módulo correspondente.
          </Text>
          <Text style={s.clausula}>
            5. O ITEC reserva-se o direito de encerrar este contrato em caso de descumprimento reiterado das obrigações aqui estabelecidas, após notificação prévia.
          </Text>
        </View>
        <View style={s.divider} />

        {/* Data e assinaturas */}
        <Text style={[s.linha, { marginBottom: 0 }]}>
          Paulista/PE, {dataHoje}
        </Text>

        <View style={s.row}>
          <View style={s.assinatura}>
            <Text style={s.assinLabel}>Professor(a)</Text>
            <Text style={s.assinLabel}>{dados.nome_completo ?? professor.nome_completo}</Text>
          </View>
          <View style={s.assinatura}>
            <Text style={s.assinLabel}>ITEC — Direção Acadêmica</Text>
            <Text style={s.assinLabel}>Pr. Hélio Paiva Jr.</Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}
