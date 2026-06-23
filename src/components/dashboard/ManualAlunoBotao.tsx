import { useEffect, useState } from 'react';
import { BookMarked, Loader2 } from 'lucide-react';
import { getManualAlunoUrl } from '@/services/curso.service';

// Botão "Manual do Aluno" para o aluno — abre o handbook (signed URL).
// Some se não houver manual cadastrado.
export default function ManualAlunoBotao() {
  const [existe, setExiste] = useState(false);
  const [abrindo, setAbrindo] = useState(false);

  useEffect(() => {
    let vivo = true;
    getManualAlunoUrl().then(({ url }) => { if (vivo && url) setExiste(true); });
    return () => { vivo = false; };
  }, []);

  if (!existe) return null;

  const abrir = async () => {
    setAbrindo(true);
    const { url } = await getManualAlunoUrl();
    setAbrindo(false);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={abrir}
      disabled={abrindo}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50">
      {abrindo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookMarked className="h-3.5 w-3.5" />}
      📘 Manual do Aluno
    </button>
  );
}
