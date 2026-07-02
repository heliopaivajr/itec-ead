import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface StatusOption {
  value: string;
  label: string;
  color: string; // Tailwind classes ex: 'bg-green-100 text-green-800'
}

interface InlineStatusSelectProps {
  value: string;
  options: StatusOption[];
  onSave: (newValue: string) => Promise<void>;
  disabled?: boolean;
}

type Estado = 'idle' | 'editing' | 'saving';

export function InlineStatusSelect({ value, options, onSave, disabled = false }: InlineStatusSelectProps) {
  const [estado, setEstado] = useState<Estado>('idle');
  const [current, setCurrent] = useState(value);
  const selectRef = useRef<HTMLSelectElement>(null);
  const { toast } = useToast();

  // Sincroniza quando o valor externo muda (ex: reload da tabela)
  useEffect(() => { setCurrent(value); }, [value]);

  // Foca o select ao entrar em editing
  useEffect(() => {
    if (estado === 'editing') selectRef.current?.focus();
  }, [estado]);

  const option = options.find(o => o.value === current) ?? options[0];

  const handleSelect = async (newValue: string) => {
    if (newValue === current) { setEstado('idle'); return; }
    setEstado('saving');
    const previous = current;
    setCurrent(newValue);
    try {
      await onSave(newValue);
      setEstado('idle');
    } catch {
      setCurrent(previous);
      setEstado('idle');
      toast({ title: 'Erro ao salvar', description: 'Não foi possível atualizar o status.', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setEstado('idle');
  };

  if (disabled) {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${option?.color ?? ''}`}>
        {option?.label ?? current}
      </span>
    );
  }

  if (estado === 'saving') {
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  }

  if (estado === 'editing') {
    return (
      <select
        ref={selectRef}
        value={current}
        onChange={e => handleSelect(e.target.value)}
        onBlur={() => setEstado('idle')}
        onKeyDown={handleKeyDown}
        className="text-xs rounded border border-border bg-background px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }

  return (
    <button
      onClick={() => setEstado('editing')}
      title="Clique para editar"
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${option?.color ?? ''}`}
    >
      {option?.label ?? current}
    </button>
  );
}

/*
EXEMPLO DE USO:

const STATUS_ALUNO: StatusOption[] = [
  { value: 'ativo',     label: 'Ativo',     color: 'bg-green-100 text-green-800' },
  { value: 'inativo',   label: 'Inativo',   color: 'bg-gray-100 text-gray-600'  },
  { value: 'trancado',  label: 'Trancado',  color: 'bg-yellow-100 text-yellow-800' },
  { value: 'evadido',   label: 'Evadido',   color: 'bg-red-100 text-red-700'    },
  { value: 'concluido', label: 'Concluído', color: 'bg-blue-100 text-blue-800'  },
  { value: 'suspenso',  label: 'Suspenso',  color: 'bg-orange-100 text-orange-800' },
];

<InlineStatusSelect
  value={aluno.status}
  options={STATUS_ALUNO}
  onSave={async (novoStatus) => {
    const { error } = await mudarStatusMatricula(aluno.matriculaId, novoStatus, undefined, requesterId);
    if (error) throw new Error(error);
  }}
/>
*/
