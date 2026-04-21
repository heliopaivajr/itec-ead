import React, { useState } from 'react';
import { X, Pin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface NovoAvisoModalProps {
  autorId: string;
  onClose: () => void;
  onCreated: () => void;
}

const DESTINOS = [
  { value: 'todos',       label: 'Todos' },
  { value: 'alunos',      label: 'Somente Alunos' },
  { value: 'professores', label: 'Somente Professores' },
  { value: 'admin',       label: 'Administração' },
];

export function NovoAvisoModal({ autorId, onClose, onCreated }: NovoAvisoModalProps) {
  const { toast } = useToast();
  const [titulo, setTitulo]     = useState('');
  const [conteudo, setConteudo] = useState('');
  const [destino, setDestino]   = useState('todos');
  const [fixado, setFixado]     = useState(false);
  const [expira, setExpira]     = useState('');
  const [saving, setSaving]     = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    setSaving(true);
    const { error } = await supabase.from('avisos').insert({
      titulo:        titulo.trim(),
      conteudo:      conteudo.trim() || null,
      autor_id:      autorId,
      role_destino:  destino,
      fixado,
      expira_em:     expira || null,
    });

    setSaving(false);

    if (error) {
      toast({ title: 'Erro ao criar aviso', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Aviso publicado!', description: 'O aviso foi enviado para os destinatários.' });
      onCreated();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">Novo Aviso</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Título *</label>
            <Input
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              placeholder="Ex: Prova de Exegese — 25/04"
              required
              className="bg-background border-border text-foreground"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mensagem</label>
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              rows={4}
              placeholder="Detalhes do aviso..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Destinatário</label>
              <select
                value={destino}
                onChange={e => setDestino(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              >
                {DESTINOS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Expira em (opcional)</label>
              <Input
                type="date"
                value={expira}
                onChange={e => setExpira(e.target.value)}
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setFixado(v => !v)}
              className={`relative h-5 w-9 rounded-full transition-colors ${fixado ? 'bg-primary' : 'bg-muted'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${fixado ? 'translate-x-4' : ''}`} />
            </div>
            <span className="flex items-center gap-1.5 text-sm text-foreground">
              <Pin className="h-3.5 w-3.5 text-primary" />
              Fixar no topo do mural
            </span>
          </label>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving || !titulo.trim()} className="flex-1 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Publicar Aviso
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="border-border text-foreground">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
