import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Download, Calendar, Clock } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
  schedule: string;
  level: string;
  downloadUrl?: string;
}

const courses: Course[] = [
  {
    id: 'graduacao-teologia',
    title: 'Graduação em Teologia',
    description: 'Curso livre de teologia com formação completa para o ministério, incluindo exegese, hermenêutica e teologia sistemática.',
    duration: '3 anos',
    schedule: 'Aulas semanais',
    level: 'Avançado',
    downloadUrl: '#',
  },
  {
    id: 'seteb',
    title: 'SETEB — Seminário Básico de Teologia',
    description: 'Curso básico de teologia em 2 anos. Encontros presenciais e online para formação ministerial sólida.',
    duration: '2 anos',
    schedule: 'Terças-feiras',
    level: 'Básico',
    downloadUrl: '#',
  },
  {
    id: 'curso-ministerial-mulheres',
    title: 'Curso Ministerial de Mulheres',
    description: 'Formação ministerial específica para mulheres, com ênfase em vocação, liderança e serviço cristão.',
    duration: '1 ano',
    schedule: 'Quintas-feiras',
    level: 'Intermediário',
    downloadUrl: '#',
  },
];

const CoursePreview = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="font-merriweather font-bold text-3xl lg:text-4xl mb-4">
            Cursos em <span className="text-itec-bloodRed">Destaque</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            O ITEC oferece cursos livres de teologia para diferentes etapas da sua jornada vocacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="overflow-hidden border border-itec-bloodRed/30 bg-card hover:shadow-[0_0_20px_hsl(var(--itec-bloodRed)/0.3)] transition-shadow"
            >
              <div className="bg-gradient-to-br from-black via-gray-900 to-itec-bloodRed/30 p-6 border-b border-itec-bloodRed/30">
                <div className="inline-block bg-itec-bloodRed/20 border border-itec-bloodRed/40 text-itec-bloodRed text-xs font-semibold px-3 py-1 rounded-full mb-3">
                  {course.level}
                </div>
                <h3 className="font-merriweather font-bold text-xl text-white">
                  {course.title}
                </h3>
              </div>
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-4 min-h-[60px]">
                  {course.description}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-itec-bloodRed" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-itec-bloodRed" />
                    <span>{course.schedule}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex flex-col gap-2">
                {course.downloadUrl && (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-itec-bloodRed/50 text-itec-bloodRed hover:bg-itec-bloodRed hover:text-white"
                  >
                    <a href={course.downloadUrl} download>
                      <Download className="mr-2 h-4 w-4" />
                      Baixar programação e materiais
                    </a>
                  </Button>
                )}
                <Button asChild className="w-full bg-itec-bloodRed hover:bg-itec-bloodRed/80 text-white">
                  <Link to={`/cursos/${course.id}`}>Saiba mais</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursePreview;
