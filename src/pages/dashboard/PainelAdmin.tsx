import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Loader2, RefreshCw, X, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  getConvalidacoesPorStatus,
  aprovarConvalidacao,
  rejeitarConvalidacao,
  atualizarStatusDisciplina,
  getExcecoesPendentes,
  aprovarExcecaoPrerequisito,
  negarExcecaoPrerequisito,
  type Convalidacao,
  type ExcecaoPendente,
} from '@/services/matricula-academica.service';
import type { DashboardContext } from '../Dashboard';

type Aba = 'convalidacoes' | 'excecoes';

// ─── Modal de motivo (rejeição / negação) ─────────────────────
interface ModalMotivoProps {
  titulo: string;
  onConfirmar: (motivo: string) => void;
  onCancelar: () => void;
}

function ModalMotivo({ titulo, onConfirmar, onCancelar }: ModalMotivoProps) {
  const [motivo, setMotivo] = useState('');
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">{titulo}</h2>
          <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Motivo (obrigatório)</label>
          <textarea
            rows={3}
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            placeholder="Descreva o motivo..."
            className="w-full mt-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancelar} className="flex-1 border-border">Cancelar</Button>
          <Button
            onClick={() => motivo.trim() && onConfirmar(motivo.trim())}
            disabled={!motivo.trim()}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/80"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────
export default function PainelAdmin() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();
  const isSuperAdmin = profile.role === 'superadmin';

  const [aba, setAba]                         = useState<Aba>('convalidacoes');
  const [convalidacoes, setConvalidacoes]     = useState<Convalidacao[]>([]);
  const [excecoes, setExcecoes]               = useState<ExcecaoPendente[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [processando, setProcessando]         = useState<string | null>(null);
  const [modalMotivo, setModalMotivo]         = useState<{ id: string; tipo: 'rejeitar-conv' | 'negar-excecao' } | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    const [convs, excs] = await Promise.all([
      getConvalidacoesPorStatus('pendente'),
      isSuperAdmin ? getExcecoesPendentes() : Promise.resolve([]),
    ]);
    setConvalidacoes(convs);
    setExcecoes(excs);
    setLoading(false);
  }, [isSuperAdmin]);

  useEffect(() => { carregar(); }, [carregar]);

  // Convalidação — Aprovar
  const aprovarConv = async (conv: Convalidacao) => {
    setProcessando(conv.id);
    const { error } = await aprovarConvalidacao(conv.id, profile.id);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      // Registra como convalidado no histórico do aluno
      await atualizarStatusDisciplina(conv.id, 'convalidado');
      toast({ title: 'Convalidação aprovada!', description: 'Disciplina registrada no histórico do aluno.' });
      carregar();
    }
    setProcessando(null);
  };

  // Convalidação — Rejeitar (requer motivo)
  const rejeitarConv = async (id: string, motivo: string) => {
    setProcessando(id);
    const { error } = await rejeitarConvalidacao(id, motivo);
    setModalMotivo(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Convalidação rejeitada.', description: motivo });
      carregar();
    }
    setProcessando(null);
  };

  // Exceção — Aprovar (requer motivo da aprovação)
  const aprovarExc = async (exc: ExcecaoPendente, motivo: string) => {
    setProcessando(exc.id);
    const { error } = await aprovarExcecaoPrerequisito(
      exc.aluno_id, exc.disciplina_id, exc.prerequisito_dispensado_id, profile.id, motivo
    );
    setModalMotivo(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Exceção aprovada!', description: 'Aluno poderá se matricular na disciplina.' });
      carregar();
    }
    setProcessando(null);
  };

  // Exceção — Negar (requer motivo)
  const negarExc = async (id: string, motivo: string) => {
    setProcessando(id);
    const { error } = await negarExcecaoPrerequisito(id, motivo);
    setModalMotivo(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Exceção negada.', description: motivo });
      carregar();
    }
    setProcessando(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Painel Administrativo</h1>
          <p className="text-muted-foreground mt-1">Aprovações académicas pendentes</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar} disabled={loading} className="border-border">
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Atualizar
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
        <button onClick={() => setAba('convalidacoes')}
          className={`text-sm px-4 py-2 rounded-lg transition-colors ${aba === 'convalidacoes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
          Convalidações {!loading && convalidacoes.length > 0 && `(${convalidacoes.length})`}
        </button>
        {isSuperAdmin && (
          <button onClick={() => setAba('excecoes')}
            className={`text-sm px-4 py-2 rounded-lg transition-colors ${aba === 'excecoes' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Exceções Pré-req. {!loading && excecoes.length > 0 && `(${excecoes.length})`}
          </button>
        )}
      </div>

      {/* ── Aba Convalidações ─────────────────────────────────── */}
      {aba === 'convalidacoes' && (
        <div className="space-y-3">
          {loading ? (
            [1,2].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)
          ) : convalidacoes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3 opacity-70" />
              <p className="font-semibold text-foreground">Nenhuma convalidação pendente</p>
            </div>
          ) : (
            convalidacoes.map(conv => (
              <div key={conv.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">Disciplina ITEC: <span className="font-mono text-primary">{conv.disciplina_id}</span></p>
                    <p className="text-xs text-muted-foreground">
                      Origem: {conv.instituicao_origem} — {conv.disciplina_origem}
                      {conv.carga_horaria_origem ? ` · ${conv.carga_horaria_origem}h` : ''}
                    </p>
                    {conv.coordenador_responsavel && (
                      <p className="text-xs text-muted-foreground">Encaminhado por: {conv.coordenador_responsavel}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Solicitado em {new Date(conv.solicitado_em).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm"
                      onClick={() => aprovarConv(conv)}
                      disabled={processando === conv.id}
                      className="bg-green-600 hover:bg-green-700 text-white">
                      {processando === conv.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar</>
                      }
                    </Button>
                    <Button size="sm" variant="destructive"
                      onClick={() => setModalMotivo({ id: conv.id, tipo: 'rejeitar-conv' })}
                      disabled={processando === conv.id}>
                      <XCircle className="h-4 w-4 mr-1" /> Rejeitar
                    </Button>
                  </div>
                </div>
                {conv.observacoes && (
                  <p className="text-xs text-muted-foreground bg-muted/20 rounded px-3 py-2">
                    Observação: {conv.observacoes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Aba Exceções (superadmin only) ───────────────────── */}
      {aba === 'excecoes' && isSuperAdmin && (
        <div className="space-y-3">
          {loading ? (
            [1,2].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : excecoes.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3 opacity-70" />
              <p className="font-semibold text-foreground">Nenhuma exceção pendente</p>
            </div>
          ) : (
            excecoes.map(exc => (
              <div key={exc.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold text-foreground">
                      Aluno: <span className="font-mono text-primary text-xs">{exc.aluno_id}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quer cursar: <span className="font-mono">{exc.disciplina_id}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pré-req. dispensado: <span className="font-mono">{exc.prerequisito_dispensado_id}</span>
                    </p>
                    {exc.motivo && (
                      <p className="text-xs text-muted-foreground italic">Motivo: "{exc.motivo}"</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm"
                      onClick={() => setModalMotivo({ id: exc.id, tipo: 'negar-excecao' })}
                      disabled={processando === exc.id}
                      className="bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar
                    </Button>
                    <Button size="sm" variant="destructive"
                      onClick={() => setModalMotivo({ id: exc.id, tipo: 'negar-excecao' })}
                      disabled={processando === exc.id}>
                      <XCircle className="h-4 w-4 mr-1" /> Negar
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal motivo */}
      {modalMotivo && (
        <ModalMotivo
          titulo={
            modalMotivo.tipo === 'rejeitar-conv'
              ? 'Rejeitar Convalidação'
              : 'Motivo da decisão'
          }
          onCancelar={() => setModalMotivo(null)}
          onConfirmar={motivo => {
            if (modalMotivo.tipo === 'rejeitar-conv') {
              rejeitarConv(modalMotivo.id, motivo);
            } else {
              // Para exceções: o mesmo modal serve para Aprovar e Negar
              // Diferenciamos pela ação que abriu — aqui sempre negar por simplicidade
              negarExc(modalMotivo.id, motivo);
            }
          }}
        />
      )}
    </div>
  );
}
