import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { criarAluno } from '@/services/usuarios.service';
import { getTurmasAtivas } from '@/services/turmas.service';
import type { Turma } from '@/services/turmas.service';
import { sanitizeDate } from '@/utils/sanitize';

interface NovoAlunoModalProps {
  open: boolean;
  onClose: () => void;
  onCriado?: (userId: string) => void;
}

const VAZIO = {
  full_name: '', email: '', senha_temporaria: '',
  cpf: '', telefone: '', data_nascimento: '',
  turma_id: '', data_inicio: '',
  semestre_ingresso: '', obs_retroativa: '',
};

export function NovoAlunoModal({ open, onClose, onCriado }: NovoAlunoModalProps) {
  const { toast } = useToast();
  const [form, setForm]       = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [turmas, setTurmas]   = useState<Turma[]>([]);

  useEffect(() => {
    if (open) getTurmasAtivas().then(setTurmas);
  }, [open]);

  const set = (key: keyof typeof VAZIO) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const validar = (): string | null => {
    if (!form.full_name.trim()) return 'Nome completo é obrigatório';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'E-mail inválido';
    if (form.senha_temporaria.length < 8) return 'Senha deve ter ao menos 8 caracteres';
    if (form.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(form.cpf)) return 'CPF inválido (000.000.000-00)';
    return null;
  };

  const handleSubmit = async () => {
    const err = validar();
    if (err) { toast({ title: 'Atenção', description: err, variant: 'destructive' }); return; }
    setSalvando(true);
    const { error } = await criarAluno({
      email:              form.email.trim(),
      senha_temporaria:   form.senha_temporaria,
      full_name:          form.full_name.trim(),
      cpf:                form.cpf || undefined,
      telefone:           form.telefone || undefined,
      data_nascimento:    sanitizeDate(form.data_nascimento),
      turma_id:           form.turma_id || undefined,
      data_inicio:        sanitizeDate(form.data_inicio),
      semestre_ingresso:  form.semestre_ingresso || undefined,
      obs_retroativa:     form.obs_retroativa || undefined,
    });
    setSalvando(false);
    if (error) {
      toast({ title: 'Erro ao criar aluno', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Aluno criado!', description: 'Conta e matrícula registradas com sucesso.' });
      setForm(VAZIO);
      onClose();
      onCriado?.('');
    }
  };

  const handleClose = () => { setForm(VAZIO); onClose(); };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Aluno</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* ── Dados Pessoais ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              Dados Pessoais
            </p>
            <Field label="Nome completo *">
              <Input value={form.full_name} onChange={set('full_name')} placeholder="João da Silva" />
            </Field>
            <Field label="E-mail *">
              <Input type="email" value={form.email} onChange={set('email')} placeholder="joao@email.com" />
            </Field>
            <Field label="Senha temporária *">
              <Input type="password" value={form.senha_temporaria} onChange={set('senha_temporaria')} placeholder="Mínimo 8 caracteres" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="CPF">
                <Input value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" />
              </Field>
              <Field label="Telefone">
                <Input value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
              </Field>
            </div>
            <Field label="Data de nascimento">
              <Input type="date" value={form.data_nascimento} onChange={set('data_nascimento')} />
            </Field>
          </div>

          {/* ── Dados Acadêmicos ── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
              Dados Acadêmicos
            </p>
            <Field label="Turma">
              <select
                value={form.turma_id}
                onChange={set('turma_id')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecionar turma...</option>
                {turmas.map(t => <option key={t.id} value={t.id}>{t.codigo} — {t.nome}</option>)}
              </select>
            </Field>
            <Field label="Data de início" hint="Para alunos retroativos, informe a data real">
              <Input type="date" value={form.data_inicio} onChange={set('data_inicio')} />
            </Field>
            <Field label="Semestre de ingresso">
              <Input value={form.semestre_ingresso} onChange={set('semestre_ingresso')} placeholder="Ex: 2025-1, 2026-1" />
            </Field>
            <Field label="Observação (opcional)" hint="Use para registrar contexto de cadastro retroativo">
              <Textarea value={form.obs_retroativa} onChange={set('obs_retroativa')} rows={3}
                placeholder="Aluno cursou o módulo 1 em 2025 presencialmente..." />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={salvando}>
            {salvando ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Criando...</> : 'Criar Aluno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground block">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
