import React, { useEffect, useState } from 'react';
import { Users, Plus, Pencil, UserX, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getEquipe, desativarMembro } from '@/services/equipe.service';
import type { MembroEquipe } from '@/services/equipe.service';
import { MembroModal } from '@/components/dashboard/MembroModal';
import { useToast } from '@/hooks/use-toast';

const CARGO_COLORS: Record<string, string> = {
  superadmin:    'bg-primary/20 text-primary border-primary/30',
  admin:         'bg-red-500/20 text-red-400 border-red-500/30',
  administracao: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  professor:     'bg-green-500/20 text-green-400 border-green-500/30',
  juridico:      'bg-purple-500/20 text-purple-400 border-purple-500/30',
  capelania:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const ROLE_LABELS: Record<string, string> = {
  superadmin:    'SuperAdmin',
  admin:         'Diretoria',
  administracao: 'Secretaria',
  professor:     'Professor',
  juridico:      'Jurídico',
  capelania:     'Capelania',
};

function Iniciais({ nome }: { nome: string }) {
  const partes = nome.trim().split(/\s+/);
  const ini = partes.length >= 2
    ? partes[0][0] + partes[partes.length - 1][0]
    : partes[0].slice(0, 2);
  return <span className="text-lg font-bold text-primary">{ini.toUpperCase()}</span>;
}

export default function EquipeITEC() {
  const { toast } = useToast();
  const [membros, setMembros] = useState<MembroEquipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState<MembroEquipe | 'new' | null>(null);
  const [showInativos, setShowInativos] = useState(false);

  const load = async () => {
    setLoading(true);
    setMembros(await getEquipe());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const visiveis = showInativos ? membros : membros.filter(m => m.ativo);

  const handleDesativar = async (m: MembroEquipe) => {
    if (!confirm(`Desativar ${m.nome}?`)) return;
    const { error } = await desativarMembro(m.id);
    if (error) {
      toast({ title: 'Erro', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Membro desativado.' });
      load();
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Equipe ITEC</h1>
          <p className="text-muted-foreground mt-1">Gestão da equipe do Instituto de Teologia Cristã</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setModal('new')} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Membro
          </Button>
        </div>
      </div>

      {/* Filtro inativos */}
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none w-fit">
        <input type="checkbox" checked={showInativos} onChange={e => setShowInativos(e.target.checked)} className="rounded" />
        Mostrar inativos
      </label>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: membros.filter(m => m.ativo).length },
          { label: 'Diretoria', value: membros.filter(m => m.ativo && m.role_sistema === 'admin').length },
          { label: 'Secretaria', value: membros.filter(m => m.ativo && m.role_sistema === 'administracao').length },
          { label: 'Outros', value: membros.filter(m => m.ativo && !['admin','administracao'].includes(m.role_sistema)).length },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 p-12 text-muted-foreground animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando equipe...
        </div>
      ) : visiveis.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center text-muted-foreground gap-3">
          <Users className="h-10 w-10 opacity-30" />
          <p>Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visiveis.map(m => {
            const colorClass = CARGO_COLORS[m.role_sistema] ?? CARGO_COLORS.administracao;
            return (
              <div
                key={m.id}
                className={`bg-card border rounded-xl p-5 space-y-3 transition-all hover:shadow-md ${m.ativo ? 'border-border' : 'border-border/40 opacity-60'}`}
              >
                {/* Avatar */}
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    <Iniciais nome={m.nome} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{m.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">{m.cargo}</p>
                  </div>
                </div>

                {/* Role badge */}
                <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
                  {ROLE_LABELS[m.role_sistema] ?? m.role_sistema}
                </span>

                {/* Contato */}
                {(m.email || m.telefone) && (
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {m.email && <p className="truncate">{m.email}</p>}
                    {m.telefone && <p>{m.telefone}</p>}
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-1 pt-1">
                  <button
                    onClick={() => setModal(m)}
                    title="Editar"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {m.ativo && (
                    <button
                      onClick={() => handleDesativar(m)}
                      title="Desativar"
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal !== null && (
        <MembroModal
          membro={modal === 'new' ? undefined : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
