import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin,
  GraduationCap, FileText, CreditCard, Church, Home, Save, Printer, Camera,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  getFichaAluno,
  type PerfilAluno,
  type MatriculaFicha,
  type DocumentoFicha,
  type MensalidadeFicha,
} from '@/services/ficha-aluno.service';
import { updatePerfil } from '@/services/usuarios.service';
import { uploadAvatar } from '@/services/profile.service';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

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
  const { profile: adminProfile } = useOutletContext<DashboardContext>();

  const [loading,      setLoading]      = useState(true);
  const [perfil,       setPerfil]       = useState<PerfilAluno | null>(null);
  const [matriculas,   setMatriculas]   = useState<MatriculaFicha[]>([]);
  const [documentos,   setDocumentos]   = useState<DocumentoFicha[]>([]);
  const [mensalidades, setMensalidades] = useState<MensalidadeFicha[]>([]);

  const [obsEdit,    setObsEdit]    = useState('');
  const [savingObs,  setSavingObs]  = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !perfil) return;
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    if (!tiposPermitidos.includes(file.type)) {
      toast({ title: 'Formato inválido', description: 'Use JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Tamanho máximo: 2MB.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const { url, error } = await uploadAvatar(perfil.id, file);
    setUploading(false);
    if (error) {
      toast({ title: 'Erro ao salvar foto', description: error, variant: 'destructive' });
      return;
    }
    setPerfil(prev => prev ? { ...prev, avatar_url: url } : prev);
    toast({ title: 'Foto atualizada com sucesso!' });
  };

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
    setObsEdit(ficha.perfil?.observacoes_internas ?? '');
    setLoading(false);
  };

  const salvarObs = async () => {
    if (!alunoId) return;
    setSavingObs(true);
    await updatePerfil(alunoId, { observacoes_internas: obsEdit });
    setSavingObs(false);
  };

  const podeVerObs  = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);
  const podeVerDocs = ['superadmin', 'admin', 'administracao'].includes(adminProfile.role);

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
  const enderecoCompleto = [
    perfil.endereco,
    perfil.numero && `nº ${perfil.numero}`,
    perfil.complemento,
    perfil.bairro,
    perfil.cidade && perfil.estado ? `${perfil.cidade}/${perfil.estado}` : (perfil.cidade || perfil.estado),
    perfil.cep && `CEP ${perfil.cep}`,
  ].filter(Boolean).join(', ');

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
          <label className="cursor-pointer group relative w-16 h-16 block shrink-0">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
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
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              {uploading
                ? <Loader2 className="h-5 w-5 text-white animate-spin" />
                : <Camera className="h-5 w-5 text-white" />
              }
            </div>
          </label>
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
          <InfoRow icon={<Mail className="h-4 w-4" />}  label="E-mail"   value={perfil.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={perfil.telefone ?? '—'} />
          {perfil.cpf && (
            <InfoRow icon={<FileText className="h-4 w-4" />} label="CPF" value={perfil.cpf} />
          )}
          {perfil.rg && (
            <InfoRow icon={<FileText className="h-4 w-4" />} label="RG" value={perfil.rg} />
          )}
          {perfil.data_nascimento && (
            <InfoRow icon={<User className="h-4 w-4" />} label="Nascimento" value={fmt(perfil.data_nascimento)} />
          )}
          {perfil.sexo && (
            <InfoRow icon={<User className="h-4 w-4" />} label="Sexo" value={perfil.sexo} />
          )}
          {perfil.bio && (
            <div className="sm:col-span-2">
              <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bio" value={perfil.bio} />
            </div>
          )}
        </div>
      </div>

      {/* Endereço */}
      {enderecoCompleto && (
        <Section title="Endereço" icon={<Home className="h-4 w-4" />}>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            {perfil.endereco && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Logradouro" value={perfil.endereco} />}
            {perfil.numero    && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Número"     value={perfil.numero} />}
            {perfil.complemento && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Complemento" value={perfil.complemento} />}
            {perfil.bairro    && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Bairro"     value={perfil.bairro} />}
            {perfil.cidade    && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Cidade"     value={perfil.cidade} />}
            {perfil.estado    && <InfoRow icon={<MapPin className="h-4 w-4" />} label="Estado"     value={perfil.estado} />}
            {perfil.cep       && <InfoRow icon={<MapPin className="h-4 w-4" />} label="CEP"        value={perfil.cep} />}
          </div>
        </Section>
      )}

      {/* Ministério */}
      {perfil.igreja_local && (
        <Section title="Ministério" icon={<Church className="h-4 w-4" />}>
          <InfoRow icon={<Church className="h-4 w-4" />} label="Igreja local" value={perfil.igreja_local} />
        </Section>
      )}

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
                <th className="pb-2 font-medium">Enviado em</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {documentos.map(d => (
                <tr key={d.id}>
                  <td className="py-2">
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        className="hover:text-primary underline underline-offset-2">
                        {d.tipo}
                      </a>
                    ) : d.tipo}
                  </td>
                  <td className="py-2">{fmt(d.enviado_em)}</td>
                  <td className="py-2">
                    <Badge variant="outline" className={`text-xs ${STATUS_COLORS[d.status] ?? ''}`}>
                      {d.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">{d.observacao ?? '—'}</td>
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

      {/* Documentos e Impressões — só para secretaria/admin */}
      {podeVerDocs && (
        <Section title="Documentos e Impressões" icon={<Printer className="h-4 w-4" />}>
          <p className="text-xs text-muted-foreground mb-3">Gere e imprima documentos oficiais do aluno.</p>
          <div className="space-y-2">
            {[
              'Declaração de Matrícula',
              'Boletim de Notas',
              'Situação Financeira',
              'Certificado de Conclusão',
              'Relatório Final do Aluno',
            ].map(doc => (
              <div key={doc} title="Disponível em Agosto 2026">
                <Button
                  variant="outline"
                  disabled
                  className="w-full justify-between text-left"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {doc}
                  </span>
                  <span className="ml-3 shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                    Em breve
                  </span>
                </Button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Observações internas — só para secretaria/admin */}
      {podeVerObs && (
        <Section title="Observações Internas" icon={<FileText className="h-4 w-4" />}>
          <div className="space-y-3">
            <Textarea
              value={obsEdit}
              onChange={e => setObsEdit(e.target.value)}
              placeholder="Notas internas sobre este aluno…"
              rows={4}
              className="resize-none"
            />
            <Button size="sm" onClick={salvarObs} disabled={savingObs}>
              <Save className="h-4 w-4 mr-2" />
              {savingObs ? 'Salvando…' : 'Salvar observações'}
            </Button>
          </div>
        </Section>
      )}
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
