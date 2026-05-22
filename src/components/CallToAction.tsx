import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Instagram, MessageCircle, ExternalLink } from 'lucide-react';

const CallToAction = () => (
  <section className="py-20 bg-muted/30 relative overflow-hidden">
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mb-32 -mr-32" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full -mt-32 -ml-32" />
    </div>

    <div className="container-custom relative z-10">
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="font-merriweather font-bold text-3xl lg:text-4xl text-foreground mb-4">
          Inicie Sua Jornada Teológica Hoje
        </h2>
        <p className="text-muted-foreground mb-8">
          Dê o primeiro passo para uma formação teológica transformadora. Inscreva-se agora e receba nosso e-book gratuito "O que é Teologia Cristã?" para começar sua jornada de aprendizado.
        </p>
        <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            placeholder="Seu melhor e-mail"
            className={`flex-1 px-4 py-3 rounded-md bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary`}
          />
          <Button className="bg-primary hover:bg-primary/80 text-primary-foreground whitespace-nowrap">
            Baixar E-book Grátis
          </Button>
        </form>
        <p className="text-sm text-muted-foreground mt-3">
          Ao se inscrever, você concorda com nossa{' '}
          <Link to="/privacidade" className="text-primary hover:underline">Política de Privacidade</Link>.
        </p>
      </div>

      <div className="mt-12 p-8 bg-card rounded-xl shadow-xl border border-border max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-merriweather font-bold text-2xl text-foreground mb-4">
              Ainda com dúvidas?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe está disponível para esclarecer todas as suas perguntas sobre nossos cursos, metodologia e processo de matrícula.
            </p>
            <div className="space-y-4">
              {[
                { label: 'Telefone', value: '(81) 99116-1448 (zap)', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
                { label: 'E-mail', value: 'secretaria@itecedu.com', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
                { label: 'Horário de Atendimento', value: 'Segunda a Sexta: 8h às 18h', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              ].map(item => (
                <div key={item.label} className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-full mr-3 mt-1 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{item.label}</h4>
                    <p className="text-muted-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-accent/40 p-6 rounded-lg border border-border flex flex-col justify-center h-full">
            <h3 className="font-merriweather font-bold text-xl text-foreground mb-4 text-center">
              Faça sua Pré-inscrição
            </h3>
            <p className="text-muted-foreground mb-6 text-center text-sm">
              Preencha nosso formulário oficial de interesse e aguarde o contato da nossa equipe.
            </p>
            
            <Button asChild size="lg" className="bg-primary hover:bg-primary/80 text-primary-foreground w-full mb-6 text-lg py-6 shadow-lg shadow-primary/20">
              <a href="https://forms.gle/16rAE9rjrS3fb4b79" target="_blank" rel="noopener noreferrer">
                Se Inscreva aqui 👇 <ExternalLink className="ml-2 h-5 w-5" />
              </a>
            </Button>
            
            <div className="pt-6 border-t border-border">
              <p className="text-sm font-medium text-foreground text-center mb-4">
                Acessar o nosso Instagram e WhatsApp:
              </p>
              <div className="flex flex-col gap-3">
                <a href="https://wa.me/5581991161448" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-md transition-colors shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp (81) 99116-1448
                </a>
                <a href="https://instagram.com/itec.teologia" target="_blank" rel="noopener noreferrer" 
                   className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white font-medium rounded-md transition-opacity shadow-sm">
                  <Instagram className="h-5 w-5" />
                  @itec.teologia
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CallToAction;
