import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react';

export default function Contato() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' });
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviado(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <MessageCircle className="h-4 w-4" />
            Fale Conosco
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-white mb-6">
            Entre em <span className="text-primary">Contato</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Tire suas dúvidas, solicite informações sobre matrículas ou fale com nossa equipe pastoral.
          </p>
        </div>
      </section>

      <section className="py-20 bg-background">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">

            {/* Informações */}
            <div className="space-y-8">
              <div>
                <h2 className="font-merriweather font-bold text-2xl text-foreground mb-6">Informações de Contato</h2>
                <div className="space-y-5">
                  {[
                    { icon: MapPin,  label: 'Endereço',    value: 'Unidade Janga · Paulista-PE · Brasil' },
                    { icon: Mail,    label: 'Secretaria',  value: 'secretaria@itecedu.com' },
                    { icon: Mail,    label: 'Financeiro',  value: 'financeiro@itecedu.com' },
                    { icon: Mail,    label: 'Coord. Acadêmica', value: 'educacao@itecedu.com' },
                    { icon: Phone,   label: 'WhatsApp',    value: '(81) 99116-1448' },
                    { icon: Clock,   label: 'Atendimento', value: 'Seg–Sex: 8h–17h' },
                  ].map(c => (
                    <div key={c.label} className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                        <c.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{c.label}</p>
                        <p className="text-foreground font-medium">{c.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instagram destaque */}
              <a
                href="https://instagram.com/itec.teologia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-gradient-to-r from-purple-950/40 to-pink-950/40 border border-pink-700/30 hover:border-pink-500/50 rounded-xl p-5 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-pink-300 group-hover:text-pink-200 transition-colors">@itec.teologia</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Siga no Instagram — muito conteúdo teológico</p>
                </div>
                <svg className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-pink-300 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>

              {/* WhatsApp CTA */}
              <div className="bg-green-950/30 border border-green-800/40 rounded-xl p-5">
                <p className="text-sm font-semibold text-green-400 mb-1">Resposta rápida via WhatsApp</p>
                <p className="text-xs text-muted-foreground mb-4">Para matrículas e dúvidas urgentes, fale direto pelo WhatsApp.</p>
                <a
                  href="https://wa.me/5581991161448?text=Ol%C3%A1%2C%20tenho%20interesse%20nos%20cursos%20do%20ITEC!"
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
                </a>
              </div>
            </div>

            {/* Formulário */}
            <div className="bg-card border border-border rounded-xl p-8">
              {enviado ? (
                <div className="text-center py-12 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                    <Send className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-merriweather font-bold text-xl text-foreground">Mensagem enviada!</h3>
                  <p className="text-muted-foreground text-sm">Responderemos em até 24 horas úteis.</p>
                  <button onClick={() => setEnviado(false)} className="text-primary text-sm hover:underline">Enviar outra mensagem</button>
                </div>
              ) : (
                <>
                  <h2 className="font-merriweather font-bold text-xl text-foreground mb-6">Envie uma Mensagem</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Nome <span className="text-primary">*</span></label>
                        <input required value={form.nome} onChange={e => setForm(f => ({...f, nome: e.target.value}))}
                          placeholder="Seu nome"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">E-mail <span className="text-primary">*</span></label>
                        <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
                          placeholder="seu@email.com"
                          className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Assunto</label>
                      <select value={form.assunto} onChange={e => setForm(f => ({...f, assunto: e.target.value}))}
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                        <option value="">Selecione um assunto</option>
                        <option>Informações sobre matrículas</option>
                        <option>Dúvidas acadêmicas</option>
                        <option>Suporte técnico</option>
                        <option>Questões financeiras</option>
                        <option>Parceria institucional</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">Mensagem <span className="text-primary">*</span></label>
                      <textarea required rows={5} value={form.mensagem} onChange={e => setForm(f => ({...f, mensagem: e.target.value}))}
                        placeholder="Escreva sua mensagem..."
                        className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none" />
                    </div>
                    <button type="submit"
                      className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg transition-colors">
                      <Send className="h-4 w-4" /> Enviar mensagem
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
