import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, User, Phone, Mail, MapPin,
  GraduationCap, FileText, Church, Pencil, CheckCircle, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getProfessorById, getContratosByProfessor } from '@/services/professor.service';
import type { Professor, ContratoProfessor } from '@/services/professor.service';
import { ProfessorModal } from '@/components/dashboard/ProfessorModal';

function fmt(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/20">
        <span className="text-muted-foreground">{icon}</span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const STATUS_CONTRATO: Record<string, { label: string; color: string }> = {
  pendente:   { label: 'Pendente',   color: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' },
  preenchido: { label: 'Preenchido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  impresso:   { label: 'Impresso',   color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  assinado:   { label: 'Assinado',   color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  encerrado:  { label: 'Encerrado',  color: 'bg-muted text-muted-foreground border-border' },
};

export default function FichaProfessor() {
  const { professorId } = useParams<{ professorId: string }>();
  const navigate = useNavigate();

  const [loading,   setLoading]   = useState(true);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [contratos, setContratos] = useState<ContratoProfessor[]>([]);
  const [editando,  setEditando]  = useState(false);

  const load = async (id: string) => {
    setLoading(true);
    const [prof, conts] = await Promise.all([
      getProfessorById(id),
      getContratosByProfessor(id),
    ]);
    setProfessor(prof);
    setContratos(conts);
    setLoading(false);
  };

  useEffect(() => {
    if (professorId) load(professorId);
  }, [professorId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!professor) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        <User className="h-12 w-12 mx-auto mb-4 opacity-20" />
        <p>Professor não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold">Ficha do Professor</h1>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditando(true)} className="gap-2">
          <Pencil className="h-4 w-4" /> Editar
        </Button>
      </div>

      {/* Dados pessoais */}
      <div className="bg-card border rounded-xl p-5 space-y-4">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary border shrink-0">
            {professor.nome_completo.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-semibold">{professor.nome_completo}</h2>
              <Badge variant="outline" className={professor.ativo
                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                : 'bg-muted text-muted-foreground border-border'}>
                {professor.ativo ? (
                  <><CheckCircle className="h-3 w-3 mr-1 inline" />Ativo</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1 inline" />Inativo</>
                )}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Cadastrado em {fmt(professor.criado_em)}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={<Mail className="h-4 w-4" />}  label="E-mail"   value={professor.email} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Telefone" value={professor.telefone ?? '—'} />
          <InfoRow icon={<FileText className="h-4 w-4" />} label="CPF" value={professor.cpf} />
          {professor.rg && <InfoRow icon={<FileText className="h-4 w-4" />} label="RG" value={professor.rg} />}
          {professor.data_nascimento && (
            <InfoRow icon={<User className="h-4 w-4" />} label="Nascimento" value={fmt(professor.data_nascimento)} />
          )}
          {professor.endereco && (
            <InfoRow icon={<MapPin className="h-4 w-4" />} label="Endereço" value={professor.endereco} />
          )}
        </div>
      </div>

      {/* Formação */}
      <Section title="Formação Acadêmica" icon={<GraduationCap className="h-4 w-4" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Formação" value={professor.formacao ?? '—'} />
          <InfoRow icon={<GraduationCap className="h-4 w-4" />} label="Titulação" value={professor.titulacao ?? '—'} />
          {professor.experiencia_ministerial && (
            <div className="sm:col-span-2">
              <InfoRow icon={<Church className="h-4 w-4" />} label="Experiência ministerial" value={professor.experiencia_ministerial} />
            </div>
          )}
          {professor.igreja_local && (
            <InfoRow icon={<Church className="h-4 w-4" />} label="Igreja local" value={professor.igreja_local} />
          )}
        </div>
      </Section>

      {/* Contratos */}
      <Section title="Contratos" icon={<FileText className="h-4 w-4" />}>
        {contratos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum contrato registrado.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Criado em</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {contratos.map(c => {
                const st = STATUS_CONTRATO[c.status] ?? STATUS_CONTRATO.pendente;
                return (
                  <tr key={c.id}>
                    <td className="py-2 font-mono text-xs text-muted-foreground">{c.id.slice(0, 8)}…</td>
                    <td className="py-2">{fmt(c.criado_em)}</td>
                    <td className="py-2">
                      <Badge variant="outline" className={`text-xs ${st.color}`}>{st.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* Modal de edição */}
      {editando && (
        <ProfessorModal
          professor={professor}
          onClose={() => setEditando(false)}
          onSaved={() => { setEditando(false); if (professorId) load(professorId); }}
        />
      )}
    </div>
  );
}
