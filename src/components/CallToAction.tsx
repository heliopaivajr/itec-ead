
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CallToAction = () => {
  return (
    <section className="py-20 bg-itec-lightGray relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-itec-gold/10 rounded-full -mb-32 -mr-32"></div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-itec-purple/10 rounded-full -mt-32 -ml-32"></div>
      </div>
      
      <div className="container-custom relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-merriweather font-bold text-3xl lg:text-4xl text-itec-blue mb-4">
            Inicie Sua Jornada Teológica Hoje
          </h2>
          <p className="text-itec-darkGray/80 mb-8">
            Dê o primeiro passo para uma formação teológica transformadora. Inscreva-se agora e receba nosso e-book gratuito "O que é Teologia Cristã?" para começar sua jornada de aprendizado.
          </p>
          <form className="max-w-md mx-auto flex flex-col sm:flex-row gap-3">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="flex-1 px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-itec-blue"
            />
            <Button className="btn-primary whitespace-nowrap">
              Baixar E-book Grátis
            </Button>
          </form>
          <p className="text-sm text-gray-500 mt-3">
            Ao se inscrever, você concorda com nossa <Link to="/privacidade" className="text-itec-blue hover:underline">Política de Privacidade</Link>.
          </p>
        </div>

        <div className="mt-12 p-8 bg-white rounded-lg shadow-xl border border-gray-100 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-merriweather font-bold text-2xl text-itec-blue mb-4">
                Ainda com dúvidas?
              </h3>
              <p className="text-gray-600 mb-6">
                Nossa equipe está disponível para esclarecer todas as suas perguntas sobre nossos cursos, metodologia e processo de matrícula.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-itec-blue/10 p-2 rounded-full mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-itec-blue">Telefone</h4>
                    <p className="text-gray-600">(11) 5555-5555</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-itec-blue/10 p-2 rounded-full mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-itec-blue">E-mail</h4>
                    <p className="text-gray-600">contato@itec.br</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-itec-blue/10 p-2 rounded-full mr-3 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-itec-blue">Horário de Atendimento</h4>
                    <p className="text-gray-600">Segunda a Sexta: 8h às 18h</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-itec-blue/5 p-6 rounded-lg">
              <h3 className="font-merriweather font-bold text-xl text-itec-blue mb-3">
                Agende uma Conversa
              </h3>
              <form className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Nome completo" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-itec-blue"
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    placeholder="E-mail" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-itec-blue"
                  />
                </div>
                <div>
                  <input 
                    type="tel" 
                    placeholder="Telefone" 
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-itec-blue"
                  />
                </div>
                <div>
                  <textarea 
                    placeholder="Como podemos ajudar?" 
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-itec-blue"
                  ></textarea>
                </div>
                <Button className="btn-primary w-full">
                  Enviar Mensagem
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
