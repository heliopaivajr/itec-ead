import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download, Edit2, Loader2, CheckCircle2, Printer } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ContratoPDF } from '@/components/dashboard/ContratoPDF';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getProfessorByUserId,
  preencherContrato,
  updateStatusContrato,
  type ContratoProfessor,
  type Professor,
} from '@/services/professor.service';
import { getDisciplinaById, type Disciplina } from '@/services/academico.service';
import { getContratosByProfessor } from '@/services/professor.service';
import { useOutletContext } from 'react-router-dom';
import type { DashboardContext } from '../Dashboard';

interface FormData {
  nome_completo: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  endereco: string;
  telefone: string;
  formacao: string;
  titulacao: string;
  igreja_local: string;
  experiencia_ministerial: string;
}

const campoLabel: Record<keyof FormData, string> = {
  nome_completo:           'Nome completo',
  cpf:                     'CPF',
  rg:                      'RG',
  data_nascimento:         'Data de nascimento',
  endereco:                'Endereço completo',
  telefone:                'Telefone',
  formacao:                'Formação acadêmica',
  titulacao:               'Titulação',
  igreja_local:            'Igreja local',
  experiencia_ministerial: 'Experiência ministerial',
};

export default function ContratoForm() {
  const { contratoId } = useParams<{ contratoId: string }>();
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();
  const navigate    = useNavigate();

  const [contrato, setContrato]     = useState<ContratoProfessor | null>(null);
  const [professor, setProfessor]   = useState<Professor | null>(null);
  const [disciplina, setDisciplina] = useState<Disciplina | null>(null);
  const [loading, setLoading]       = useState(true);
  const [salvando, setSalvando]     = useState(false);
  const [editando, setEditando]     = useState(false);

  const [form, setForm] = useState<FormData>({
    nome_completo: '', cpf: '', rg: '', data_nascimento: '',
    endereco: '', telefone: '', formacao: '', titulacao: '',
    igreja_local: '', experiencia_ministerial: '',
  });

  useEffect(() => {
    async function carregar() {
      if (!contratoId) return;
      setLoading(true);

      const prof = await getProfessorByUserId(profile.id);
      if (!prof) { setLoading(false); return; }
      setProfessor(prof);

      const contratos = await getContratosByProfessor(prof.id);
      const c = contratos.find(x => x.id === contratoId) ?? null;
      setContrato(c);

      if (c?.disciplina_id) {
        const disc = await getDisciplinaById(c.disciplina_id);
        setDisciplina(disc);
      }

      // Pré-preenche com dados do professor
      setForm({
        nome_completo:           prof.nome_completo,
        cpf:                     prof.cpf,
        rg:                      prof.rg ?? '',
        data_nascimento:         prof.data_nascimento ?? '',
        endereco:                prof.endereco ?? '',
        telefone:                prof.telefone ?? '',
        formacao:                prof.formacao ?? '',
        titulacao:               prof.titulacao ?? '',
        igreja_local:            prof.igreja_local ?? '',
        experiencia_ministerial: prof.experiencia_ministerial ?? '',
        // sobrescreve com dados já preenchidos no contrato
        ...(c?.dados_preenchidos as Partial<FormData> ?? {}),
      });

      setLoading(false);
    }
    carregar();
  }, [contratoId, profile.id]);

  const salvar = async () => {
    if (!contratoId) return;
    setSalvando(true);
    const { error } = await preencherContrato(contratoId, form as Record<string, unknown>);
    setSalvando(false);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Contrato salvo!', description: 'Dados registrados. Aguarde a secretaria para impressão.' });
      setContrato(c => c ? { ...c, status: 'preenchido' } : c);
      setEditando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  const podeEditar = !contrato || contrato.status === 'pendente' || editando;
  const preenchido = contrato?.status !== 'pendente';

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/dashboard/professor')} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-xs font-mono text-primary">{disciplina?.codigo}</p>
          <h1 className="text-xl font-merriweather font-bold text-foreground">
            Contrato — {disciplina?.nome ?? 'Disciplina'}
          </h1>
        </div>
      </div>

      {/* Status banner */}
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
        preenchido
          ? 'bg-green-500/10 border-green-500/30 text-green-400'
          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
      }`}>
        {preenchido
          ? <CheckCircle2 className="h-5 w-5 shrink-0" />
          : <Save className="h-5 w-5 shrink-0" />
        }
        <div>
          <p className="text-sm font-semibold">
            {preenchido ? 'Contrato preenchido' : 'Pendente de preenchimento'}
          </p>
          {preenchido && contrato?.preenchido_em && (
            <p className="text-xs opacity-70">
              Preenchido em {new Date(contrato.preenchido_em).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        {preenchido && !editando && (
          <Button variant="outline" size="sm" className="ml-auto border-current text-current"
            onClick={() => setEditando(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Editar
          </Button>
        )}
      </div>

      {/* Formulário */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          Dados para o contrato
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(campoLabel) as (keyof FormData)[]).map(campo => (
            <div key={campo} className={campo === 'experiencia_ministerial' || campo === 'endereco' ? 'sm:col-span-2' : ''}>
              <Label className="text-sm text-foreground">{campoLabel[campo]}</Label>
              {campo === 'experiencia_ministerial' ? (
                <textarea
                  rows={3}
                  value={form[campo]}
                  disabled={!podeEditar}
                  onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                  className="w-full mt-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
                />
              ) : (
                <Input
                  type={campo === 'data_nascimento' ? 'date' : 'text'}
                  value={form[campo]}
                  disabled={!podeEditar}
                  onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                  className="mt-1.5 bg-background border-border text-foreground disabled:opacity-50"
                />
              )}
            </div>
          ))}
        </div>

        {podeEditar && (
          <Button onClick={salvar} disabled={salvando}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/80 mt-2">
            {salvando
              ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
              : <><Save className="h-4 w-4 mr-2" /> Salvar e enviar para secretaria</>
            }
          </Button>
        )}
      </div>

      {/* Download PDF — geração real com @react-pdf/renderer */}
      {preenchido && professor && disciplina && (
        <PDFDownloadLink
          document={
            <ContratoPDF
              professor={professor}
              disciplina={disciplina}
              dados={(contrato?.dados_preenchidos as Record<string, string>) ?? {}}
            />
          }
          fileName={`contrato-${professor.nome_completo.replace(/\s+/g, '_')}-${disciplina.codigo}.pdf`}
          onClick={async () => {
            // Marca como impresso após o download
            if (contrato && contrato.status === 'preenchido') {
              await updateStatusContrato(contrato.id, 'impresso');
              setContrato(c => c ? { ...c, status: 'impresso' } : c);
            }
          }}
        >
          {({ loading }) => (
            <Button
              variant="outline"
              className="w-full border-primary/40 text-primary hover:bg-primary/5"
              disabled={loading}
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Gerando PDF...</>
                : <><Printer className="h-4 w-4 mr-2" /> Baixar Contrato PDF</>
              }
            </Button>
          )}
        </PDFDownloadLink>
      )}
    </div>
  );
}
