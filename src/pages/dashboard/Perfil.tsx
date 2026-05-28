import React, { useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Camera, Save, Loader2, MapPin, Church } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updatePerfil } from '@/services/usuarios.service';
import { uploadAvatar } from '@/services/profile.service';
import { useToast } from '@/hooks/use-toast';
import type { DashboardContext } from '../Dashboard';

const roleLabel: Record<string, string> = {
  pendente:     'Pendente',
  aluno:        'Aluno',
  professor:    'Professor',
  administracao:'Secretaria',
  financeiro:   'Financeiro',
  admin:        'Administrador',
  superadmin:   'SuperAdmin',
};

const roleBadge: Record<string, string> = {
  pendente:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  aluno:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  professor:    'bg-green-500/20 text-green-400 border-green-500/30',
  administracao:'bg-orange-500/20 text-orange-400 border-orange-500/30',
  financeiro:   'bg-teal-500/20 text-teal-400 border-teal-500/30',
  admin:        'bg-red-500/20 text-red-400 border-red-500/30',
  superadmin:   'bg-gray-800 text-white border-gray-600',
};

export default function Perfil() {
  const { profile } = useOutletContext<DashboardContext>();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAluno = profile.role === 'aluno' || profile.role === 'pendente';

  const [fullName,    setFullName]    = useState(profile.full_name        ?? '');
  const [telefone,    setTelefone]    = useState(profile.telefone         ?? '');
  const [bio,         setBio]         = useState(profile.bio              ?? '');
  const [sexo,        setSexo]        = useState(profile.sexo             ?? '');
  const [endereco,    setEndereco]    = useState(profile.endereco         ?? '');
  const [numero,      setNumero]      = useState(profile.numero           ?? '');
  const [complemento, setComplemento] = useState(profile.complemento     ?? '');
  const [bairro,      setBairro]      = useState(profile.bairro           ?? '');
  const [cidade,      setCidade]      = useState(profile.cidade           ?? '');
  const [estado,      setEstado]      = useState(profile.estado           ?? '');
  const [cep,         setCep]         = useState(profile.cep              ?? '');
  const [igrejaLocal, setIgrejaLocal] = useState(profile.igreja_local     ?? '');

  const [saving,       setSaving]    = useState(false);
  const [uploadingFoto, setUploading] = useState(false);
  const [avatarUrl,    setAvatarUrl]  = useState(profile.avatar_url       ?? '');

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem (JPG, PNG, WEBP).', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'A imagem deve ter no máximo 2 MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const { url, error } = await uploadAvatar(profile.id, file);
    setUploading(false);

    if (error) {
      toast({ title: 'Erro no upload', description: error, variant: 'destructive' });
    } else if (url) {
      setAvatarUrl(url);
      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi salva com sucesso.' });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updatePerfil(profile.id, {
      full_name: fullName,
      telefone,
      bio,
      sexo: (sexo as 'masculino' | 'feminino' | 'outro') || undefined,
      endereco:    endereco    || undefined,
      numero:      numero      || undefined,
      complemento: complemento || undefined,
      bairro:      bairro      || undefined,
      cidade:      cidade      || undefined,
      estado:      estado      || undefined,
      cep:         cep         || undefined,
      igreja_local: igrejaLocal || undefined,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil atualizado!', description: 'Suas informações foram salvas com sucesso.' });
    }
  };

  const currentAvatar = avatarUrl || profile.avatar_url;

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-merriweather font-bold text-primary">Meu Perfil</h1>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-6">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/40 overflow-hidden">
            {currentAvatar ? (
              <img src={currentAvatar} alt={profile.full_name} className="h-full w-full object-cover" />
            ) : (
              <User className="h-10 w-10 text-primary" />
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={handleFotoChange} disabled={uploadingFoto} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFoto}
            title="Alterar foto de perfil (máx. 2 MB)"
            className="absolute bottom-0 right-0 h-7 w-7 bg-primary rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingFoto
              ? <Loader2 className="h-3.5 w-3.5 text-primary-foreground animate-spin" />
              : <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            }
          </button>
        </div>
        <div>
          <p className="font-semibold text-foreground text-lg">{profile.full_name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <span className={`mt-2 inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${roleBadge[profile.role] ?? roleBadge.aluno}`}>
            {roleLabel[profile.role] ?? profile.role}
          </span>
          <p className="text-xs text-muted-foreground mt-2 opacity-70">
            Clique na câmera para trocar a foto · máx. 2 MB
          </p>
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Dados pessoais</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)}
              className="bg-background border-border text-foreground" />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={profile.email ?? ''} disabled
              className="bg-muted border-border text-muted-foreground cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado aqui.</p>
          </div>

          {/* CPF e RG — somente leitura (preenchido na matrícula) */}
          {profile.cpf && (
            <div className="space-y-2">
              <Label>CPF</Label>
              <Input value={profile.cpf} disabled className="bg-muted border-border text-muted-foreground cursor-not-allowed" />
            </div>
          )}
          {profile.rg && (
            <div className="space-y-2">
              <Label>RG</Label>
              <Input value={profile.rg} disabled className="bg-muted border-border text-muted-foreground cursor-not-allowed" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="telefone">WhatsApp / Telefone</Label>
            <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(81) 9 9999-9999"
              className="bg-background border-border text-foreground" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo</Label>
            <select id="sexo" value={sexo} onChange={e => setSexo(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">—</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="bio">Bio / Apresentação</Label>
            <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Conte um pouco sobre você..."
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-none" />
          </div>
        </div>
      </div>

      {/* Endereço */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          <MapPin className="h-4 w-4" /> Endereço
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="endereco">Logradouro</Label>
            <Input id="endereco" value={endereco} onChange={e => setEndereco(e.target.value)}
              placeholder="Rua, Av., etc."
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="numero">Número</Label>
            <Input id="numero" value={numero} onChange={e => setNumero(e.target.value)}
              placeholder="123"
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="complemento">Complemento</Label>
            <Input id="complemento" value={complemento} onChange={e => setComplemento(e.target.value)}
              placeholder="Apto, bloco…"
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" value={bairro} onChange={e => setBairro(e.target.value)}
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <Input id="cep" value={cep} onChange={e => setCep(e.target.value)}
              placeholder="00000-000"
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input id="cidade" value={cidade} onChange={e => setCidade(e.target.value)}
              className="bg-background border-border text-foreground" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="estado">Estado (UF)</Label>
            <Input id="estado" value={estado} onChange={e => setEstado(e.target.value)}
              placeholder="SP" maxLength={2}
              className="bg-background border-border text-foreground" />
          </div>
        </div>
      </div>

      {/* Ministério */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-widest">
          <Church className="h-4 w-4" /> Ministério
        </h2>
        <div className="space-y-2">
          <Label htmlFor="igrejaLocal">Igreja local</Label>
          <Input id="igrejaLocal" value={igrejaLocal} onChange={e => setIgrejaLocal(e.target.value)}
            placeholder="Nome da sua igreja"
            className="bg-background border-border text-foreground" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </Button>
    </div>
  );
}
