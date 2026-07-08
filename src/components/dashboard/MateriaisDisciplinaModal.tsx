import { useEffect, useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  FileText, FileSpreadsheet, Video, File as FileIcon, Check, Loader2,
  Power, Plus, X, Link2, Upload, CircleCheck, Clock,
} from 'lucide-react';
import {
  listarMateriais, criarMaterial, uploadArquivo, aprovarMaterial, desativarMaterial,
  type Material, type TipoMaterial,
} from '@/services/materiais.service';

function tipoFromExt(ext: string): TipoMaterial {
  const e = ext.toLowerCase();
  if (e === 'pdf') return 'pdf';
  if (e === 'doc' || e === 'docx') return 'doc';
  if (e === 'xls' || e === 'xlsx') return 'xls';
  if (e === 'mp4') return 'video';
  return 'outro';
}

function TipoIcon({ tipo }: { tipo: TipoMaterial }) {
  const cls = 'h-4 w-4 shrink-0';
  if (tipo === 'pdf') return <FileText className={`${cls} text-red-400`} />;
  if (tipo === 'doc') return <FileText className={`${cls} text-blue-400`} />;
  if (tipo === 'xls') return <FileSpreadsheet className={`${cls} text-green-400`} />;
  if (tipo === 'video') return <Video className={`${cls} text-purple-400`} />;
  return <FileIcon className={`${cls} text-muted-foreground`} />;
}

interface UploadItem { nome: string; status: 'enviando' | 'ok' | 'erro'; erro?: string }

interface Props {
  disciplina: { id: string; codigo: string; nome: string };
  onClose: () => void;
  // false para o PROFESSOR: ele não aprova o próprio material (o material dele já
  // entra aprovado — MATERIAL_PROFESSOR_AUTO_APROVA). Staff (default) vê o botão.
  podeAprovar?: boolean;
}

