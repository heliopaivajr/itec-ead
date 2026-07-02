import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, User, GraduationCap,
  Loader2, Edit, Eye, Lock, CheckCircle, Clock, Plus, Trash2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getAlunos, updateRole, updateUsuario, solicitarExclusao } from '@/services/usuarios.service';
import type { UserRow } from '@/services/usuarios.service';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { updateStatusMatricula } from '@/services/matriculas.service';
import { InlineStatusSelect } from '@/components/dashboard/InlineStatusSelect';
import type { StatusOption } from '@/components/dashboard/InlineStatusSelect';
import { statusMatriculaOptions } from '@/constants/statusMatricula';
import { NovoAlunoModal } from '@/components/dashboard/NovoAlunoModal';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

const PAGE_SIZE = 20;


// ─── Modal editar aluno ───────────────────────────────────────────────────────

type ModalForm = {
  full_name: string; telefone: string; role: string; bio: string;
  cpf: string; rg: string; data_nascimento: string; sexo: string;
  endereco: string; numero: string; complemento: string; bairro: string;
  cidade: string; estado: string; cep: string; igreja_local: string;
};

interface AlunoModalProps {
  aluno: UserRow;
  salvando: boolean;
  onSave: (dados: ModalForm) => void;
  onClose: () => void;
}

