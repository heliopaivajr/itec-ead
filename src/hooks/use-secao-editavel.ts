import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

// Estado local pendente + save em LOTE POR SEÇÃO (SPEC-16 · RN6 · diretriz 8.10).
// Mesmo padrão já validado na Frequência flex: marcar/editar altera só a tela;
// um único update persiste tudo da seção quando a secretaria clica em "Salvar".
//
// Por que por seção e não global: um "salvar tudo" faria um update gigante e
// arriscaria a ficha inteira num erro só. Cada bloco (Dados, Endereço, Ministério)
// falha e se recupera sozinho.

/** Payload enviado ao service: `null` limpa a coluna (campo "não informado"). */
export type PayloadSecao = Record<string, string | null>;

interface OpcoesSecao {
  /** Persiste as alterações. Padrão dos services do projeto: `{ error }`. */
  onSalvar: (payload: PayloadSecao) => Promise<{ error: string | null }>;
  /** Pós-sucesso: a página aplica o payload no estado local (sem refetch). */
  onSucesso?: (payload: PayloadSecao) => void;
  /** Nome da seção nos toasts (ex.: 'Dados pessoais'). */
  rotulo?: string;
}

export function useSecaoEditavel({ onSalvar, onSucesso, rotulo = 'Alterações' }: OpcoesSecao) {
  const [pendentes, setPendentes] = useState<Record<string, string>>({});
  const [salvando, setSalvando]   = useState(false);
  const { toast } = useToast();

  /** Registra a edição de um campo APENAS na tela (não vai ao servidor). */
  const setCampo = useCallback((campo: string, valor: string) => {
    setPendentes(prev => ({ ...prev, [campo]: valor }));
  }, []);

  /** Valor a exibir: o pendente (se houver) senão o que veio do servidor. */
  const valorDe = useCallback(
    (campo: string, original: string | null | undefined) =>
      campo in pendentes ? pendentes[campo] : (original ?? ''),
    [pendentes],
  );

  const cancelar = useCallback(() => setPendentes({}), []);

  const qtd = Object.keys(pendentes).length;

  const salvar = useCallback(async () => {
    if (Object.keys(pendentes).length === 0) return;
    setSalvando(true);

    // '' → null: coluna vazia significa "não informado". String vazia violaria
    // CHECK constraints (ex.: profiles.sexo IN ('masculino','feminino','outro')).
    const payload: PayloadSecao = {};
    for (const [campo, valor] of Object.entries(pendentes)) {
      const limpo = valor.trim();
      payload[campo] = limpo === '' ? null : limpo;
    }

    const { error } = await onSalvar(payload);
    setSalvando(false);

    if (error) {
      // LICAO-027: mensagem REAL do banco e as pendências ficam intactas —
      // nada do que a secretaria digitou é descartado.
      toast({
        title: `Erro ao salvar — ${rotulo}`,
        description: error,
        variant: 'destructive',
      });
      return;
    }

    onSucesso?.(payload);
    setPendentes({});
    toast({ title: `${rotulo} — alterações salvas` });
  }, [pendentes, onSalvar, onSucesso, rotulo, toast]);

  return {
    setCampo,
    valorDe,
    salvar,
    cancelar,
    salvando,
    qtd,
    temPendencia: qtd > 0,
  };
}