export default function MateriaisDisciplinaModal({ disciplina, onClose, podeAprovar = true }: Props) {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [adicionando, setAdicionando] = useState(false);

  // form
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ehResumo, setEhResumo] = useState(false);
  const [modo, setModo] = useState<'upload' | 'link'>('upload');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTipo, setLinkTipo] = useState<TipoMaterial>('video');
  const [files, setFiles] = useState<File[]>([]);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const load = async () => {
    setLoading(true);
    setMateriais(await listarMateriais(disciplina.id));
    setLoading(false);
  };
  useEffect(() => { load(); }, [disciplina.id]);

  const resetForm = () => {
    setTitulo(''); setDescricao(''); setEhResumo(false); setModo('upload');
    setLinkUrl(''); setLinkTipo('video'); setFiles([]); setUploads([]); setErro('');
  };

  const oversize = files.filter(f => f.size > 50 * 1024 * 1024);

  const handleSalvar = async () => {
    setErro('');
    if (!titulo.trim()) { setErro('Informe um título.'); return; }
    setSalvando(true);

    if (modo === 'link') {
      if (!linkUrl.trim()) { setErro('Informe a URL do vídeo (YouTube).'); setSalvando(false); return; }
      const { error } = await criarMaterial({
        disciplina_id: disciplina.id, titulo: titulo.trim(), descricao: descricao.trim() || null,
        tipo: linkTipo, origem: 'link', arquivo_url: linkUrl.trim(), eh_resumo: ehResumo,
      });
      if (error) { setErro(error); setSalvando(false); return; }
    } else {
      if (files.length === 0) { setErro('Selecione ao menos um arquivo.'); setSalvando(false); return; }
      // Cada arquivo vira um material. Mostra progresso/✓ por arquivo.
      const itens: UploadItem[] = files.map(f => ({ nome: f.name, status: 'enviando' }));
      setUploads(itens);
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const up = await uploadArquivo(disciplina.id, f);
        if (up.error || !up.path) {
          setUploads(prev => prev.map((it, idx) => idx === i ? { ...it, status: 'erro', erro: up.error ?? 'falha' } : it));
          continue;
        }
        const ext = f.name.split('.').pop() ?? '';
        const tituloMaterial = files.length === 1 ? titulo.trim() : `${titulo.trim()} — ${f.name}`;
        const { error } = await criarMaterial({
          disciplina_id: disciplina.id, titulo: tituloMaterial, descricao: descricao.trim() || null,
          tipo: tipoFromExt(ext), origem: 'upload', arquivo_url: up.path, tamanho_bytes: up.tamanho_bytes, eh_resumo: ehResumo,
        });
        setUploads(prev => prev.map((it, idx) => idx === i ? { ...it, status: error ? 'erro' : 'ok', erro: error ?? undefined } : it));
      }
    }

    setSalvando(false);
    resetForm();
    setAdicionando(false);
    load();
  };

  const handleAprovar = async (m: Material) => {
    const { error } = await aprovarMaterial(m.id);
    if (error) { window.alert('Erro ao aprovar: ' + error); return; }
    load();
  };

  const handleDesativar = async (m: Material) => {
    if (!window.confirm(`Desativar o material "${m.titulo}"? (soft delete — histórico preservado)`)) return;
    const { error } = await desativarMaterial(m.id);
    if (error) { window.alert('Erro ao desativar: ' + error); return; }
    load();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-merriweather text-foreground">
            Materiais
            <span className="ml-2 text-sm font-mono text-primary font-normal">{disciplina.codigo}</span>
            <span className="ml-2 text-sm text-muted-foreground font-normal">{disciplina.nome}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Botão adicionar (sempre visível) */}
          {!adicionando && (
            <Button onClick={() => setAdicionando(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> Adicionar material
            </Button>
          )}

          {/* Formulário */}
          {adicionando && (
            <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Título</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)}
                  className="bg-background border-border text-foreground" placeholder="Ex.: Apostila — Aula 1" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-foreground">Descrição (opcional)</Label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)}
                  className="bg-background border-border text-foreground" />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={modo === 'upload'} onChange={() => setModo('upload')} className="accent-primary" />
                  <Upload className="h-3.5 w-3.5" /> Upload
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="radio" checked={modo === 'link'} onChange={() => setModo('link')} className="accent-primary" />
                  <Link2 className="h-3.5 w-3.5" /> Link (YouTube)
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer ml-auto">
                  <input type="checkbox" checked={ehResumo} onChange={e => setEhResumo(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                  É resumo
                </label>
              </div>

              {modo === 'upload' ? (
                <div className="space-y-2">
                  <Input type="file" multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.mp4"
                    onChange={e => setFiles(Array.from(e.target.files ?? []))}
                    className="bg-background border-border text-foreground file:text-foreground" />
                  <p className="text-[10px] text-muted-foreground">
                    Vários arquivos permitidos (cada um vira um material). Limite 50 MB por arquivo — para vídeos grandes, use link do YouTube.
                  </p>
                  {oversize.length > 0 && (
                    <p className="text-xs text-red-400">
                      ⚠️ {oversize.length} arquivo(s) acima de 50 MB serão bloqueados: {oversize.map(f => f.name).join(', ')}. Use link do YouTube.
                    </p>
                  )}
                  {uploads.length > 0 && (
                    <ul className="text-xs space-y-1">
                      {uploads.map((u, i) => (
                        <li key={i} className="flex items-center gap-2">
                          {u.status === 'enviando' && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                          {u.status === 'ok' && <Check className="h-3 w-3 text-green-400" />}
                          {u.status === 'erro' && <X className="h-3 w-3 text-red-400" />}
                          <span className="text-muted-foreground">{u.nome}</span>
                          {u.erro && <span className="text-red-400">— {u.erro}</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://youtu.be/..."
                    className="col-span-2 bg-background border-border text-foreground" />
                  <Select value={linkTipo} onValueChange={v => setLinkTipo(v as TipoMaterial)}>
                    <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="video">Vídeo</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {erro && <p className="text-xs text-red-400">{erro}</p>}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { resetForm(); setAdicionando(false); }} className="text-muted-foreground">Cancelar</Button>
                <Button onClick={handleSalvar} disabled={salvando} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {salvando ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          )}

          {/* Lista */}
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
            </div>
          ) : materiais.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum material cadastrado ainda.</p>
          ) : (
            <ul className="divide-y divide-border/50 rounded-xl border border-border overflow-hidden">
              {materiais.map(m => (
                <li key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/10">
                  <TipoIcon tipo={m.tipo} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{m.titulo}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        {m.eh_resumo ? 'Resumo' : 'Completo'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                        {m.origem === 'link' ? 'Link' : 'Arquivo'}
                      </span>
                      {m.status === 'aprovado' ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 flex items-center gap-1">
                          <CircleCheck className="h-2.5 w-2.5" /> Aprovado
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-500 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" /> {m.status === 'rascunho' ? 'Rascunho' : 'Pendente'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {podeAprovar && m.status !== 'aprovado' && (
                      <Button size="sm" variant="outline" onClick={() => handleAprovar(m)}
                        className="border-green-500/30 text-green-400 hover:bg-green-500/10 h-7 text-xs">
                        Aprovar
                      </Button>
                    )}
                    <button onClick={() => handleDesativar(m)} title="Desativar"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                      <Power className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
