import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDatePtBR } from '@/utils/date';

// InlineField — edição inline "no local" (SPEC-16 P0 · diretriz 8.10).
// Clicar no valor → vira input NO LUGAR → Enter/blur confirma · Esc cancela.
// Sem ícone de lápis, sem modal, sem redirect.
//
// GENÉRICO de propósito: não conhece tabela, service nem entidade — quem chama
// decide o que fazer no onSave. Consumido por P1 (dados pessoais) e P2 (histórico).
//
// LICAO-027 — não engole erro: se o onSave lançar, o campo PERMANECE em edição
// com o texto digitado e mostra a mensagem; quem chamou continua livre para
// exibir o toast (o erro chegou até ele porque foi ele quem lançou).

export interface InlineFieldOption {
  value: string;
  label: string;
}

export interface InlineFieldProps {
  /** Valor atual vindo do servidor. `date` espera 'YYYY-MM-DD'. */
  value: string | null | undefined;
  /** Persiste o novo valor. Lançar erro = falhou (mantém em edição). */
  onSave: (novo: string) => void | Promise<void>;
  type?: 'text' | 'number' | 'date';
  /**
   * Quando presente, o campo vira SELECT (enum). Obrigatório para colunas com
   * CHECK constraint — texto livre violaria o banco (ERR-LOGIC-003).
   * Os `value` devem bater exatamente com o CHECK da tabela.
   */
  options?: InlineFieldOption[];
  /** Texto do estado vazio — sempre clicável, o campo NUNCA some. */
  placeholder?: string;
  disabled?: boolean;
  /** Validação plugável: retorna mensagem de erro ou null. Ex.: nota 0–10. */
  validate?: (valor: string) => string | null;
  /** Nome do campo para leitores de tela (ex.: "Telefone"). */
  label?: string;
  className?: string;
}

export function InlineField({
  value,
  onSave,
  type = 'text',
  options,
  placeholder = '— clique para preencher',
  disabled = false,
  validate,
  label,
  className = '',
}: InlineFieldProps) {
  const [editando, setEditando] = useState(false);
  const [draft, setDraft]       = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro]         = useState<string | null>(null);

  const inputRef  = useRef<HTMLInputElement>(null);
  const cancelou  = useRef(false);   // evita o blur re-confirmar após Esc
  const emCurso   = useRef(false);   // reentrância: Enter + blur no mesmo gesto

  useEffect(() => {
    if (editando) inputRef.current?.focus();
  }, [editando]);

  const atual = value ?? '';

  const abrir = () => {
    if (disabled) return;
    cancelou.current = false;
    setDraft(atual);
    setErro(null);
    setEditando(true);
  };

  const cancelar = () => {
    cancelou.current = true;
    setErro(null);
    setEditando(false);
  };

  const confirmar = async (valorExplicito?: string) => {
    if (cancelou.current || emCurso.current) return;

    // valorExplicito: o <select> confirma no onChange (não espera o estado assentar).
    const novo = (valorExplicito ?? draft).trim();
    if (novo === atual) { setEditando(false); return; }   // nada mudou

    const msgValidacao = validate?.(novo) ?? null;
    if (msgValidacao) { setErro(msgValidacao); inputRef.current?.focus(); return; }

    emCurso.current = true;
    setSalvando(true);
    try {
      await onSave(novo);
      setErro(null);
      setEditando(false);
    } catch (e) {
      // LICAO-027: mantém o digitado e mostra o motivo — nunca descarta em silêncio.
      setErro(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      emCurso.current = false;
      setSalvando(false);
    }
  };

  if (editando && options) {
    return (
      <span className={`inline-flex flex-col gap-1 ${className}`}>
        <select
          autoFocus
          value={draft}
          disabled={salvando}
          aria-label={label}
          onChange={e => { setDraft(e.target.value); void confirmar(e.target.value); }}
          onBlur={() => setEditando(false)}
          onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); cancelar(); } }}
          className="h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">— não informado</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {erro && <span role="alert" className="text-xs text-red-500">{erro}</span>}
      </span>
    );
  }

  if (editando) {
    return (
      <span className={`inline-flex flex-col gap-1 ${className}`}>
        <span className="inline-flex items-center gap-1.5">
          <Input
            ref={inputRef}
            type={type}
            value={draft}
            disabled={salvando}
            aria-label={label}
            aria-invalid={!!erro}
            onChange={e => { setDraft(e.target.value); if (erro) setErro(null); }}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); void confirmar(); }
              if (e.key === 'Escape') { e.preventDefault(); cancelar(); }
            }}
            onBlur={() => void confirmar()}
            className="h-8 bg-background"
          />
          {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
        </span>
        {erro && <span role="alert" className="text-xs text-red-500">{erro}</span>}
      </span>
    );
  }

  const exibicao = !atual
    ? placeholder
    : options    ? (options.find(o => o.value === atual)?.label ?? atual)
    : type === 'date' ? formatDatePtBR(atual)
    : atual;

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={disabled}
      aria-label={label ? `Editar ${label}` : 'Editar campo'}
      className={`text-left rounded px-1 -mx-1 transition-colors
        ${disabled
          ? 'cursor-default text-foreground'
          : 'hover:bg-muted/60 cursor-text'}
        ${!atual ? 'text-muted-foreground italic' : 'text-foreground'} ${className}`}
    >
      {exibicao}
    </button>
  );
}

export default InlineField;
