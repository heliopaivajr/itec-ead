import React from 'react';
import { courses } from '@/data/courses';
import { CourseCard } from '@/components/CourseCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { GraduationCap } from 'lucide-react';

const Cursos = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 tech-grid opacity-30" />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-32 -bottom-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="container-custom relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
            <GraduationCap className="h-4 w-4" />
            Formação Teológica
          </div>
          <h1 className="font-merriweather font-bold text-4xl md:text-5xl text-foreground mb-4">
            Nossos <span className="text-primary">Cursos</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            O ITEC oferece três trilhas de formação teológica — do básico ao avançado —
            para que cada cristão encontre seu caminho de crescimento e serviço ao Reino de Deus.
          </p>
        </div>
      </section>

      {/* Cards */}
      <section className="container-custom pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* Info box */}
        <div className="mt-14 p-6 rounded-2xl border border-border bg-card text-center max-w-2xl mx-auto">
          <h3 className="font-merriweather font-bold text-lg text-foreground mb-2">
            Dúvidas sobre qual curso escolher?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Nossa secretaria está disponível para orientá-lo na escolha do melhor curso para sua vocação.
          </p>
          <a
            href="/contato"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
          >
            Falar com a Secretaria
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Cursos;
