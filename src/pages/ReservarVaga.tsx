import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, CheckCircle2, ArrowLeft, ShieldCheck, Send, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { createLead } from '@/services/leads.service';

const cursos = [
  { value: 'teologia-livre', label: 'Graduação em Teologia (Teologia Livre)' },
  { value: 'seteb',          label: 'SETEB — Seminário de Educação Teológica Básica' },
  { value: 'ministerial-mulheres', label: 'Curso Ministerial para Mulheres' },
];

const inputClass =
  'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all';

export default function ReservarVaga() {
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cidade: '',
    curso_interesse: '', como_conheceu: '', mensagem: '', lgpd: false,
  });
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const set = (k: string, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.lgpd) { setErro('Você precisa aceitar a política de privacidade para continuar.'); return; }
    setErro('');
    setLoading(true);

    const result = await createLead({
      nome:            form.nome,
      email:           form.email,
      telefone:        form.telefone,
      cidade:          form.cidade || undefined,
      curso_interesse: form.curso_interesse,
      como_conheceu:   form.como_conheceu || undefined,
      mensagem:        form.mensagem || undefined,
    });

    setLoading(false);
    if (!result.success) {
      // Erro técnico no console (LICAO-027); mensagem amigável e ACIONÁVEL na
      // tela — sem fallback fake: o interessado sabe exatamente o que fazer.
      console.error('[ReservarVaga] createLead falhou:', result.error);
      setErro('Erro ao enviar. Tente novamente ou fale conosco no WhatsApp: (81) 99116-1448.');
    } else {
      setEnviado(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero compacto */}
      <section className="relative py-14 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a0005 0%, #2d0008 40%, #1c1c1c 100%)' }}>
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute right-0 top-0 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/15 border border-primary/30 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest">
            <Flame className="h-3.5 w-3.5 text-orange-400" />
            Matrículas Abertas · 2026
          </div>
          <h1 className="font-merriweather font-bold text-3xl md:text-4xl text-white mb-3">
            Reserve sua <span className="text-primary">Vaga</span>
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto">
            Preencha o formulário abaixo. Nossa secretaria entrará em contato em até 24 horas úteis para confirmar sua inscrição.
          </p>
        </div>
      </section>

      <section className="py-14 bg-background">
        <div className="container-custom max-w-2xl">

          {enviado ? (
            /* ── Sucesso ── */
            <div className="text-center py-16 space-y-5">
              <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-400" />
              </div>
              <h2 className="font-merriweather font-bold text-2xl text-foreground">
                Solicitação enviada com sucesso!
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                Recebemos seus dados, <strong className="text-foreground">{form.nome}</strong>. Nossa equipe da secretaria entrará em contato pelo e-mail <strong className="text-foreground">{form.email}</strong> ou WhatsApp em breve.
              </p>
              <div className="bg-card border border-border rounded-xl p-5 text-left max-w-sm mx-auto space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Resumo da solicitação</p>
                <p className="text-sm"><span className="text-muted-foreground">Curso:</span> <span className="text-foreground font-medium">{cursos.find(c => c.value === form.curso_interesse)?.label}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> <span className="text-foreground">{form.email}</span></p>
                <p className="text-sm"><span className="text-muted-foreground">WhatsApp:</span> <span className="text-foreground">{form.telefone}</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <a
                  href={`https://wa.me/5581991161448?text=Ol%C3%A1%21+Me+inscrevi+para+o+curso+${encodeURIComponent(form.curso_interesse)}+pelo+site.+Meu+nome+%C3%A9+${encodeURIComponent(form.nome)}.`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  Confirmar pelo WhatsApp
                </a>
                <Link to="/" className="inline-flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-foreground font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
                  <ArrowLeft className="h-4 w-4" /> Voltar ao site
                </Link>
              </div>
            </div>

          ) : (
            /* ── Formulário ── */
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 flex items-start gap-3">
                <Flame className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Ao reservar sua vaga você garante sua posição na turma de <strong>2026</strong>. As vagas são limitadas e a confirmação da matrícula é feita após contato da secretaria.
                </p>
              </div>

              {/* Nome + Email */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Nome completo <span className="text-primary">*</span></label>
                  <input required value={form.nome} onChange={e => set('nome', e.target.value)}
                    placeholder="Seu nome completo" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">E-mail <span className="text-primary">*</span></label>
                  <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="seu@email.com" className={inputClass} />
                </div>
              </div>

              {/* Telefone + Cidade */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">WhatsApp <span className="text-primary">*</span></label>
                  <input required value={form.telefone} onChange={e => set('telefone', e.target.value)}
                    placeholder="(81) 99999-9999" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-foreground">Cidade / Estado</label>
                  <input value={form.cidade} onChange={e => set('cidade', e.target.value)}
                    placeholder="Ex: Paulista - PE" className={inputClass} />
                </div>
              </div>

              {/* Curso */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Curso de interesse <span className="text-primary">*</span></label>
                <select required value={form.curso_interesse} onChange={e => set('curso_interesse', e.target.value)} className={inputClass}>
                  <option value="">Selecione o curso desejado</option>
                  {cursos.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Como conheceu */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Como conheceu o ITEC?</label>
                <select value={form.como_conheceu} onChange={e => set('como_conheceu', e.target.value)} className={inputClass}>
                  <option value="">Selecione uma opção</option>
                  <option value="instagram">Instagram (@itec.teologia)</option>
                  <option value="whatsapp">Indicação pelo WhatsApp</option>
                  <option value="amigo">Indicação de amigo / familiar</option>
                  <option value="igreja">Minha Igreja</option>
                  <option value="google">Google / Busca na internet</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Mensagem */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">Mensagem (opcional)</label>
                <textarea rows={3} value={form.mensagem} onChange={e => set('mensagem', e.target.value)}
                  placeholder="Dúvidas, observações ou algo que queira nos contar..."
                  className={`${inputClass} resize-none`} />
              </div>

              {/* LGPD */}
              <div className="bg-muted/40 border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Política de Privacidade — LGPD</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  O ITEC (Instituto de Teologia Cristã) coleta seus dados pessoais (nome, e-mail, telefone e cidade) exclusivamente para fins de contato referente ao processo de matrícula nos cursos oferecidos. Seus dados serão tratados de forma confidencial, não serão compartilhados com terceiros e você poderá solicitar a exclusão a qualquer momento pelo e-mail <strong className="text-foreground">secretaria@itecedu.com</strong>. Em conformidade com a Lei 13.709/2018 (LGPD).
                </p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.lgpd}
                    onChange={e => set('lgpd', e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-foreground leading-relaxed group-hover:text-foreground/90">
                    Li e concordo com a <strong>Política de Privacidade</strong> e autorizo o ITEC a utilizar meus dados para entrar em contato sobre minha inscrição. <span className="text-primary">*</span>
                  </span>
                </label>
              </div>

              {/* Erro */}
              {erro && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-lg">
                  {erro}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !form.lgpd}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-sm uppercase tracking-widest transition-all"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                  : <><Send className="h-4 w-4" /> Reservar minha vaga</>
                }
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Após o envio, nossa secretaria confirmará sua vaga em até 24 horas úteis.<br />
                Dúvidas? <a href="https://wa.me/5581991161448" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">(81) 99116-1448</a>
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
