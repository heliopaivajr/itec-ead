import { useEffect, useState } from 'react';
import { FileText, FileSpreadsheet, Video, File as FileIcon, Download, ExternalLink, Loader2 } from 'lucide-react';
import { listarMateriais, getDownloadUrl, type Material, type TipoMaterial } from '@/services/materiais.service';

function TipoIcon({ tipo }: { tipo: TipoMaterial }) {
  const cls = 'h-3.5 w-3.5 shrink-0';
  if (tipo === 'pdf') return <FileText className={`${cls} text-red-400`} />;
  if (tipo === 'doc') return <FileText className={`${cls} text-blue-400`} />;
  if (tipo === 'xls') return <FileSpreadsheet className={`${cls} text-green-400`} />;
  if (tipo === 'video') return <Video className={`${cls} text-purple-400`} />;
  return <FileIcon className={`${cls} text-muted-foreground`} />;
}

// Lista de materiais aprovados para o aluno baixar/abrir.
// RLS já garante: aluno só recebe status='aprovado' das suas disciplinas.
export default function MateriaisAlunoLista({ disciplinaId }: { disciplinaId: string }) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [baixando, setBaixando] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    listarMateriais(disciplinaId).then(m => { if (vivo) { setMateriais(m); setLoading(false); } });
    return () => { vivo = false; };
  }, [disciplinaId]);

  const abrir = async (m: Material) => {
    if (m.origem === 'link') {
      window.open(m.arquivo_url, '_blank', 'noopener,noreferrer');
      return;
    }
    setBaixando(m.id);
    const { url, error } = await getDownloadUrl(m.arquivo_url);
    setBaixando(null);
    if (error || !url) { window.alert('Não foi possível gerar o link de download.'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
        <Loader2 className="h-3 w-3 animate-spin" /> Carregando materiais...
      </div>
    );
  }

  return (
    <div className="pt-1 space-y-1.5">
      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Materiais para download</p>
      {materiais.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum material disponível ainda.</p>
      ) : (
        <ul className="space-y-1">
          {materiais.map(m => (
            <li key={m.id} className="flex items-center gap-2">
              <TipoIcon tipo={m.tipo} />
              <span className="text-xs text-foreground truncate flex-1">{m.titulo}{m.eh_resumo && <span className="ml-1 text-[10px] text-muted-foreground">(resumo)</span>}</span>
              <button
                onClick={() => abrir(m)}
                disabled={baixando === m.id}
                className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0 disabled:opacity-50">
                {baixando === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : m.origem === 'link' ? <ExternalLink className="h-3 w-3" /> : <Download className="h-3 w-3" />}
                {m.origem === 'link' ? 'Assistir' : 'Baixar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
