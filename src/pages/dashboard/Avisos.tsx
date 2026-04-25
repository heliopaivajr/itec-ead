import React, { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Megaphone, Plus, RefreshCw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AvisoCard, type Aviso } from '@/components/avisos/AvisoCard';
import { NovoAvisoModal } from '@/components/avisos/NovoAvisoModal';
import { supabase } from '@/lib/supabase';
import { isSuperAdmin, isProfessor, isAdministracao } from '../Dashboard';
import type { DashboardContext } from '../Dashboard';

const FILTROS = [
  { key: 'todos',       label: 'Todos' },
  { key: 'alunos',      label: 'Alunos' },
  { key: 'professores', label: 'Professores' },
  { key: 'admin',       label: 'Administração' },
];

export default function Avisos() {
  const { profile } = useOutletContext<DashboardContext>();
  const [avisos, setAvisos]       = useState<Aviso[]>([]);
  const [loading, setLoading]     = useState(true);
  const [noTable, setNoTable]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filtro, setFiltro]       = useState('todos');
  const [busca, setBusca]         = useState('');

  const canPublish = isSuperAdmin(profile.role) || isAdministracao(profile.role) || isProfessor(profile.role);
  const canDelete  = isSuperAdmin(profile.role) || isAdministracao(profile.role);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('avisos')
      .select('*, autor:profiles(full_name, role)')
      .order('fixado', { ascending: false })
      .order('criado_em', { ascending: false });

    if (error) {
      if (error.message.includes('does not exist') || error.code === '42P01') {
        setNoTable(true);
      }
      setLoading(false);
      return;
    }

    setAvisos((data ?? []) as Aviso[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    await supabase.from('avisos').delete().eq('id', id);
    setAvisos(prev => prev.filter(a => a.id !== id));
  };

  const visiveis = avisos
    .filter(a => {
      if (filtro !== 'todos') return a.role_destino === filtro || a.role_destino === 'todos';
      return true;
    })
    .filter(a =>
      !busca ||
      a.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      (a.conteudo ?? '').toLowerCase().includes(busca.toLowerCase())
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Mural de Avisos</h1>
          <p className="text-muted-foreground mt-1">Comunicados da secretaria e dos professores</p>
        </div>
        {canPublish && (
          <Button onClick={() => setShowModal(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            Novo Aviso
          </Button>
        )}
      </div>

      {/* Filtros + Busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/40 border border-border rounded-xl p-1 w-fit">
          {FILTROS.map(f => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filtro === f.key
                  ? 'bg-card border border-border text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar aviso..."
          className="max-w-xs bg-background border-border text-foreground"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : noTable ? (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-8 flex flex-col items-center text-center gap-3">
          <Megaphone className="h-10 w-10 text-yellow-500/60" />
          <div>
            <p className="font-semibold text-foreground">Tabela de avisos não encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Execute o script SQL <code className="text-primary">migration_avisos.sql</code> no Supabase para ativar o Mural de Avisos.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} className="gap-2 mt-1">
            <RefreshCw className="h-3.5 w-3.5" /> Tentar novamente
          </Button>
        </div>
      ) : visiveis.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 flex flex-col items-center text-center gap-3">
          <SearchX className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-semibold text-foreground">
              {busca ? 'Nenhum aviso encontrado' : 'Nenhum aviso publicado ainda'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {busca
                ? 'Tente buscar com outras palavras.'
                : canPublish
                  ? 'Clique em "Novo Aviso" para publicar o primeiro comunicado.'
                  : 'Os comunicados dos professores e da secretaria aparecerão aqui.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visiveis.map(aviso => (
            <AvisoCard
              key={aviso.id}
              aviso={aviso}
              canDelete={canDelete}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <NovoAvisoModal
          autorId={profile.id}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}
