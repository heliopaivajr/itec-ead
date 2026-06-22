import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ChevronDown, ChevronRight, Edit2, Clock, Search, X, Save, Loader2, Plus, Power, RotateCcw, FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  getDisciplinas as fetchDisciplinas,
  getPrerequisitos as fetchPrerequisitos,
  getModulos as fetchModulos,
  createDisciplina,
  updateDisciplina,
  desativarDisciplina,
  syncPrerequisitos,
  type Disciplina,
  type ModuloOpcao,
  type DisciplinaInput,
  type TipoDisciplina,
  type AreaDisciplina,
  type TipoPrerequisito,
} from '@/services/cursos.service';
import MateriaisDisciplinaModal from '@/components/dashboard/MateriaisDisciplinaModal';
import type { DashboardContext } from '../Dashboard';

// ─── Constantes de apresentação (vocabulário v2) ──────────────

const AREA_LABEL: Record<AreaDisciplina, string> = {
  B: 'Bíblico',
  T: 'Teológico',
  P: 'Prático',
};

const AREA_COLOR: Record<AreaDisciplina, string> = {
  B: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  T: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  P: 'bg-green-500/15 text-green-400 border-green-500/30',
};

const TIPO_LABEL: Record<TipoDisciplina, string> = {
  regular: 'Regular',
  eletiva: 'Eletiva',
  obrigatoria: 'Obrigatória',
};

const TIPO_COLOR: Record<TipoDisciplina, string> = {
  regular: 'bg-foreground/10 text-foreground/70 border-foreground/20',
  eletiva: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',
  obrigatoria: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
};

const MODULO_PERIODO: Record<number, string> = {
  1: '1º Módulo — Fev–Jun (1º Ano)',
  2: '2º Módulo — Ago–Dez (1º Ano)',
  3: '3º Módulo — Fev–Jun (2º Ano)',
  4: '4º Módulo — Ago–Dez (2º Ano)',
  5: '5º Módulo — Fev–Jun (3º Ano)',
  6: '6º Módulo — Ago–Dez (3º Ano)',
};

const PREREQ_LABEL: Record<TipoPrerequisito, string> = {
  prerequisito: 'Pré-requisito',
  corequisito: 'Correquisito',
  recomendado: 'Recomendado',
};

// ─── Types ────────────────────────────────────────────────────

type DbDisciplina = Disciplina;

interface DbPrerequisito {
  disciplina_codigo: string;
  prerequisito_codigo: string;
  tipo: TipoPrerequisito;
}

type DiscForm = DisciplinaInput;

// ─── Small sub-components ─────────────────────────────────────

function TypeBadge({ tipo }: { tipo: TipoDisciplina }) {
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TIPO_COLOR[tipo]}`}>
      {TIPO_LABEL[tipo]}
    </span>
  );
}

function AreaBadge({ area }: { area: AreaDisciplina }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${AREA_COLOR[area]}`}>
      {AREA_LABEL[area]}
    </span>
  );
}

