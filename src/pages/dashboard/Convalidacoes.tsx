import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Send, X, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  solicitarConvalidacao,
  getConvalidacoesPorStatus,
  encaminharConvalidacao,
  getAlunoPorEmail,
  getDisciplinaPorCodigo,
  type Convalidacao,
} from '@/services/matricula-academica.service';
import type { DashboardContext } from '../Dashboard';

type Filtro = 'pendente' | 'aprovado' | 'rejeitado';

const statusIcon = (s: string) => ({
  pendente:  <Clock className="h-4 w-4 text-yellow-400" />,
  aprovado:  <CheckCircle2 className="h-4 w-4 text-green-400" />,
  rejeitado: <XCircle className="h-4 w-4 text-red-400" />,
}[s] ?? <Clock className="h-4 w-4 text-muted-foreground" />);

const statusColor: Record<string, string> = {
  pendente:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  aprovado:  'bg-green-500/15 text-green-400 border-green-500/30',
  rejeitado: 'bg-red-500/15 text-red-400 border-red-500/30',
};

// ─── Modal nova convalidação ──────────────────────────────────
interface ModalNovaProps {
  onClose: () => void;
  onSaved: () => void;
  registradoPor: string;
}

function ModalNova({ onClose, onSaved, registradoPor }: ModalNovaProps) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    aluno_email: '', disciplina_codigo: '', instituicao_origem: '',
    disciplina_origem: '', carga_horaria_origem: '',
  });
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!form.aluno_email || !form.disciplina_codigo || !form.instituicao_origem) {
      toast({ title: 'Campos obrigatórios', variant: 'destructive' });
      return;
    }
    setSalvando(true);

    // Resolve aluno e disciplina pelo email/código via services
    const [aluno, disc] = await Promise.all([
      getAlunoPorEmail(form.aluno_email),
      getDisciplinaPorCodigo(form.disciplina_codigo),
    ]);

    if (!aluno) {
      toast({ title: 'Aluno não encontrado', description: `E-mail: ${form.aluno_email}`, variant: 'destructive' });
      setSalvando(false);
      return;
    }
    if (!disc) {
      toast({ title: 'Disciplina não encontrada', description: `Código: ${form.disciplina_codigo}`, variant: 'destructive' });
      setSalvando(false);
      return;
    }

    const { error } = await solicitarConvalidacao({
      aluno_id:               aluno.id,
      disciplina_id:          disc.id,
      instituicao_origem:     form.instituicao_origem,
      disciplina_origem:      form.disciplina_origem,
      carga_horaria_origem:   form.carga_horaria_origem ? parseInt(form.carga_horaria_origem) : null,
      coordenador_responsavel: null,
      aprovado_por:           null,
      documentos_url:         null,
      observacoes:            null,
    });

    setSalvando(false);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação registrada!' });
      onSaved();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">Nova Solicitação de Convalidação</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          {[
            ['aluno_email','E-mail do aluno *','email'],
            ['disciplina_codigo','Código da disciplina ITEC *','text'],
            ['instituicao_origem','Instituição de origem *','text'],
            ['disciplina_origem','Nome da disciplina de origem','text'],
            ['carga_horaria_origem','Carga horária de origem (h)','number'],
          ].map(([key, label, type]) => (
            <div key={key}>
              <Label className="text-sm text-foreground">{label}</Label>
              <Input type={type} value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="mt-1.5 bg-background border-border text-foreground" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="outline" onClick={onClose} className="flex-1 border-border text-foreground">Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="flex-1 bg-primary text-primary-foreground">
            {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Registrar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function Convalidacoes() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [filtro, setFiltro]     = useState<Filtro>('pendente');
  const [itens, setItens]       = useState<Convalidacao[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [encaminhando, setEncaminhando] = useState<string | null>(null);

  // Busca todas as convalidações (admin/secretaria vê todas via RLS)
  const carregar = useCallback(async () => {
    setLoading(true);
    const data = await getConvalidacoesPorStatus(filtro);
    setItens(data);
    setLoading(false);
  }, [filtro]);

  useEffect(() => { carregar(); }, [carregar]);

  const encaminhar = async (id: string) => {
    setEncaminhando(id);
    const { error } = await encaminharConvalidacao(id, profile.id);
    setEncaminhando(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Encaminhado para aprovação!' });
      carregar();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Convalidações</h1>
          <p className="text-muted-foreground mt-1">Solicitações de aproveitamento de disciplinas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" /> Nova Solicitação
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
        {(['pendente','aprovado','rejeitado'] as Filtro[]).map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`text-sm px-4 py-2 rounded-lg transition-colors capitalize ${
              filtro === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}>
            {f === 'pendente' ? 'Pendentes' : f === 'aprovado' ? 'Aprovadas' : 'Rejeitadas'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
        ) : itens.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            <p className="font-semibold text-foreground">Nenhuma convalidação {filtro}</p>
          </div>
        ) : (
          itens.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {item.disciplina_id} {/* TODO: join nome disciplina */}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Origem: {item.instituicao_origem} — {item.disciplina_origem}
                    {item.carga_horaria_origem ? ` · ${item.carga_horaria_origem}h` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado em {new Date(item.solicitado_em).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 flex items-center gap-1 ${statusColor[item.status] ?? ''}`}>
                  {statusIcon(item.status)} {item.status}
                </span>
              </div>

              {item.status === 'pendente' && (
                <Button size="sm" variant="outline"
                  onClick={() => encaminhar(item.id)}
                  disabled={encaminhando === item.id}
                  className="border-primary/40 text-primary hover:bg-primary/10 text-xs">
                  {encaminhando === item.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    : <Send className="h-3.5 w-3.5 mr-1.5" />
                  }
                  Encaminhar para Admin
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <ModalNova
          registradoPor={profile.id}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); carregar(); }}
        />
      )}
    </div>
  );
}
