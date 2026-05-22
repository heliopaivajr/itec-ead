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