function PrereqChip({ codigo, tipo, nome }: { codigo: string; tipo: TipoPrerequisito; nome?: string }) {
  const color =
    tipo === 'prerequisito' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
    tipo === 'corequisito'  ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                              'bg-muted/50 text-muted-foreground border-border';
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${color}`} title={nome ?? codigo}>
      {codigo}
      {tipo === 'prerequisito' && <span className="ml-1 opacity-60">*</span>}
    </span>
  );
}

// ─── Modal de Disciplina (criar OU editar) ────────────────────

interface DiscModalProps {
  // disciplina = null → modo CRIAR; senão → modo EDITAR
  disciplina: DbDisciplina | null;
  modulos: ModuloOpcao[];
  prereqs: DbPrerequisito[];
  allDisciplinas: DbDisciplina[];
  onClose: () => void;
  onSaved: () => void;
}

function DiscModal({ disciplina, modulos, prereqs, allDisciplinas, onClose, onSaved }: DiscModalProps) {
  const isCreate = disciplina === null;
  const moduloPadrao = modulos[0]?.id ?? '';

  const [form, setForm] = useState<DiscForm>({
    codigo: disciplina?.codigo ?? '',
    nome: disciplina?.nome ?? '',
    area: disciplina?.area ?? 'B',
    ano_curso: disciplina?.ano ?? 1,
    modulo_id: disciplina?.modulo_id ?? moduloPadrao,
    horas_presencial: disciplina?.horas_presencial ?? 0,
    horas_ead: disciplina?.horas_ead ?? 0,
    creditos: disciplina?.creditos ?? 0,
    tipo: disciplina?.tipo ?? 'regular',
    ativo: disciplina?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Pré-requisitos (somente em modo edição)
  const [localPrereqs, setLocalPrereqs] = useState<DbPrerequisito[]>(prereqs);
  const [addingPrereq, setAddingPrereq] = useState<{ codigo: string; tipo: TipoPrerequisito }>({ codigo: '', tipo: 'prerequisito' });

  const codigoUpper = form.codigo.trim().toUpperCase();
  const codigoValido = /^[A-Z0-9]{5}$/.test(codigoUpper);

  const availableForPrereq = allDisciplinas.filter(
    d => d.codigo !== codigoUpper && !localPrereqs.find(p => p.prerequisito_codigo === d.codigo)
  );

  const handleSave = async () => {
    setError('');
    if (!codigoValido) { setError('Código inválido. Use 5 caracteres maiúsculos (ÁREA+ANO+ABREV), ex.: B1ATG.'); return; }
    if (!form.nome.trim()) { setError('Informe o nome da disciplina.'); return; }
    if (!form.modulo_id) { setError('Selecione o módulo.'); return; }

    setSaving(true);
    const payload: DiscForm = { ...form, codigo: codigoUpper };

    if (isCreate) {
      const { error: createErr } = await createDisciplina(payload);
      if (createErr) { setError(createErr); setSaving(false); return; }
    } else {
      const { error: updateErr } = await updateDisciplina(disciplina!.id, payload);
      if (updateErr) { setError(updateErr); setSaving(false); return; }

      const { error: syncErr } = await syncPrerequisitos(codigoUpper, localPrereqs);
      if (syncErr) { setError(syncErr); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
  };

  const addPrereq = () => {
    if (!addingPrereq.codigo) return;
    setLocalPrereqs(prev => [...prev, {
      disciplina_codigo: codigoUpper,
      prerequisito_codigo: addingPrereq.codigo,
      tipo: addingPrereq.tipo,
    }]);
    setAddingPrereq({ codigo: '', tipo: 'prerequisito' });
  };

  const removePrereq = (codigo: string) => {
    setLocalPrereqs(prev => prev.filter(p => p.prerequisito_codigo !== codigo));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-merriweather text-foreground">
            {isCreate ? 'Nova Disciplina' : 'Editar Disciplina'}
            {!isCreate && <span className="ml-2 text-sm font-mono text-primary font-normal">{disciplina!.codigo}</span>}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Código + Nome */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="codigo" className="text-sm text-foreground">Código</Label>
              <Input id="codigo" value={form.codigo} maxLength={5}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                placeholder="B1ATG"
                title="Convenção: ÁREA(B/T/P) + ANO(1-3) + ABREV (3) — 5 caracteres maiúsculos"
                className="bg-background border-border text-foreground font-mono uppercase" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="nome" className="text-sm text-foreground">Nome</Label>
              <Input id="nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="bg-background border-border text-foreground" />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground -mt-2">
            Código: <span className="font-mono">ÁREA(B/T/P)+ANO(1–3)+ABREV(3)</span>, 5 caracteres maiúsculos, único. Ex.: <span className="font-mono">B1ATG</span>.
          </p>

          {/* Área · Ano · Módulo */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Área</Label>
              <Select value={form.area} onValueChange={v => setForm(f => ({ ...f, area: v as AreaDisciplina }))}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="B">Bíblico</SelectItem>
                  <SelectItem value="T">Teológico</SelectItem>
                  <SelectItem value="P">Prático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Ano</Label>
              <Select value={String(form.ano_curso)} onValueChange={v => setForm(f => ({ ...f, ano_curso: +v }))}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="1">1º Ano</SelectItem>
                  <SelectItem value="2">2º Ano</SelectItem>
                  <SelectItem value="3">3º Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Módulo</Label>
              <Select value={form.modulo_id} onValueChange={v => setForm(f => ({ ...f, modulo_id: v }))}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue placeholder="Módulo..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {modulos.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.ordem}º — {m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Horas + Créditos */}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Total (h)</Label>
              <Input type="number" value={form.horas_presencial + form.horas_ead} readOnly tabIndex={-1}
                title="Calculado automaticamente (Presencial + EAD)"
                className="bg-muted/40 border-border text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Presencial</Label>
              <Input type="number" value={form.horas_presencial} min={0}
                onChange={e => setForm(f => ({ ...f, horas_presencial: +e.target.value }))}
                className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">EAD</Label>
              <Input type="number" value={form.horas_ead} min={0}
                onChange={e => setForm(f => ({ ...f, horas_ead: +e.target.value }))}
                className="bg-background border-border text-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Créditos</Label>
              <Input type="number" value={form.creditos} min={0}
                onChange={e => setForm(f => ({ ...f, creditos: +e.target.value }))}
                className="bg-background border-border text-foreground" />
            </div>
          </div>

          {/* Tipo + Ativo */}
          <div className="grid grid-cols-2 gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-sm text-foreground">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v as TipoDisciplina }))}>
                <SelectTrigger className="bg-background border-border text-foreground"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="eletiva">Eletiva</SelectItem>
                  <SelectItem value="obrigatoria">Obrigatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input type="checkbox" id="ativo" checked={form.ativo}
                onChange={e => setForm(f => ({ ...f, ativo: e.target.checked }))}
                className="h-4 w-4 rounded border-border accent-primary" />
              <Label htmlFor="ativo" className="text-sm text-foreground cursor-pointer">Disciplina ativa</Label>
            </div>
          </div>

          {/* Pré-requisitos (somente edição) */}
          {!isCreate && (
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Pré-requisitos</Label>
              <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 rounded-md bg-background border border-border">
                {localPrereqs.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Nenhum pré-requisito</span>
                ) : (
                  localPrereqs.map(p => (
                    <span key={p.prerequisito_codigo}
                      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border
                        ${p.tipo === 'prerequisito' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          p.tipo === 'corequisito' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                          'bg-muted/50 text-muted-foreground border-border'}`}>
                      {p.prerequisito_codigo}
                      <span className="text-[10px] opacity-60">({PREREQ_LABEL[p.tipo]})</span>
                      <button onClick={() => removePrereq(p.prerequisito_codigo)}
                        className="ml-0.5 hover:opacity-100 opacity-50 transition-opacity">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Select value={addingPrereq.codigo} onValueChange={v => setAddingPrereq(a => ({ ...a, codigo: v }))}>
                  <SelectTrigger className="bg-background border-border text-foreground text-xs flex-1">
                    <SelectValue placeholder="Selecionar disciplina..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border max-h-48">
                    {availableForPrereq.map(d => (
                      <SelectItem key={d.codigo} value={d.codigo} className="text-xs">
                        <span className="font-mono text-primary">{d.codigo}</span>
                        <span className="ml-2 text-muted-foreground">{d.nome.length > 35 ? d.nome.slice(0, 35) + '…' : d.nome}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={addingPrereq.tipo} onValueChange={v => setAddingPrereq(a => ({ ...a, tipo: v as TipoPrerequisito }))}>
                  <SelectTrigger className="bg-background border-border text-foreground text-xs w-32"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="prerequisito">Pré-requisito</SelectItem>
                    <SelectItem value="recomendado">Recomendado</SelectItem>
                    <SelectItem value="corequisito">Correquisito</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={addPrereq} disabled={!addingPrereq.codigo}
                  className="border-border text-foreground hover:text-primary shrink-0">
                  + Adicionar
                </Button>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-muted-foreground">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            {isCreate ? 'Criar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function CursosAdmin() {
  useOutletContext<DashboardContext>();

  const [disciplinasDb, setDisciplinasDb] = useState<DbDisciplina[]>([]);
  const [prereqsDb, setPrereqsDb] = useState<DbPrerequisito[]>([]);
  const [modulos, setModulos] = useState<ModuloOpcao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openModulos, setOpenModulos] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6]));
  const [editing, setEditing] = useState<DbDisciplina | null>(null);
  const [creating, setCreating] = useState(false);
  const [materiaisDisc, setMateriaisDisc] = useState<DbDisciplina | null>(null);

  const load = async () => {
    setLoading(true);
    const [discs, preqs, mods] = await Promise.all([fetchDisciplinas(), fetchPrerequisitos(), fetchModulos()]);
    setDisciplinasDb(discs);
    setPrereqsDb(preqs);
    setModulos(mods);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleModulo = (m: number) => {
    setOpenModulos(prev => {
      const next = new Set(prev);
      next.has(m) ? next.delete(m) : next.add(m);
      return next;
    });
  };

  const handleDesativar = async (d: DbDisciplina) => {
    if (!window.confirm(`Desativar a disciplina "${d.codigo} — ${d.nome}"?\n\nEla deixa de aparecer como ativa, mas o histórico é preservado (soft delete).`)) return;
    const { error } = await desativarDisciplina(d.id);
    if (error) { window.alert('Erro ao desativar: ' + error); return; }
    load();
  };

  const handleReativar = async (d: DbDisciplina) => {
    const { error } = await updateDisciplina(d.id, { ativo: true });
    if (error) { window.alert('Erro ao reativar: ' + error); return; }
    load();
  };

  const filtered = search.trim()
    ? disciplinasDb.filter(d =>
        d.nome.toLowerCase().includes(search.toLowerCase()) ||
        d.codigo.toLowerCase().includes(search.toLowerCase())
      )
    : disciplinasDb;

  const byModulo = (m: number) => filtered.filter(d => d.modulo === m);

  const prereqsFor = (codigo: string) =>
    prereqsDb.filter(p => p.disciplina_codigo === codigo);

  // Lookup codigo→nome para tooltips de pré-requisito (a partir da lista carregada)
  const nomeByCodigo = new Map(disciplinasDb.map(d => [d.codigo, d.nome]));

  // Stats (vocabulário v2): regular = grade fixa; eletiva + obrigatoria = trilha eletiva
  // (Manual: 10 eletivas, com Hebraico I marcada como 'obrigatoria').
  const total = disciplinasDb.length;
  const regulares = disciplinasDb.filter(d => d.tipo === 'regular').length;
  const eletivas = disciplinasDb.filter(d => d.tipo === 'eletiva' || d.tipo === 'obrigatoria').length;
  const horasRegulares = disciplinasDb.filter(d => d.tipo === 'regular').reduce((s, d) => s + d.carga_horaria, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-merriweather font-bold text-primary">Grade Curricular</h1>
          <p className="text-muted-foreground mt-1">
            Teologia Livre — 6 módulos · 3 anos · {total} disciplinas
          </p>
        </div>
        <Button onClick={() => setCreating(true)} disabled={modulos.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Nova Disciplina
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total de Disciplinas', value: total,       color: 'text-primary' },
          { label: 'Regulares',             value: regulares,  color: 'text-foreground' },
          { label: 'Eletivas',              value: eletivas,   color: 'text-yellow-500' },
          { label: 'Horas Regulares',       value: `${horasRegulares}h`, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por código ou nome..."
          className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-400/70" /> Pré-requisito (bloqueante)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/50" /> Pré-req. recomendado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-400/70" /> Correquisito
        </span>
      </div>

      {/* Accordion by modulo */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(m => {
            const rows = byModulo(m);
            if (rows.length === 0 && search) return null;
            const isOpen = openModulos.has(m);
            const modHoras = rows.filter(d => d.tipo === 'regular').reduce((s, d) => s + d.carga_horaria, 0);

            return (
              <div key={m} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Module header */}
                <button
                  onClick={() => toggleModulo(m)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <div className="text-left">
                      <p className="font-semibold text-foreground text-sm">{MODULO_PERIODO[m]}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rows.length} disciplinas
                        {modHoras > 0 && ` · ${modHoras}h regulares`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(['B', 'T', 'P'] as AreaDisciplina[]).map(a => {
                      const count = rows.filter(d => d.area === a).length;
                      return count > 0 ? (
                        <span key={a} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${AREA_COLOR[a]}`}>
                          {AREA_LABEL[a]} {count}
                        </span>
                      ) : null;
                    })}
                  </div>
                </button>

                {/* Discipline rows */}
                {isOpen && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {rows.map(d => {
                      const dPrereqs = prereqsFor(d.codigo);
                      const inactive = !d.ativo;
                      return (
                        <div key={d.codigo}
                          className={`flex items-start gap-3 px-5 py-3 hover:bg-muted/10 transition-colors group ${inactive ? 'opacity-50' : ''}`}>
                          {/* Code */}
                          <div className="font-mono text-xs font-semibold text-primary bg-primary/5 px-2 py-1 rounded border border-primary/20 shrink-0 mt-0.5 min-w-[90px] text-center">
                            {d.codigo}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">
                              {d.nome}
                              {inactive && <span className="ml-2 text-[10px] text-muted-foreground">(inativa)</span>}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              <TypeBadge tipo={d.tipo} />
                              <AreaBadge area={d.area} />
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Clock className="h-2.5 w-2.5" />{d.carga_horaria}h
                              </span>
                              {dPrereqs.length > 0 && (
                                <span className="flex items-center gap-1 ml-1">
                                  <span className="text-[10px] text-muted-foreground mr-0.5">pré:</span>
                                  {dPrereqs.map(p => (
                                    <PrereqChip key={p.prerequisito_codigo} codigo={p.prerequisito_codigo} tipo={p.tipo} nome={nomeByCodigo.get(p.prerequisito_codigo)} />
                                  ))}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Ações */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                            <button
                              onClick={() => setMateriaisDisc(d)}
                              title="Materiais"
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                              <FolderOpen className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setEditing(d)}
                              title="Editar"
                              className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary">
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {inactive ? (
                              <button
                                onClick={() => handleReativar(d)}
                                title="Reativar"
                                className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-400">
                                <RotateCcw className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDesativar(d)}
                                title="Desativar"
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                                <Power className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      {(creating || editing) && (
        <DiscModal
          disciplina={editing}
          modulos={modulos}
          prereqs={editing ? prereqsFor(editing.codigo) : []}
          allDisciplinas={disciplinasDb}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}

      {/* Modal de materiais da disciplina */}
      {materiaisDisc && (
        <MateriaisDisciplinaModal
          disciplina={{ id: materiaisDisc.id, codigo: materiaisDisc.codigo, nome: materiaisDisc.nome }}
          onClose={() => setMateriaisDisc(null)}
        />
      )}
    </div>
  );
}
