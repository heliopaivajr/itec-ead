import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Search, User, Shield,
  GraduationCap, BookOpen, Loader2, Users, Edit,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getUsuarios, getUsuariosStats, updateRole, getRolesPermitidas, updateUsuario, getExclusoesPendentes, executarExclusao, recusarExclusao } from '@/services/usuarios.service';
import type { UserRow, UsuariosStats } from '@/services/usuarios.service';
import { InlineStatusSelect } from '@/components/dashboard/InlineStatusSelect';
import type { StatusOption } from '@/components/dashboard/InlineStatusSelect';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

const PAGE_SIZE = 20;

const ROLE_LABELS: Record<string, string> = {
  pendente:      'Pendente',
  aluno:         'Aluno',
  professor:     'Professor',
  administracao: 'Secretaria',
  financeiro:    'Financeiro',
  admin:         'Admin',
  superadmin:    'Super Admin',
  inativo:       'Inativo',
  suspenso:      'Suspenso',
  trancado:      'Trancado',
};

const ROLE_COLORS: Record<string, string> = {
  pendente:      'bg-yellow-100 text-yellow-800',
  aluno:         'bg-green-100 text-green-800',
  professor:     'bg-blue-100 text-blue-800',
  administracao: 'bg-purple-100 text-purple-800',
  financeiro:    'bg-orange-100 text-orange-800',
  admin:         'bg-red-100 text-red-800',
  superadmin:    'bg-gray-900 text-white',
  inativo:       'bg-gray-100 text-gray-600',
  suspenso:      'bg-red-100 text-red-800',
  trancado:      'bg-orange-100 text-orange-800',
};

type Filtro = 'todos' | 'pendentes' | 'ativos' | 'suspensos';

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todos',     label: 'Todos'     },
  { key: 'pendentes', label: 'Pendentes' },
  { key: 'ativos',    label: 'Ativos'    },
  { key: 'suspensos', label: 'Suspensos' },
];

function rolesParaOptions(roles: string[]): StatusOption[] {
  return roles.map(r => ({
    value: r,
    label: ROLE_LABELS[r] ?? r,
    color: ROLE_COLORS[r] ?? 'bg-gray-100 text-gray-600',
  }));
}

function aplicarFiltro(users: UserRow[], filtro: Filtro): UserRow[] {
  if (filtro === 'pendentes') return users.filter(u => u.role === 'pendente');
  if (filtro === 'ativos')    return users.filter(u => ['aluno', 'professor'].includes(u.role));
  if (filtro === 'suspensos') return users.filter(u => ['suspenso', 'inativo'].includes(u.role));
  return users;
}

