import React, { useState } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { createLead } from '@/services/leads.service';
import { generateCoursePdf } from '@/lib/generateCoursePdf';
import type { Course } from '@/data/courses';

interface LeadCaptureModalProps {
  course: Course;
  onClose: () => void;
}

const INTERESSE_OPTIONS = [
  { value: 'candidato', label: 'Sou candidato à matrícula' },
  { value: 'informacoes', label: 'Quero mais informações' },
  { value: 'outro', label: 'Outro' },
];

export function LeadCaptureModal({ course, onClose }: LeadCaptureModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nome: '', telefone: '', email: '', interesse: '' });
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.nome.trim())      e.nome = 'Nome é obrigatório';
    if (!form.telefone.trim())  e.telefone = 'Telefone é obrigatório';
    if (!form.email.trim())     e.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'E-mail inválido';
    if (!form.interesse)        e.interesse = 'Selecione uma opção';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await createLead({ ...form, curso_interesse: course.id });
      generateCoursePdf(course.id);
      toast({ title: 'Grade baixada com sucesso!', description: `A grade do curso ${course.nome} foi gerada.`, duration: 4000 });
      onClose();
    } catch {
      toast({ title: 'Erro ao processar', description: 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-primary/10 border-b border-border px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">Baixar Grade Curricular</p>
            <h2 className="text-lg font-merriweather font-bold text-foreground">{course.nome}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{course.badge}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground mt-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            Preencha seus dados para receber a grade completa do curso.
          </p>

          <div className="space-y-1">
            <Label htmlFor="nome" className="text-foreground">Nome completo <span className="text-primary">*</span></Label>
            <Input
              id="nome"
              value={form.nome}
              onChange={e => field('nome', e.target.value)}
              placeholder="Seu nome completo"
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${errors.nome ? 'border-destructive' : ''}`}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone" className="text-foreground">WhatsApp / Telefone <span className="text-primary">*</span></Label>
            <Input
              id="telefone"
              value={form.telefone}
              onChange={e => field('telefone', e.target.value)}
              placeholder="(81) 99999-0000"
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${errors.telefone ? 'border-destructive' : ''}`}
            />
            {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-foreground">E-mail <span className="text-primary">*</span></Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => field('email', e.target.value)}
              placeholder="seu@email.com"
              className={`bg-background border-border text-foreground placeholder:text-muted-foreground ${errors.email ? 'border-destructive' : ''}`}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Interesse <span className="text-primary">*</span></Label>
            <div className="space-y-2">
              {INTERESSE_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                    form.interesse === opt.value
                      ? 'border-primary bg-primary'
                      : 'border-border group-hover:border-primary/50'
                  }`}>
                    {form.interesse === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </div>
                  <span
                    className="text-sm text-foreground"
                    onClick={() => field('interesse', opt.value)}
                  >
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.interesse && <p className="text-xs text-destructive">{errors.interesse}</p>}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold mt-2"
          >
            {loading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Receber Grade e Baixar PDF</>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Seus dados são usados apenas pela secretaria do ITEC.
          </p>
        </form>
      </div>
    </div>
  );
}
