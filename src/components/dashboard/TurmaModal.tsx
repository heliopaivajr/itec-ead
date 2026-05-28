import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createTurma, updateTurma } from '@/services/turmas.service';
import type { Turma, TurmaPayload } from '@/services/turmas.service';

interface Props {
  turma: Turma | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  ativa:     'Ativa',
  planejada: 'Planejada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
};

const EMPTY: TurmaPayload = {
  codigo:      '',
  nome:        '',
  ano:         new Date().getFullYear(),
  semestre:    1,
  data_inicio: '',
  status:      'ativa',
  vagas_total: 30,
  observacoes: '',
};

export function TurmaModal({ turma, onClose, onSaved }: Props) {
  const isNew = turma === 'new';
  const [form, setForm] = useState<TurmaPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!turma || turma === 'new') { setForm(EMPTY); return; }
    setForm({
      codigo:      turma.codigo,
      nome:        turma.nome,
      ano:         turma.ano,
      semestre:    turma.semestre,
      data_inicio: turma.data_inicio,
      data_fim:    turma.data_fim ?? '',
      status:      turma.status,
      vagas_total: turma.vagas_total,
      observacoes: turma.observacoes ?? '',
    });
  }, [turma]);

  const set = (k: keyof TurmaPayload, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nome.trim() || !form.data_inicio) {
      setError('Código, nome e data de início são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      ...form,
      data_fim:    form.data_fim || null,
      observacoes: form.observacoes || null,
    };

    const result = isNew
      ? await createTurma(payload)
      : await updateTurma((turma as Turma).id, payload);

    setSaving(false);
    if (result.error) { setError(result.error); return; }
    onSaved();
  };

  if (!turma) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-semibold">
            {isNew ? 'Nova Turma' : 'Editar Turma'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Código *</Label>
              <Input
                placeholder="ex: TEO-2026-3"
                value={form.codigo}
                onChange={e => set('codigo', e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>Nome *</Label>
            <Input
              placeholder="ex: 3ª Turma Teologia — 2026"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Ano</Label>
              <Input
                type="number"
                min={2020}
                max={2040}
                value={form.ano}
                onChange={e => set('ano', Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <Label>Semestre</Label>
              <Select value={String(form.semestre ?? '')} onValueChange={v => set('semestre', Number(v))}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1º</SelectItem>
                  <SelectItem value="2">2º</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Vagas</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.vagas_total}
                onChange={e => set('vagas_total', Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Data de início *</Label>
              <Input
                type="date"
                value={form.data_inicio}
                onChange={e => set('data_inicio', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Data de encerramento</Label>
              <Input
                type="date"
                value={form.data_fim ?? ''}
                onChange={e => set('data_fim', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observações</Label>
            <Textarea
              rows={3}
              placeholder="Informações adicionais..."
              value={form.observacoes ?? ''}
              onChange={e => set('observacoes', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 p-5 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isNew ? 'Criar Turma' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