export default function Usuarios() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast }   = useToast();

  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtro, setFiltro]       = useState<Filtro>('todos');

  const [users, setUsers]         = useState<UserRow[]>([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState<UsuariosStats>({ total: 0, alunos: 0, professores: 0, equipe: 0 });
  const [exclusoes, setExclusoes] = useState<UserRow[]>([]);
  const [procExclusao, setProcExclusao] = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);
  const [updating, setUpdating]   = useState<string | null>(null);

  const [editUser, setEditUser]   = useState<UserRow | null>(null);
  const [editForm, setEditForm]   = useState({ full_name: '', telefone: '' });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(value); setPage(1); }, 300);
  };

  useEffect(() => { getUsuariosStats().then(setStats); }, []);

  // Carrega fila de exclusões — apenas superadmin
  useEffect(() => {
    if (profile.role !== 'superadmin') return;
    let cancelled = false;
    getExclusoesPendentes().then(data => { if (!cancelled) setExclusoes(data); });
    return () => { cancelled = true; };
  }, [profile.role]);

  const handleAutorizarExclusao = async (userId: string) => {
    setProcExclusao(userId);
    const { error } = await executarExclusao(userId, profile.id);
    setProcExclusao(null);
    if (error) {
      toast({ title: 'Exclusão registrada', description: 'Exclusão executada — funcionalidade completa no Sprint L', variant: 'destructive' });
    }
    getExclusoesPendentes().then(setExclusoes);
  };

  const handleRecusarExclusao = async (userId: string) => {
    setProcExclusao(userId);
    const { error } = await recusarExclusao(userId, profile.id);
    setProcExclusao(null);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Solicitação recusada.' });
      getExclusoesPendentes().then(setExclusoes);
    }
  };

  const loadPage = useCallback(async () => {
    setLoading(true);
    const { data, total: t } = await getUsuarios(page, PAGE_SIZE, debouncedSearch);
    setUsers(data as UserRow[]);
    setTotal(t);
    setLoading(false);
  }, [page, debouncedSearch]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart  = (page - 1) * PAGE_SIZE + 1;
  const pageEnd    = Math.min(page * PAGE_SIZE, total);

  const pendentesCount = users.filter(u => u.role === 'pendente').length;
  const exibidos       = aplicarFiltro(users, filtro);

  const handleEditSave = async () => {
    if (!editUser) return;
    setUpdating(editUser.id);
    const { error } = await updateUsuario(editUser.id, editForm);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário atualizado!' });
      setEditUser(null);
      await loadPage();
      getUsuariosStats().then(setStats);
    }
    setUpdating(null);
  };

  return (
    <div className="p-6 space-y-6 relative">

      {/* Título + badge de pendentes */}
      <div className="flex items-center gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-merriweather font-bold text-primary">Gestão de Usuários</h1>
            {pendentesCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {pendentesCount} pendente{pendentesCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">Gerencie roles e acesso dos usuários do ITEC</p>
        </div>
      </div>

      {/* Fila de exclusões pendentes — apenas superadmin */}
      {profile.role === 'superadmin' && exclusoes.length > 0 && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
            Fila de Exclusões Pendentes ({exclusoes.length})
          </h2>
          <div className="space-y-2">
            {exclusoes.map(u => (
              <div key={u.id} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.exclusao_motivo && (
                    <p className="text-xs text-muted-foreground italic mt-0.5">"{u.exclusao_motivo}"</p>
                  )}
                  {u.exclusao_solicitada_em && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Solicitado em {new Date(u.exclusao_solicitada_em).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {procExclusao === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Button size="sm" variant="destructive" className="h-7 text-xs"
                        onClick={() => handleAutorizarExclusao(u.id)}>
                        Autorizar
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => handleRecusarExclusao(u.id)}>
                        Recusar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: stats.total,       icon: User },
          { label: 'Alunos',      value: stats.alunos,      icon: GraduationCap },
          { label: 'Professores', value: stats.professores,  icon: BookOpen },
          { label: 'Equipe',      value: stats.equipe,       icon: Shield },
        ].map(stat => (
          <div key={stat.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Busca + filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail..."
            className="pl-9 bg-background border-border text-foreground shadow-sm"
          />
        </div>
        <div className="flex gap-1 bg-muted/30 rounded-lg p-1 border border-border">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                filtro === f.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
              {f.key === 'pendentes' && pendentesCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px]">
                  {pendentesCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários...
          </div>
        ) : exibidos.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <Users className="h-10 w-10 opacity-30" />
            <p>{debouncedSearch ? 'Nenhum resultado encontrado.' : 'Nenhum usuário nesta categoria.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {['Usuário', 'Telefone', 'Role', 'Cadastro', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {exibidos.map((user, i) => {
                  const permitidas    = getRolesPermitidas(profile.role, user.role);
                  const options       = rolesParaOptions(permitidas);
                  const isMe          = user.id === profile.id;
                  return (
                    <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 !== 0 ? 'bg-muted/5' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.full_name}
                              {isMe && <span className="ml-1 text-xs text-muted-foreground">(você)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">{user.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.telefone ?? '—'}</td>
                      <td className="px-4 py-3">
                        {updating === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <InlineStatusSelect
                            value={user.role}
                            options={options}
                            disabled={permitidas.length === 0 || isMe}
                            onSave={async (novaRole) => {
                              setUpdating(user.id);
                              const result = await updateRole(user.id, novaRole, profile.id);
                              setUpdating(null);
                              if (result.error) throw new Error(result.error);
                              setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: novaRole as UserRow['role'] } : u));
                              getUsuariosStats().then(setStats);
                              toast({ title: 'Role atualizado!' });
                            }}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { setEditForm({ full_name: user.full_name || '', telefone: user.telefone || '' }); setEditUser(user); }}
                          className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                          title="Editar dados"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
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
            Exibindo {pageStart}–{pageEnd} de {total} usuário{total !== 1 ? 's' : ''}
            {debouncedSearch && <span className="ml-1">(filtrado)</span>}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading} className="h-7 px-2">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Página {page} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading} className="h-7 px-2">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal edição de dados (nome/telefone) */}
      {editUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold">Editar Usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Nome Completo</label>
                <Input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Telefone</label>
                <Input value={editForm.telefone} onChange={e => setEditForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" className="bg-background" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleEditSave} className="flex-1" disabled={updating === editUser.id}>
                {updating === editUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
              <Button variant="outline" onClick={() => setEditUser(null)} className="flex-1">Cancelar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
