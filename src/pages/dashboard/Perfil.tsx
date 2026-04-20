import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

const roleLabel: Record<string, string> = {
  aluno: 'Aluno',
  professor: 'Professor',
  admin: 'Administrador',
};

const roleBadge: Record<string, string> = {
  aluno: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  professor: 'bg-green-500/20 text-green-400 border-green-500/30',
  admin: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function Perfil() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(profile.full_name ?? '');
  const [telefone, setTelefone] = useState(profile.telefone ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, telefone, bio, updated_at: new Date().toISOString() })
      .eq('id', profile.id);

    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas com sucesso.' });
    }
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40">
            {profile.foto_url ? (
              <img src={profile.foto_url} alt={profile.full_name} className="h-full w-full rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>
          <button className="absolute bottom-0 right-0 h-7 w-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors">
            <Camera className="h-3.5 w-3.5 text-primary-foreground" />
          </button>
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge[profile.role]}`}>
            {roleLabel[profile.role]}
          </span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Dados pessoais</h2>

        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            value={profile.email ?? ''}
            disabled
            className="bg-muted border-border text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">WhatsApp / Telefone</Label>
          <Input
            id="telefone"
            value={telefone}
            onChange={e => setTelefone(e.target.value)}
            placeholder="(81) 9 9999-9999"
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Bio / Apresentação</Label>
          <textarea
            id="bio"
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={4}
            placeholder="Conte um pouco sobre você..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none"
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </div>
    </div>
  );
}
