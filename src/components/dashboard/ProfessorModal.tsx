import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProfessor, updateProfessor } from '@/services/professor.service';
import type { Professor, ProfessorPayload } from '@/services/professor.service';
import { useToast } from '@/hooks/use-toast';

interface ProfessorModalProps {
  professor?: Professor;
  onClose: () => void;
  onSaved: () => void;
}

type FormData = {
  nome_completo: string;
  cpf: string;
  rg: string;
  data_nascimento: string;
  telefone: string;
  email: string;
  endereco: string;
  formacao: string;
  titulacao: string;
  igreja_local: string;
  experiencia_ministerial: string;
};

const empty: FormData = {
  nome_completo: '', cpf: '', rg: '', data_nascimento: '',
  telefone: '', email: '', endereco: '', formacao: '',
  titulacao: '', igreja_local: '', experiencia_ministerial: '',
};

export function ProfessorModal({ professor, onClose, onSaved }: ProfessorModalProps) {
  const { toast } = useToast();
  const isEdit = !!professor;

  const [form, setForm] = useState<FormData>(
    professor ? {
      nome_completo:           professor.nome_completo,
      cpf:                     professor.cpf,
      rg:                      professor.rg ?? '',
      data_nascimento:         professor.data_nascimento ?? '',
      telefone:                professor.telefone ?? '',
      email:                   professor.email,
      endereco:                professor.endereco ?? '',
      formacao:                professor.formacao ?? '',
      titulacao:               professor.titulacao ?? '',
      igreja_local:            professor.igreja_local ?? '',
      experiencia_ministerial: professor.experiencia_ministerial ?? '',
    } : empty
  );
  const [saving, setSaving] = useState(false);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome_completo.trim() || !form.cpf.trim() || !form.email.trim()) return;

    setSaving(true);

    if (isEdit && professor) {
      const { error } = await updateProfessor(professor.id, {
        ...form,
        rg:                      form.rg || null,
        data_nascimento:         form.data_nascimento || null,
        telefone:                form.telefone || null,
        endereco:                form.endereco || null,
        formacao:                form.formacao || null,
        titulacao:               form.titulacao || null,
        igreja_local:            form.igreja_local || null,
        experiencia_ministerial: form.experiencia_ministerial || null,
      });
      setSaving(false);
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Professor atualizado!', description: 'Dados salvos com sucesso.' });
        onSaved();
      }
    } else {
      const payload: ProfessorPayload = {
        user_id:                 null,
        nome_completo:           form.nome_completo.trim(),
        cpf:                     form.cpf.trim(),
        rg:                      form.rg || null,
        data_nascimento:         form.data_nascimento || null,
        telefone:                form.telefone || null,
        email:                   form.email.trim(),
        endereco:                form.endereco || null,
        formacao:                form.formacao || null,
        titulacao:               form.titulacao || null,
        igreja_local:            form.igreja_local || null,
        experiencia_ministerial: form.experiencia_ministerial || null,
        ativo:                   true,
      };
      const { error } = await createProfessor(payload);
      setSaving(false);
      if (error) {
        toast({ title: 'Erro ao cadastrar', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Professor cadastrado!', description: 'Perfil criado com sucesso.' });
        onSaved();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-merriweather font-bold text-foreground">
            {isEdit ? 'Editar Professor' : 'Novo Professor'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Nome completo *</Label>
              <Input value={form.nome_completo} onChange={set('nome_completo')} required className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>CPF *</Label>
              <Input value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" required className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>RG</Label>
              <Input value={form.rg} onChange={set('rg')} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone *</Label>
              <Input value={form.telefone} onChange={set('telefone')} placeholder="(81) 9 9999-9999" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={set('email')} required className="bg-background border-border" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={set('endereco')} className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Formação teológica *</Label>
              <Input value={form.formacao} onChange={set('formacao')} placeholder="Ex: Bacharel em Teologia" className="bg-background border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Titulação</Label>
              <Input value={form.titulacao} onChange={set('titulacao')} placeholder="Ex: Mestre, Doutor" className="bg-background border-border" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Igreja local *</Label>
              <Input value={form.igreja_local} onChange={set('igreja_local')} className="bg-background border-border" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Experiência ministerial</Label>
              <textarea
                value={form.experiencia_ministerial}
                onChange={set('experiencia_ministerial')}
                rows={3}
                placeholder="Descreva brevemente a experiência ministerial..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isEdit ? 'Salvar alterações' : 'Cadastrar Professor'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
