import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { UserSquare, Loader2, FileText, ScrollText, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getTurmasAtivas, type Turma } from '@/services/turmas.service';
import { getAlunosDaTurma } from '@/services/relatorios.service';
import {
  getFichaAlunoInfo, getMensalidadesVw, type MensalidadeVw,
} from '@/services/financeiro.service';
import { getHistoricoAluno } from '@/services/academico.service';
import { getFichaAluno } from '@/services/ficha-aluno.service';
import { DossieAlunoPDF } from '@/components/dashboard/DossieAlunoPDF';
import { ExtratoFinanceiroPDF } from '@/components/dashboard/ExtratoFinanceiroPDF';
import { DeclaracaoMatriculaPDF } from '@/components/dashboard/DeclaracaoMatriculaPDF';
import { resumoExtrato } from '@/utils/extrato';
import type { DashboardContext } from '../Dashboard';

// Central de Relatórios (Fase A) — "por aluno": traz para a central os geradores
// que já existem (Dossiê 2i · Extrato 2g · Declaração), com seletor turma→aluno.
// Dossiê/Extrato são PII-free (staff+financeiro). Declaração tem CPF → só staff.

const STAFF = ['superadmin', 'admin', 'administracao'];

const HOJE = new Date().toISOString().split('T')[0];

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function RelatoriosPorAluno() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();
  const ehStaff = STAFF.includes(profile.role);

  const [turmas, setTurmas]   = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState('');
  const [alunos, setAlunos]   = useState<{ id: string; nome: string; codigo_itec: string | null }[]>([]);
  const [alunoId, setAlunoId] = useState('');
  const [gerando, setGerando] = useState<string | null>(null);

  useEffect(() => { getTurmasAtivas().then(setTurmas); }, []);

  const carregarAlunos = useCallback(async (tid: string) => {
    setAlunoId('');
    setAlunos(tid ? await getAlunosDaTurma(tid) : []);
  }, []);

  const alunoSel = alunos.find(a => a.id === alunoId);
  const nomeArq = (alunoSel?.nome ?? 'aluno').replace(/\s+/g, '-').toLowerCase();

  const gerarDossie = async () => {
    if (!alunoId) return;
    setGerando('dossie');
    try {
      const [info, ms, hist] = await Promise.all([
        getFichaAlunoInfo(alunoId), getMensalidadesVw(alunoId),
        turmaId ? getHistoricoAluno(alunoId, turmaId) : Promise.resolve(null),
      ]);
      if (!info) { toast({ title: 'Aluno não encontrado', variant: 'destructive' }); return; }
      const blob = await pdf(
        <DossieAlunoPDF
          aluno={{
            nome: info.nome, codigo_itec: info.codigo_itec, curso_nome: info.curso_nome,
            turma_nome: info.turma_nome, email: info.email, telefone: info.telefone,
            matricula_status: info.matricula_status, motivo_suspensao: info.motivo_suspensao,
            data_suspensao: info.data_suspensao,
          }}
          mensalidades={ms} historico={hist} emitidoPor={profile.full_name ?? 'Secretaria ITEC'}
        />,
      ).toBlob();
      baixar(blob, `dossie-${nomeArq}-${HOJE}.pdf`);
    } catch (e) { console.error('[gerarDossie]', e); toast({ title: 'Erro ao gerar dossiê', variant: 'destructive' }); }
    finally { setGerando(null); }
  };

  const gerarExtrato = async () => {
    if (!alunoId) return;
    setGerando('extrato');
    try {
      const [info, ms] = await Promise.all([getFichaAlunoInfo(alunoId), getMensalidadesVw(alunoId)]);
      if (!info) { toast({ title: 'Aluno não encontrado', variant: 'destructive' }); return; }
      const blob = await pdf(
        <ExtratoFinanceiroPDF
          aluno={{ nome: info.nome, codigo_itec: info.codigo_itec, curso_nome: info.curso_nome, turma_nome: info.turma_nome, email: info.email, telefone: info.telefone }}
          mensalidades={ms} resumo={resumoExtrato(ms)}
        />,
      ).toBlob();
      baixar(blob, `extrato-financeiro-${nomeArq}-${HOJE}.pdf`);
    } catch (e) { console.error('[gerarExtrato]', e); toast({ title: 'Erro ao gerar extrato', variant: 'destructive' }); }
    finally { setGerando(null); }
  };

  const gerarDeclaracao = async () => {
    if (!alunoId) return;
    setGerando('declaracao');
    try {
      const ficha = await getFichaAluno(alunoId);   // traz CPF (staff-only)
      const mat = ficha.matriculas.find(m => m.status === 'ativa' && m.turma_id) ?? ficha.matriculas.find(m => m.turma_id);
      if (!ficha.perfil || !mat) { toast({ title: 'Aluno sem matrícula ativa com turma', variant: 'destructive' }); return; }
      const turma = mat.turma as { nome?: string; codigo?: string; data_inicio?: string; cursos?: { nome?: string } } | undefined;
      const blob = await pdf(
        <DeclaracaoMatriculaPDF
          aluno={{ full_name: ficha.perfil.full_name, cpf: ficha.perfil.cpf, codigo_itec: ficha.perfil.codigo_itec }}
          matricula={{
            turma_nome: turma?.nome ?? turma?.codigo ?? '—',
            curso_nome: turma?.cursos?.nome ?? 'Graduação em Teologia Livre',
            data_inicio: mat.data_inicio ?? turma?.data_inicio,
          }}
        />,
      ).toBlob();
      baixar(blob, `declaracao-matricula-${nomeArq}.pdf`);
    } catch (e) { console.error('[gerarDeclaracao]', e); toast({ title: 'Erro ao gerar declaração', variant: 'destructive' }); }
    finally { setGerando(null); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <UserSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#1F3864] dark:text-primary">Relatórios por Aluno</h1>
          <p className="text-sm text-muted-foreground">Escolha a turma e o aluno, depois gere o documento.</p>
        </div>
      </div>

      {/* Seletores */}
      <div className="bg-card border border-border rounded-xl p-5 grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Turma</label>
          <select value={turmaId} onChange={e => { setTurmaId(e.target.value); carregarAlunos(e.target.value); }}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10">
            <option value="">Selecione…</option>
            {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Aluno</label>
          <select value={alunoId} onChange={e => setAlunoId(e.target.value)} disabled={!turmaId}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm h-10 disabled:opacity-50">
            <option value="">{turmaId ? 'Selecione…' : 'Escolha a turma primeiro'}</option>
            {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}{a.codigo_itec ? ` (${a.codigo_itec})` : ''}</option>)}
          </select>
        </div>
      </div>

      {/* Geradores */}
      <div className="grid sm:grid-cols-2 gap-3">
        <GeradorCard icon={<FileText className="h-5 w-5 text-[#BF9000]" />} titulo="Dossiê completo (PDF)"
          desc="Dados + financeiro + acadêmico num só documento (PII-free)."
          disabled={!alunoId || gerando !== null} loading={gerando === 'dossie'} onClick={gerarDossie} />
        <GeradorCard icon={<ScrollText className="h-5 w-5 text-[#1F3864] dark:text-primary" />} titulo="Extrato financeiro (PDF)"
          desc="Mensalidades pagas/em aberto + totais do aluno."
          disabled={!alunoId || gerando !== null} loading={gerando === 'extrato'} onClick={gerarExtrato} />
        {ehStaff && (
          <GeradorCard icon={<Award className="h-5 w-5 text-green-600" />} titulo="Declaração de matrícula (PDF)"
            desc="Documento oficial (com CPF) — matrícula ativa. Somente secretaria/coordenação."
            disabled={!alunoId || gerando !== null} loading={gerando === 'declaracao'} onClick={gerarDeclaracao} />
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Dossiê e extrato são PII-free (sem CPF/RG). A declaração é documento oficial com CPF e fica restrita à secretaria.
      </p>
    </div>
  );
}

function GeradorCard({ icon, titulo, desc, disabled, loading, onClick }: {
  icon: React.ReactNode; titulo: string; desc: string; disabled: boolean; loading: boolean; onClick: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">{icon}<span className="font-semibold text-foreground">{titulo}</span></div>
      <p className="text-xs text-muted-foreground flex-1">{desc}</p>
      <Button variant="outline" onClick={onClick} disabled={disabled} className="border-border w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Gerar
      </Button>
    </div>
  );
}
