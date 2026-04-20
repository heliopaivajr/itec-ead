import type { CourseId } from '@/data/courses';

export function generateCoursePdf(courseId: CourseId): void {
  // Cria iframe oculto, injeta o template e dispara o print
  const existingFrame = document.getElementById('itec-pdf-frame');
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'itec-pdf-frame';
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  // Importa o template dinamicamente para evitar overhead no bundle inicial
  import('@/components/CoursePdfTemplate').then(({ buildPdfHtml }) => {
    const html = buildPdfHtml(courseId);
    doc.open();
    doc.write(html);
    doc.close();

    // Aguarda imagens/fontes carregarem antes de imprimir
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 800);
  });
}
