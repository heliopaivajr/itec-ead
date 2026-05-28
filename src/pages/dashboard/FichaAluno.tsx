import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin,
  GraduationCap, FileText, CreditCard,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getFichaAluno,
  type PerfilAluno,
  type MatriculaFicha,
  type DocumentoFicha,
  type MensalidadeFicha,
} from '@/services/ficha-aluno.service';

// ─── Helpers ─────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  ativa:     'bg-green-500/20 text-green-400 border-green-500/30',
  pendente:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  aprovada:  'bg-green-500/20 text-green-400 border-green-500/30',
  cancelada: 'bg-red-500/20 text-red-400 border-red-500/30',
  trancada:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pago:      'bg-green-500/20 text-green-400 border-green-500/30',
  atrasado:  'bg-red-500/20 text-red-400 border-red-500/30',
  isento:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
  validado:  'bg-green-500/20 text-green-400 border-green-500/30',
  rejeitado: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function moeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Componente principal ─────────────────────────────────────

export default function FichaAluno() {
  const { alunoId } = useParams<{ alunoId: string }>();
  const navigate    = useNavigate();

  const [loading,      setLoading]      = useState(true);
  const [perfil,       setPerfil]       = useState<PerfilAluno | null>(null);
  const [matriculas,   setMatriculas]   = useState<MatriculaFicha[]>([]);
  const [documentos,   setDocumentos]   = useState<DocumentoFicha[]>([]);
  const [mensalidades, setMensalidades] = useState<MensalidadeFicha[]>([]);

  useEffect(() => {
    if (!alunoId) return;
    load(alunoId);
  }, [alunoId]);

  const load = async (id: string) => {
    setLoading(true);
    const ficha = await getFichaAluno(id);
    setPerfil(ficha.perfil);
    setMatriculas(ficha.matriculas);
    setDocumentos(ficha.documentos);
    setMensalidades(ficha.mensalidades);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Aluno não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const inadimplente = mensalidades.some(m => m.status === 'atrasado');

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">Ficha do Aluno</h1>
      </div>

      {/* Dados pessoais */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          {perfil.avatar_url ? (
            <img
              src={perfil.avatar_url}
              alt={perfil.full_name}
              className="h-16 w-16 rounded-full object-cover border"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border">
              {perfil.full_name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{perfil.full_name}</h2>
              {inadimplente && (
                <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                  Inadimplente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground capitalize">{perfil.role}</p>
            <p className="text-xs text-muted-foreground mt-1">Cadastrado em {fmt(perfil.created_at)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <InfoRow icon={<Mail className="h-4 w-4" />} label="E-mail" value={perfil.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={perfil.telefone ?? '—'} />
          {perfil.bio && (
            <div className="sm:col-span-2">
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bio" value={perfil.bio} />
            </div>
          )}
        </div>
      </div>

      {/* Matrículas */}
      <Section title="Matrículas" icon={<GraduationCap className="h-4 w-4" />}>
        {matriculas.length === 0 ? (
          <Empty text="Nenhuma matrícula registrada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Turma</th>
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matriculas.map(m => (
                <tr key={m.id}>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{m.id.slice(0, 8)}…</td>
                  <td className="py-2">{m.turma?.codigo ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="py-2">{fmt(m.created_at)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[m.status] ?? ''}`}>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Documentos */}
      <Section title="Documentos" icon={<FileText className="h-4 w-4" />}>
        {documentos.length === 0 ? (
          <Empty text="Nenhum documento registrado." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Documento</th>
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map(d => (
                <tr key={d.id}>
                  <td className="py-2">{d.tipo_documento}</td>
                  <td className="py-2">{fmt(d.criado_em)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[d.status] ?? ''}`}>
                      {d.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Financeiro */}
      <Section title="Financeiro" icon={<CreditCard className="h-4 w-4" />}>
        {mensalidades.length === 0 ? (
          <Empty text="Nenhuma mensalidade registrada." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">Referência</th>
                <th className="pb-2 font-medium">Valor</th>
                <th className="pb-2 font-medium">Vencimento</th>
                <th className="pb-2 font-medium">Pagamento</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mensalidades.map(m => (
                <tr key={m.id}>
                  <td className="py-2 font-mono text-xs">{m.mes_referencia}</td>
                  <td className="py-2">{moeda(m.valor)}</td>
                  <td className="py-2">{fmt(m.data_vencimento)}</td>
                  <td className="py-2">{fmt(m.data_pagamento)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[m.status] ?? ''}`}>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 overflow-x-auto">{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
