import React, { useState } from 'react';
import { Clock, Users, BookOpen, Download, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeadCaptureModal } from '@/components/LeadCaptureModal';
import type { Course } from '@/data/courses';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="group relative flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
        {/* Accent top line */}
        <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

        <div className="p-6 flex flex-col flex-1 gap-4">
          {/* Badge + Title */}
          <div>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${course.badgeColor} mb-3`}>
              {course.badge}
            </span>
            <h3 className="font-merriweather font-bold text-xl text-foreground leading-tight">
              {course.nomeCompleto}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {course.descricao}
          </p>

          {/* Info grid */}
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Horário</p>
                <p className="text-sm text-foreground">{course.horario}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <BookOpen className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Duração</p>
                <p className="text-sm text-foreground">{course.duracao}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Modalidade</p>
                <p className="text-sm text-foreground">{course.modalidade}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Requisito</p>
                <p className="text-sm text-foreground">{course.requisito}</p>
              </div>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="pt-4 border-t border-border space-y-3">
            <p className="text-xs text-muted-foreground text-center">
              💬 Valores: entre em contato com a secretaria
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold gap-2"
            >
              <Download className="h-4 w-4" />
              Baixar Grade Curricular
            </Button>
          </div>
        </div>
      </div>

      {showModal && (
        <LeadCaptureModal course={course} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}
