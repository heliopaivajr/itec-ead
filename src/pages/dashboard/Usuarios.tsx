import React, { useEffect, useState } from 'react';
import { Search, User, Shield, GraduationCap, BookOpen, Loader2, Users, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getUsuarios, updateRole, updateUsuario } from '@/services/usuarios.service';
import { useToast } from '@/hooks/use-toast';

interface UserRow {
  id: string;
  full_name: string;
  email?: string;
  role: 'aluno' | 'professor' | 'administracao' | 'admin' | 'superadmin';
  telefone?: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  aluno:         { label: 'Aluno',          color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',   icon: GraduationCap },
  professor:     { label: 'Professor',      color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: BookOpen },
  administracao: { label: 'Secretaria',     color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Users },
  admin:         { label: 'Diretoria',      color: 'bg-red-500/20 text-red-400 border-red-500/30',      icon: Shield },
  superadmin:    { label: 'SuperAdmin',     color: 'bg-gray-800 text-white border-gray-600',            icon: Shield },
};

export default function Usuarios() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  
  // Modal Edit State
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', telefone: '', role: 'aluno' });

  const load = async () => {
    setLoading(true);
    setUsers(await getUsuarios());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (userId: string, newRole: UserRow['role']) => {
    setUpdating(userId);
    const { error } = await updateRole(userId, newRole);

    if (error) {
      toast({ title: 'Erro ao atualizar role', description: error, variant: 'destructive' });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Role atualizado!', description: 'Permissão do usuário alterada com sucesso.' });
    }
    setUpdating(null);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    setUpdating(editUser.id);
    const { error } = await updateUsuario(editUser.id, editForm);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Usuário atualizado!', description: 'Dados salvos com sucesso.' });
      await load();
      setEditUser(null);
    }
    setUpdating(null);
  };

  const openEdit = (user: UserRow) => {
    setEditForm({ full_name: user.full_name || '', telefone: user.telefone || '', role: user.role });
    setEditUser(user);
  };

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleCount = (roles: string[]) => users.filter(u => roles.includes(u.role)).length;

  return (
    <div className="p-6 space-y-6 relative">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Usuários</h1>
        <p className="text-muted-foreground mt-1">Gestão de alunos, professores e equipe do ITEC</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: users.length, icon: User },
          { label: 'Alunos', value: roleCount(['aluno']), icon: GraduationCap },
          { label: 'Professores', value: roleCount(['professor']), icon: BookOpen },
          { label: 'Equipe', value: roleCount(['administracao', 'admin']), icon: Shield },
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

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          className="pl-9 bg-background border-border text-foreground shadow-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando usuários...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground gap-2">
            <User className="h-10 w-10 opacity-30" />
            <p>{search ? 'Nenhum resultado.' : 'Nenhum usuário cadastrado.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usuário</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cadastro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => {
                  const rc = roleConfig[user.role] || roleConfig['aluno'];
                  const RoleIcon = rc.icon;
                  return (
                    <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${i % 2 === 0 ? '' : 'bg-muted/5'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email ?? '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.telefone ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${rc.color}`}>
                          <RoleIcon className="h-3 w-3" /> {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {updating === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          ) : (
                            <>
                              <select
                                value={user.role}
                                onChange={e => changeRole(user.id, e.target.value as UserRow['role'])}
                                className="text-xs bg-background border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              >
                                <option value="aluno">Aluno</option>
                                <option value="professor">Professor</option>
                                <option value="administracao">Secretaria</option>
                                <option value="admin">Diretoria</option>
                              </select>
                              <button 
                                onClick={() => openEdit(user)}
                                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                                title="Editar Usuário"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Exibindo {filtered.length} de {users.length} usuários
        </p>
      )}

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-lg space-y-4">
            <h2 className="text-lg font-bold">Editar Usuário</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Nome Completo</label>
                <Input 
                  value={editForm.full_name} 
                  onChange={e => setEditForm(prev => ({...prev, full_name: e.target.value}))} 
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Telefone</label>
                <Input 
                  value={editForm.telefone} 
                  onChange={e => setEditForm(prev => ({...prev, telefone: e.target.value}))} 
                  placeholder="(00) 00000-0000"
                  className="bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm(prev => ({...prev, role: e.target.value}))}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="aluno">Aluno</option>
                  <option value="professor">Professor</option>
                  <option value="administracao">Secretaria</option>
                  <option value="admin">Diretoria</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={handleEditSave} 
                className="flex-1"
                disabled={updating === editUser.id}
              >
                {updating === editUser.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setEditUser(null)} 
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
