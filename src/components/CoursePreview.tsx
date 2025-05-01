
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  discountPrice?: number;
  duration: string;
  level: 'Básico' | 'Intermediário' | 'Avançado';
  instructor: string;
}

const courses: Course[] = [
  {
    id: 'graduacao-teologia',
    title: 'Graduação em Teologia',
    description: 'Formação completa para o ministério e academia teológica, com ênfase em exegese, hermenêutica e teologia sistemática.',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    price: 299.90,
    discountPrice: 249.90,
    duration: '3 anos',
    level: 'Avançado',
    instructor: 'Dr. Paulo Santos'
  },
  {
    id: 'pos-teologia-pastoral',
    title: 'Pós-Graduação em Teologia Pastoral',
    description: 'Especialização para quem já possui formação teológica e deseja aprofundar conhecimentos em aconselhamento e liderança pastoral.',
    image: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    price: 349.90,
    discountPrice: 299.90,
    duration: '18 meses',
    level: 'Avançado',
    instructor: 'Dr. João Oliveira'
  },
  {
    id: 'introducao-teologia',
    title: 'Introdução à Teologia',
    description: 'Curso básico para iniciantes que desejam compreender os fundamentos da teologia cristã e suas principais correntes.',
    image: 'https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    price: 149.90,
    duration: '6 meses',
    level: 'Básico',
    instructor: 'Dra. Maria Silva'
  }
];

const CoursePreview = () => {
  return (
    <section className="py-20">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="font-merriweather font-bold text-3xl lg:text-4xl text-itec-blue mb-4">
            Cursos em Destaque
          </h2>
          <p className="text-itec-darkGray/80 max-w-3xl mx-auto">
            Conheça alguns dos nossos cursos mais procurados, projetados para desenvolver sua vocação e conhecimento teológico.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Card key={course.id} className="overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-3 right-3 bg-white py-1 px-3 rounded-full text-xs font-semibold text-itec-blue">
                  {course.level}
                </div>
              </div>
              <CardContent className="p-6">
                <h3 className="font-merriweather font-bold text-xl mb-2 text-itec-blue">
                  {course.title}
                </h3>
                <p className="text-itec-darkGray/80 mb-3 text-sm h-12 overflow-hidden">
                  {course.description}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="mr-3">{course.duration}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{course.instructor}</span>
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 p-6 border-t">
                <div className="flex items-center justify-between w-full">
                  <div>
                    {course.discountPrice ? (
                      <>
                        <span className="text-gray-500 line-through text-sm">R$ {course.price.toFixed(2)}</span>
                        <div className="text-itec-blue font-bold">R$ {course.discountPrice.toFixed(2)}<span className="text-xs font-normal">/mês</span></div>
                      </>
                    ) : (
                      <div className="text-itec-blue font-bold">R$ {course.price.toFixed(2)}<span className="text-xs font-normal">/mês</span></div>
                    )}
                  </div>
                  <Button asChild variant="outline" size="sm" className="border-itec-blue text-itec-blue hover:bg-itec-blue hover:text-white">
                    <Link to={`/cursos/${course.id}`}>Saiba mais</Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild className="btn-primary">
            <Link to="/cursos">Ver todos os cursos</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursePreview;
