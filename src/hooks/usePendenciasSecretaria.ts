import { useEffect, useState } from 'react';
import { getPendenciasSecretaria, type PendenciasSecretaria } from '@/services/dashboard.service';

// Hook fino: só compõe getPendenciasSecretaria (que já faz o merge em memória).
export interface UsePendenciasResult {
  loading: boolean;
  erro: boolean;
  dados: PendenciasSecretaria | null;
}

export function usePendenciasSecretaria(): UsePendenciasResult {
  const [state, setState] = useState<UsePendenciasResult>({ loading: true, erro: false, dados: null });

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const dados = await getPendenciasSecretaria();
        if (vivo) setState({ loading: false, erro: false, dados });
      } catch {
        if (vivo) setState({ loading: false, erro: true, dados: null });
      }
    })();
    return () => { vivo = false; };
  }, []);

  return state;
}
