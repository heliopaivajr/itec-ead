import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const previewCourses = [
  {
    id: 'teologia-livre',
    badge: 'Graduação · Curso Livre',
    badgeBg: 'bg-primary/10 border-primary/30 text-primary',
    title: 'Teologia Livre',
    description: 'Formação teológica completa de 3 anos com 185 créditos. Exegese, hermenêutica, teologia sistemática e prática ministerial — presencial e EAD.',
    duration: '3 anos / 185 créditos',
    schedule: 'Seg, Qua e Sex — 18h45 às 22h',
    headerBg: 'from-primary/20 via-card to-card',
  },
  {
    id: 'seteb',
    badge: 'Básico · 3 Anos',
    badgeBg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    title: 'SETEB',
    description: 'Seminário de Educação Teológica Básica. Três anos cobrindo Teologia Básica, Antigo e Novo Testamento. Aberto a todos os cristãos.',
    duration: '3 anos',
    schedule: 'Terças-feiras — 19h às 20h',
    headerBg: 'from-blue-500/20 via-card to-card',
  },
  {
    id: 'ministerial-mulheres',
    badge: 'Feminino · Anual',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    title: 'Ministerial Mulheres',
    description: '7 disciplinas anuais focadas na identidade, vocação, emoções e pregação da mulher cristã. Encontros semanais de 3 horas.',
    duration: 'Anual — 7 disciplinas',
    schedule: 'Quintas-feiras — 19h às 22h',
    headerBg: 'from-purple-500/20 via-card to-card',
  },
];

const CoursePreview = () => (
  <section className="py-20 bg-background">
    <div className="container-custom">
      <div className="text-center mb-12">
        <h2 className="font-merriweather font-bold text-3xl lg:text-4xl text-foreground mb-4">
          Cursos em <span className="text-primary">Destaque</span>
        </h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          O ITEC oferece três trilhas de formação teológica para diferentes etapas da sua jornada vocacional.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {previewCourses.map((course) => (
          <Card
            key={course.id}
            className="overflow-hidden border border-border bg-card hover:border-primary/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className={`bg-gradient-to-br ${course.headerBg} p-6 border-b border-border`}>
              <div className={`inline-block border text-xs font-semibold px-3 py-1 rounded-full mb-3 ${course.badgeBg}`}>
                {course.badge}
              </div>
              <h3 className="font-merriweather font-bold text-xl text-foreground">
                {course.title}
              </h3>
            </div>

            <CardContent className="p-6 flex-1">
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {course.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>{course.schedule}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 border-t border-border">
              <Button asChild className="w-full bg-primary hover:bg-primary/80 text-primary-foreground gap-2">
                <Link to="/cursos">
                  Ver Grade e Baixar PDF <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="text-center mt-10">
        <Button asChild variant="outline" className="border-border text-foreground hover:border-primary hover:text-primary gap-2">
          <Link to="/cursos">
            Ver todos os cursos <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  </section>
);

export default CoursePreview;
