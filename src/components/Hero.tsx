
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative bg-gradient-to-br from-itec-blue via-itec-blue/90 to-itec-blue py-20 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjxwYXRoIGQ9Ik02MCAyOGMwIDYuNjMtNS4zNyAxMi0xMiAxMnMtMTItNS4zNy0xMi0xMiA1LjM3LTEyIDEyLTEyIDEyIDUuMzcgMTIgMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
      </div>
      
      <div className="container-custom relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-white space-y-6">
            <h1 className="font-merriweather font-bold text-4xl lg:text-5xl leading-tight">
              Formação Teológica de Excelência para sua Vocação Cristã
            </h1>
            <p className="text-lg opacity-90">
              O ITEC EAD oferece uma jornada completa de aprendizado teológico, unindo tradição, inovação e formação espiritual autêntica.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild className="btn-secondary">
                <Link to="/cursos">Conheça Nossos Cursos</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent text-white border-white hover:bg-white hover:text-itec-blue">
                <Link to="/ebook">Baixar E-book Gratuito</Link>
              </Button>
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 text-sm">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((num) => (
                  <div key={num} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-itec-purple/50" />
                ))}
              </div>
              <p>Mais de <strong>1.200 alunos</strong> já formados</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white p-6 rounded-lg shadow-xl transform rotate-1 animate-pulse-slow">
              <div className="absolute -top-3 -right-3 bg-itec-gold text-itec-blue text-xs font-bold px-3 py-1 rounded-full">
                Inscrições Abertas
              </div>
              <h3 className="font-merriweather font-bold text-itec-blue text-xl mb-3">Graduação em Teologia</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-blue/10 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Duração: 3 anos (185 créditos)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-blue/10 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Modalidade: 100% online</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-blue/10 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Aulas gravadas e ao vivo</span>
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-itec-blue/10 flex items-center justify-center mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-itec-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>Mentoria espiritual</span>
                </li>
              </ul>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 line-through text-sm">R$ 299,90</span>
                  <div className="text-itec-blue font-bold">R$ 249,90<span className="text-xs font-normal">/mês</span></div>
                </div>
                <Button asChild className="btn-primary">
                  <Link to="/matricula">Matricule-se</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
