import { useEffect, useRef, useState } from 'react';
import { BookMarked, Upload, Loader2, ExternalLink, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadManualAluno, getManualAlunoUrl, MAX_MANUAL_BYTES } from '@/services/curso.service';

// Card de gestão do Manual do Aluno (handbook institucional).
// Visível para Coordenador (admin) / superadmin. Upload de PDF único (substitui).
export default function ManualAlunoCard() {
  const [temManual, setTemManual] = useState<boolean | null>(null); // null = carregando
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const checar = async () => {
    const { url } = await getManualAlunoUrl();
    setTemManual(!!url);
  };
  useEffect(() => { checar(); }, []);

  const escolher = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErro('');
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reescolher o mesmo arquivo
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErro('O manual deve ser um arquivo PDF.'); return;
    }
    if (file.size > MAX_MANUAL_BYTES) {
      setErro(`Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite de 50 MB.`); return;
    }

    setEnviando(true);
    const { error } = await uploadManualAluno(file);
    setEnviando(false);
    if (error) { setErro(error); return; }
    checar();
  };

  const abrir = async () => {
    const { url } = await getManualAlunoUrl();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <BookMarked className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">Manual do Aluno</p>
        <p className="text-xs text-muted-foreground">
          {temManual === null ? 'Verificando...' :
            temManual
              ? <span className="text-green-400 inline-flex items-center gap-1"><Check className="h-3 w-3" /> Manual enviado (PDF)</span>
              : 'Nenhum manual enviado ainda.'}
        </p>
        {erro && <p className="text-xs text-red-400 mt-0.5">{erro}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {temManual && (
          <Button size="sm" variant="outline" onClick={abrir}
            className="border-border text-foreground hover:text-primary">
            <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Ver
          </Button>
        )}
        <Button size="sm" onClick={escolher} disabled={enviando}
          className="bg-primary text-primary-foreground hover:bg-primary/90">
          {enviando ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Upload className="h-3.5 w-3.5 mr-1.5" />}
          {temManual ? 'Substituir PDF' : 'Enviar PDF'}
        </Button>
        <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}