function AlunoModal({ aluno, salvando, onSave, onClose }: AlunoModalProps) {
  const [tab, setTab] = useState<'basico' | 'endereco' | 'ministerio'>('basico');
  const [form, setForm] = useState<ModalForm>({
    full_name:      aluno.full_name      ?? '',
    telefone:       aluno.telefone       ?? '',
    role:           aluno.role,
    bio:            aluno.bio            ?? '',
    cpf:            aluno.cpf            ?? '',
    rg:             aluno.rg             ?? '',
    data_nascimento: aluno.data_nascimento ?? '',
    sexo:           aluno.sexo           ?? '',
    endereco:       aluno.endereco       ?? '',
    numero:         aluno.numero         ?? '',
    complemento:    aluno.complemento    ?? '',
    bairro:         aluno.bairro         ?? '',
    cidade:         aluno.cidade         ?? '',
    estado:         aluno.estado         ?? '',
    cep:            aluno.cep            ?? '',
    igreja_local:   aluno.igreja_local   ?? '',
  });

  const field = (key: keyof ModalForm, label: string, props?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label className="text-xs text-muted-foreground font-medium mb-1 block">{label}</label>
      <Input
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="bg-background"
        {...props}
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Editar Aluno</h2>
            <p className="text-xs text-muted-foreground">{aluno.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(['basico', 'endereco', 'ministerio'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t capitalize transition-colors ${
                tab === t
                  ? 'bg-primary/10 text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'basico' ? 'Básico' : t === 'endereco' ? 'Endereço' : 'Ministério'}
            </button>
          ))}
        </div>

        {tab === 'basico' && (
          <div className="space-y-3">
            {field('full_name', 'Nome Completo')}
            {field('telefone', 'Telefone', { placeholder: '(00) 00000-0000' })}
            <div className="grid grid-cols-2 gap-3">
              {field('cpf', 'CPF', { placeholder: '000.000.000-00' })}
              {field('rg', 'RG')}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {field('data_nascimento', 'Nascimento', { type: 'date' })}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Sexo</label>
                <select
                  value={form.sexo}
                  onChange={e => setForm(p => ({ ...p, sexo: e.target.value }))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">—</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Status / Role</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="aluno">Aluno ativo</option>
                <option value="pendente">Pendente</option>
                <option value="administracao">Secretaria</option>
              </select>
            </div>
          </div>
        )}

        {tab === 'endereco' && (
          <div className="space-y-3">
            {field('endereco', 'Logradouro (rua, av.)', { placeholder: 'Rua Exemplo' })}
            <div className="grid grid-cols-3 gap-3">
              {field('numero', 'Número', { placeholder: '123' })}
              {field('complemento', 'Complemento', { placeholder: 'Apto 2' })}
              {field('cep', 'CEP', { placeholder: '00000-000' })}
            </div>
            {field('bairro', 'Bairro')}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">{field('cidade', 'Cidade')}</div>
              {field('estado', 'UF', { placeholder: 'SP', maxLength: 2 })}
            </div>
          </div>
        )}

        {tab === 'ministerio' && (
          <div className="space-y-3">
            {field('igreja_local', 'Igreja local', { placeholder: 'Nome da igreja' })}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={() => onSave(form)} className="flex-1" disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

// Vocabulário compartilhado (R3.2 Leva 2a) — mesmo mapa do funil de matrículas.
const STATUS_MATRICULA_OPTIONS: StatusOption[] = statusMatriculaOptions([
  'ativa', 'inativa', 'trancada', 'evadida', 'concluida', 'suspensa', 'pendente',
]);

export default function Alunos() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [page, setPage]   = useState(1);
  const [search, setSearch]   = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [alunos, setAlunos]     = useState<UserRow[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [novoAlunoOpen, setNovoAlunoOpen] = useState(false);
  const [exclusaoAluno, setExclusaoAluno] = useState<UserRow | null>(null);
  const [exclusaoMotivo, setExclusaoMotivo] = useState('');
  const [enviandoExclusao, setEnviandoExclusao] = useState(false);

  const [editAluno, setEditAluno] = useState<UserRow | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 300);
  };

  // carregar — usado por aprovar/trancar/handleEditSave após ações manuais
  const carregar = useCallback(async () => {
    const result = await getAlunos(page, PAGE_SIZE, debouncedSearch);
    setAlunos(result.data);
    setTotal(result.total);
  }, [page, debouncedSearch]);

  // useEffect com cancellation token — evita loading infinito ao navegar
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAlunos(page, PAGE_SIZE, debouncedSearch).then(result => {
      if (!cancelled) {
        setAlunos(result.data);
        setTotal(result.total);
        setLoading(false);
      }
    });
    return () => { cancelled = true; setLoading(false); };
  }, [page, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const aprovar = async (userId: string) => {
    setAtualizando(userId);
    const { error } = await updateRole(userId, 'aluno', profile.id);
    if (error) {
      toast({ title: 'Erro ao aprovar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Aluno aprovado!', description: 'Acesso liberado.' });
      await carregar();
    }
    setAtualizando(null);
  };

  const trancar = async (userId: string) => {
    setAtualizando(userId);
    const { error } = await updateRole(userId, 'pendente', profile.id);
    if (error) {
      toast({ title: 'Erro ao trancar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Aluno trancado', description: 'Acesso suspenso.' });
      await carregar();
    }
    setAtualizando(null);
  };

  const handleSolicitarExclusao = async () => {
    if (!exclusaoAluno || !exclusaoMotivo.trim()) return;
    setEnviandoExclusao(true);
    const { error } = await solicitarExclusao(exclusaoAluno.id, exclusaoMotivo.trim(), profile.id);
    setEnviandoExclusao(false);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação enviada', description: 'O superadmin será notificado para autorizar a exclusão.' });
      setExclusaoAluno(null);
      setExclusaoMotivo('');
      await carregar();
    }
  };

  const handleEditSave = async (dados: ModalForm) => {
    if (!editAluno) return;
    setAtualizando(editAluno.id);
    const { error } = await updateUsuario(editAluno.id, {
      ...dados,
      sexo: dados.sexo as 'masculino' | 'feminino' | 'outro' | undefined,
    });
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Aluno atualizado!', description: 'Dados salvos com sucesso.' });
      setEditAluno(null);
      await carregar();
    }
    setAtualizando(null);
  };

  const pageStart = (page - 1) * PAGE_SIZE + 1;
  const pageEnd   = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="p-6 space-y-6 relative">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Alunos</h1>
          <p className="text-muted-foreground mt-1">Ficha, dados e status dos alunos matriculados</p>
        </div>
        <Button
          onClick={() => setNovoAlunoOpen(true)}
          className="gap-2 shrink-0"
          size="sm"
        >
          <Plus className="h-4 w-4" /> Novo Aluno
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="pl-9 bg-background border-border text-foreground shadow-sm"
        />
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando alunos...
          </div>
        ) : alunos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <GraduationCap className="h-10 w-10 opacity-30" />
            <p>{debouncedSearch ? 'Nenhum aluno encontrado.' : 'Nenhum aluno cadastrado.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Aluno</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((aluno, i) => {
                  return (
                    <tr key={aluno.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? 'bg-muted/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {aluno.avatar_url ? (
                            <img src={aluno.avatar_url} alt={aluno.full_name}
                              className="h-8 w-8 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => navigate(`/dashboard/aluno/${aluno.id}`)}
                                className="font-medium text-left hover:text-primary hover:underline transition-colors"
                              >
                                {aluno.full_name}
                              </button>
                              {aluno.exclusao_solicitada_em && (
                                <Badge variant="outline" className="bg-red-500/20 text-red-500 border-red-500/30 text-xs">
                                  Exclusão solicitada
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{aluno.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{aluno.telefone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <InlineStatusSelect
                          value={aluno.matricula_status ?? 'pendente'}
                          options={STATUS_MATRICULA_OPTIONS}
                          disabled={
                            !aluno.matricula_id ||
                            !['administracao', 'admin', 'superadmin'].includes(profile?.role ?? '')
                          }
                          onSave={async (novoStatus) => {
                            if (!aluno.matricula_id) throw new Error('Matrícula não encontrada');
                            if (novoStatus === 'concluida') {
                              const ok = window.confirm(
                                'Marcar como concluído é irreversível sem aprovação da direção. Confirmar?'
                              );
                              if (!ok) throw new Error('cancelado');
                            }
                            const { error } = await updateStatusMatricula(aluno.matricula_id, novoStatus);
                            if (error) throw new Error(error);
                          }}
                        />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(aluno.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {atualizando === aluno.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/dashboard/aluno/${aluno.id}`)}
                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                              title="Ver Ficha"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditAluno(aluno)}
                              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                              title="Editar dados"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {['administracao', 'admin', 'superadmin'].includes(profile?.role ?? '') && !aluno.exclusao_solicitada_em && (
                              <button
                                onClick={() => { setExclusaoAluno(aluno); setExclusaoMotivo(''); }}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-red-500 transition-colors"
                                title="Solicitar exclusão"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {aluno.role === 'pendente' ? (
                              <button
                                onClick={() => aprovar(aluno.id)}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-green-400 transition-colors"
                                title="Aprovar acesso"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => trancar(aluno.id)}
                                className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-yellow-400 transition-colors"
                                title="Trancar acesso"
                              >
                                <Lock className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {total > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exibindo {pageStart}–{pageEnd} de {total} usuário{total !== 1 ? 's' : ''} (alunos/pendentes)
            {debouncedSearch && <span className="ml-1">(filtrado)</span>}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Página {page} de {totalPages}</span>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="h-7 px-2"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {editAluno && (
        <AlunoModal
          aluno={editAluno}
          salvando={atualizando === editAluno.id}
          onSave={handleEditSave}
          onClose={() => setEditAluno(null)}
        />
      )}

      {/* Dialog — Solicitar Exclusão */}
      <Dialog open={!!exclusaoAluno} onOpenChange={v => { if (!v) { setExclusaoAluno(null); setExclusaoMotivo(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <p className="text-sm text-muted-foreground">
              Esta solicitação será enviada para aprovação do superadmin.
              O aluno <strong className="text-foreground">{exclusaoAluno?.full_name}</strong> não será excluído imediatamente.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Motivo da exclusão *</label>
              <Textarea
                value={exclusaoMotivo}
                onChange={e => setExclusaoMotivo(e.target.value)}
                placeholder="Descreva o motivo da solicitação de exclusão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setExclusaoAluno(null); setExclusaoMotivo(''); }}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={handleSolicitarExclusao}
              disabled={!exclusaoMotivo.trim() || enviandoExclusao}
            >
              {enviandoExclusao ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NovoAlunoModal
        open={novoAlunoOpen}
        onClose={() => setNovoAlunoOpen(false)}
        onCriado={() => { setPage(1); }}
      />
    </div>
  );
}
