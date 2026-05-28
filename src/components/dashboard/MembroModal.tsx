import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createMembro, updateMembro } from '@/services/equipe.service';
import type { MembroEquipe, MembroPayload } from '@/services/equipe.service';
import { useToast } from '@/hooks/use-toast';

interface MembroModalProps {
  membro?: MembroEquipe;
  onClose: () => void;
  onSaved: () => void;
}

const ROLES = [
  { value: 'superadmin',   label: 'SuperAdmin' },
  { value: 'admin',        label: 'Diretoria' },
  { value: 'administracao',label: 'Secretaria' },
  { value: 'professor',    label: 'Professor' },
  { value: 'juridico',     label: 'Jurídico' },
  { value: 'capelania',    label: 'Capelania' },
];

export function MembroModal({ membro, onClose, onSaved }: MembroModalProps) {
  const { toast } = useToast();
  const isEdit = !!membro;

  const [nome, setNome]             = useState(membro?.nome ?? '');
  const [cargo, setCargo]           = useState(membro?.cargo ?? '');
  const [role, setRole]             = useState(membro?.role_sistema ?? 'administracao');
  const [email, setEmail]           = useState(membro?.email ?? '');
  const [telefone, setTelefone]     = useState(membro?.telefone ?? '');
  const [saving, setSaving]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cargo.trim()) return;

    setSaving(true);

    if (isEdit && membro) {
      const { error } = await updateMembro(membro.id, {
        nome: nome.trim(),
        cargo: cargo.trim(),
        role_sistema: role,
        email: email || null,
        telefone: telefone || null,
      });
      setSaving(false);
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Membro atualizado!' });
        onSaved();
      }
    } else {
      const payload: MembroPayload = {
        user_id:      null,
        nome:         nome.trim(),
        cargo:        cargo.trim(),
        role_sistema: role,
        email:        email || null,
        telefone:     telefone || null,
        ativo:        true,
      };
      const { error } = await createMembro(payload);
      setSaving(false);
      if (error) {
        toast({ title: 'Erro ao cadastrar', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Membro adicionado!' });
        onSaved();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">
            {isEdit ? 'Editar Membro' : 'Novo Membro da Equipe'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} required className="bg-background border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Cargo *</Label>
            <Input value={cargo} onChange={e => setCargo(e.target.value)} placeholder="Ex: Reitor, Secretária..." required className="bg-background border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Role no sistema *</Label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-background border-border" />
          </div>
          <div className="space-y-1.5">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(81) 9 9999-9999" className="bg-background border-border" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEdit ? 'Salvar alterações' : 'Adicionar Membro'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
