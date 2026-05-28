import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { Check, Upload, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import {
  getAlunoByEmail,
  createMatricula,
  createTaxaMatricula,
} from '@/services/matriculas.service';
import { getTurmasAtivas } from '@/services/turmas.service';
import type { Turma } from '@/services/turmas.service';
import type { DashboardContext } from '../Dashboard';

// ─── Tipos ────────────────────────────────────────────────────
interface DadosPessoais {
  nome_completo: string; cpf: string; rg: string;
  data_nascimento: string; telefone: string; email: string;
  endereco: string; igreja: string;
}

const DOCS_OBRIGATORIOS = [
  'RG (frente e verso)',
  'CPF',
  'Certidão de nascimento ou casamento',
  'Histórico escolar — ensino médio',
  'Certificado de conclusão — ensino médio',
  'Comprovante de residência',
  'Carta de indicação pastoral',
  'Comprovante de pagamento da taxa de matrícula',
];

type DocStatus = 'pendente' | 'enviado';

// ─── Stepper ─────────────────────────────────────────────────
const STEPS = ['Dados pessoais', 'Documentos', 'Confirmação'];

function Step({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
        done   ? 'bg-primary border-primary text-primary-foreground' :
        active ? 'border-primary text-primary' :
                 'border-border text-muted-foreground'
      }`}>
        {done ? <Check className="h-3.5 w-3.5" /> : num}
      </div>
      <span className={`text-sm hidden sm:block ${active ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  );
}

export default function NovaMatricula() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();
  const navigate    = useNavigate();

  const [etapa, setEtapa]     = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [matriculaId, setMatriculaId] = useState<string | null>(null);
  const [turmas, setTurmas]   = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState<string>('');

  useEffect(() => {
    getTurmasAtivas().then(setTurmas);
  }, []);

  const [dados, setDados] = useState<DadosPessoais>({
    nome_completo: '', cpf: '', rg: '', data_nascimento: '',
    telefone: '', email: '', endereco: '', igreja: '',
  });

  const [docs, setDocs] = useState<Record<string, DocStatus>>(
    Object.fromEntries(DOCS_OBRIGATORIOS.map(d => [d, 'pendente']))
  );

  const setField = (k: keyof DadosPessoais, v: string) =>
    setDados(f => ({ ...f, [k]: v }));

  // ── Etapa 1 → 2: validação básica
  const avancarEtapa1 = () => {
    if (!dados.nome_completo || !dados.cpf || !dados.email) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome, CPF e e-mail.', variant: 'destructive' });
      return;
    }
    setEtapa(1);
  };

  // ── Upload de documento (Supabase Storage)
  const uploadDoc = async (nomeDoc: string, file: File) => {
    const path = `documentos-aluno/${dados.cpf.replace(/\D/g,'')}_${nomeDoc.replace(/\s/g,'_')}_${file.name}`;
    const { error } = await supabase.storage
      .from('documentos-matricula')
      .upload(path, file, { upsert: true });

    if (error) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
      return;
    }
    setDocs(d => ({ ...d, [nomeDoc]: 'enviado' }));
  };

  const docsEnviados = Object.values(docs).filter(s => s === 'enviado').length;

  // ── Etapa 3: confirmar matrícula
  const confirmar = async () => {
    setSalvando(true);
    try {
      // 1. Verifica se aluno existe pelo e-mail
      const aluno = await getAlunoByEmail(dados.email);
      if (!aluno) {
        toast({ title: 'Aluno não encontrado', description: 'O aluno deve criar conta antes da matrícula.', variant: 'destructive' });
        setSalvando(false);
        return;
      }

      // 2. Cria matrícula com status pendente
      const { data: mat, error: errMat } = await createMatricula({
        aluno_id: aluno.id,
        status:   'pendente',
        turma_id: turmaId || undefined,
      });

      if (errMat || !mat) throw new Error(errMat ?? 'Erro ao criar matrícula');

      // 3. Cria taxa de matrícula pendente
      await createTaxaMatricula(aluno.id, mat.id, profile.id);

      setMatriculaId(mat.id);
      setEtapa(2);
      toast({ title: 'Matrícula registrada!', description: 'Status: PENDENTE. Aguarda validação presencial.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/matriculas')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-merriweather font-bold text-foreground">Nova Matrícula</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <Step num={i+1} label={s} active={etapa === i} done={etapa > i || (etapa === 2 && !!matriculaId)} />
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      {/* Etapa 1 — Dados pessoais */}
      {etapa === 0 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Dados pessoais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ['nome_completo','Nome completo *','text'],
              ['cpf','CPF *','text'],
              ['rg','RG','text'],
              ['data_nascimento','Data de nascimento','date'],
              ['telefone','Telefone / WhatsApp','text'],
              ['email','E-mail *','email'],
            ] as [keyof DadosPessoais, string, string][]).map(([key, label, type]) => (
              <div key={key}>
                <Label className="text-sm text-foreground">{label}</Label>
                <Input type={type} value={dados[key]}
                  onChange={e => setField(key, e.target.value)}
                  className="mt-1.5 bg-background border-border text-foreground" />
              </div>
            ))}
            <div className="sm:col-span-2">
              <Label className="text-sm text-foreground">Endereço completo</Label>
              <Input value={dados.endereco} onChange={e => setField('endereco', e.target.value)}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm text-foreground">Igreja local</Label>
              <Input value={dados.igreja} onChange={e => setField('igreja', e.target.value)}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-sm text-foreground">Turma</Label>
              <Select value={turmaId} onValueChange={setTurmaId}>
                <SelectTrigger className="mt-1.5 bg-background border-border text-foreground">
                  <SelectValue placeholder="Selecione a turma (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {turmas.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.codigo} — {t.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={avancarEtapa1} className="w-full bg-primary text-primary-foreground">
            Próximo <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* Etapa 2 — Documentos */}
      {etapa === 1 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/20">
            <h2 className="text-sm font-semibold text-foreground">Documentos obrigatórios</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{docsEnviados}/{DOCS_OBRIGATORIOS.length} enviados</p>
          </div>
          <div className="divide-y divide-border/50">
            {DOCS_OBRIGATORIOS.map(doc => (
              <div key={doc} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  {docs[doc] === 'enviado'
                    ? <Check className="h-4 w-4 text-green-400 shrink-0" />
                    : <div className="h-4 w-4 rounded-full border-2 border-border shrink-0" />
                  }
                  <span className={`text-sm ${docs[doc] === 'enviado' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {doc}
                  </span>
                </div>
                <label className="cursor-pointer">
                  <input type="file" className="hidden" accept="image/*,.pdf"
                    onChange={e => { const f = e.target.files?.[0]; if (f) uploadDoc(doc, f); }} />
                  <span className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Upload className="h-3 w-3" />
                    {docs[doc] === 'enviado' ? 'Substituir' : 'Enviar'}
                  </span>
                </label>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-border flex gap-3">
            <Button variant="outline" onClick={() => setEtapa(0)} className="flex-1 border-border">
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <Button onClick={() => setEtapa(2)} className="flex-1 bg-primary text-primary-foreground">
              Revisar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Etapa 3 — Confirmação */}
      {etapa === 2 && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Resumo</h2>

          {matriculaId ? (
            <div className="text-center space-y-4 py-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <p className="font-semibold text-foreground">Matrícula registrada com sucesso!</p>
              <p className="text-sm text-muted-foreground">
                Status: <strong className="text-yellow-400">PENDENTE</strong> — aguarda validação presencial e confirmação de pagamento da taxa.
              </p>
              <Button onClick={() => navigate('/dashboard/matriculas')} className="bg-primary text-primary-foreground">
                Ver matrículas pendentes
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Nome</span>
                  <span className="font-medium text-foreground">{dados.nome_completo}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">E-mail</span>
                  <span className="text-foreground">{dados.email}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">CPF</span>
                  <span className="text-foreground">{dados.cpf}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Turma</span>
                  <span className="text-foreground">
                    {turmaId
                      ? (turmas.find(t => t.id === turmaId)?.codigo ?? '—')
                      : <span className="text-muted-foreground">Não selecionada</span>}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground">Documentos</span>
                  <span className={docsEnviados === DOCS_OBRIGATORIOS.length ? 'text-green-400' : 'text-yellow-400'}>
                    {docsEnviados}/{DOCS_OBRIGATORIOS.length}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Status inicial</span>
                  <span className="text-yellow-400 font-semibold">PENDENTE</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setEtapa(1)} className="flex-1 border-border">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button onClick={confirmar} disabled={salvando} className="flex-1 bg-primary text-primary-foreground">
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Confirmar Matrícula
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
