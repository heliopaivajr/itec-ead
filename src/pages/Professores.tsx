import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, BookOpen } from 'lucide-react';

interface Professor {
  nome: string;
  titulacao: string;
  area: string;
  curriculo: string;
}

const professores: Professor[] = [
  {
    nome: 'A definir',
    titulacao: 'Doutor em Teologia',
    area: 'Teologia Sistemática',
    curriculo: 'Currículo a ser disponibilizado em breve. Atua na área de Teologia Sistemática com ênfase em doutrinas bíblicas e história da igreja.'
  },
  {
    nome: 'A definir',
    titulacao: 'Mestre em Teologia',
    area: 'Exegese e Hermenêutica',
    curriculo: 'Currículo a ser disponibilizado em breve. Especialista em línguas originais (grego e hebraico) e interpretação bíblica.'
  },
  {
    nome: 'A definir',
    titulacao: 'Especialista em Ministério Pastoral',
    area: 'Teologia Pastoral',
    curriculo: 'Currículo a ser disponibilizado em breve. Experiência em formação ministerial, aconselhamento pastoral e liderança cristã.'
  },
];

const Professores = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-grow">
        <section className="py-16 bg-gradient-to-br from-black via-gray-900 to-gray-800">
          <div className="container-custom text-center text-white">
            <h1 className="font-merriweather font-bold text-4xl mb-4">
              Corpo <span className="text-itec-bloodRed">Docente</span>
            </h1>
            <p className="max-w-2xl mx-auto opacity-90">
              Conheça os professores do Instituto de Teologia Cristã — ITEC.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="container-custom grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {professores.map((p, i) => (
              <Card key={i} className="border-itec-bloodRed/30 bg-card">
                <CardContent className="p-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-itec-bloodRed/10 border border-itec-bloodRed/40 flex items-center justify-center">
                    <GraduationCap className="text-itec-bloodRed" />
                  </div>
                  <h3 className="font-merriweather font-bold text-xl text-itec-bloodRed">
                    {p.nome}
                  </h3>
                  <p className="text-sm font-semibold">{p.titulacao}</p>
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" /> {p.area}
                  </p>
                  <p className="text-sm leading-relaxed">{p.curriculo}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Professores;
