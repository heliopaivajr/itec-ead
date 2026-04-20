import { courses, type CourseId } from '@/data/courses';

export function buildPdfHtml(courseId: CourseId): string {
  const course = courses.find(c => c.id === courseId);
  if (!course) return '<html><body>Curso não encontrado</body></html>';

  const modulesHtml = course.grade.map(mod => {
    const rows = mod.materias.map(m => `
      <tr>
        <td>${m.nome}${m.eletiva ? ' <span class="tag-eletiva">eletiva</span>' : ''}</td>
        <td class="center">${m.horas > 0 ? m.horas + 'h' : '—'}</td>
        <td class="center">${
          m.tipo === 'misto' ? 'Presencial + EAD'
          : m.tipo === 'ead' ? 'EAD'
          : 'Presencial'
        }</td>
      </tr>`).join('');

    return `
      <div class="module-block">
        <div class="module-header">
          <span class="module-title">${mod.titulo}</span>
          ${mod.periodo ? `<span class="module-period">${mod.periodo}</span>` : ''}
        </div>
        <table>
          <thead>
            <tr><th>Disciplina</th><th class="center">Carga Horária</th><th class="center">Modalidade</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  const badgeLabel = courseId === 'teologia-livre' ? 'Curso Livre de Teologia'
    : courseId === 'seteb' ? 'Seminário Básico de Teologia'
    : 'Curso Ministerial';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Grade Curricular — ${course.nomeCompleto}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Open+Sans:wght@400;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Open Sans', sans-serif;
    color: #1a1a2e;
    background: #fff;
  }

  /* === CAPA === */
  .cover {
    width: 210mm;
    min-height: 297mm;
    background: linear-gradient(145deg, #0d0d1a 0%, #1a0a0f 50%, #2a0a10 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 50px 40px;
    page-break-after: always;
    position: relative;
    overflow: hidden;
  }

  .cover::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image:
      linear-gradient(rgba(234,56,76,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(234,56,76,0.07) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .cover-inner { position: relative; z-index: 1; text-align: center; width: 100%; }

  .cover-logo-wrap {
    width: 90px; height: 90px;
    background: rgba(234,56,76,0.12);
    border: 2px solid rgba(234,56,76,0.5);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 28px;
  }

  .cover-logo-wrap img { width: 64px; height: 64px; object-fit: contain; }

  .cover-badge {
    display: inline-block;
    background: rgba(234,56,76,0.2);
    border: 1px solid rgba(234,56,76,0.4);
    color: #f87171;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding: 5px 16px;
    border-radius: 20px;
    margin-bottom: 22px;
  }

  .cover h1 {
    font-family: 'Merriweather', serif;
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    line-height: 1.3;
    margin-bottom: 10px;
  }

  .cover h1 span { color: #ea384c; }

  .cover-subtitle {
    font-size: 13px;
    color: rgba(255,255,255,0.55);
    margin-bottom: 40px;
    letter-spacing: 0.5px;
  }

  .cover-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    margin-top: 10px;
    text-align: left;
  }

  .info-item {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 14px 16px;
  }

  .info-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #ea384c;
    margin-bottom: 5px;
  }

  .info-value {
    font-size: 12px;
    color: rgba(255,255,255,0.85);
    font-weight: 600;
    line-height: 1.4;
  }

  .cover-requisito {
    margin-top: 28px;
    background: rgba(234,56,76,0.1);
    border-left: 3px solid #ea384c;
    padding: 10px 16px;
    border-radius: 4px;
    text-align: left;
  }

  .cover-requisito p { font-size: 11px; color: rgba(255,255,255,0.7); }
  .cover-requisito strong { color: #f87171; }

  .cover-footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.1);
    font-size: 10px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  /* === GRADE === */
  .grade-page {
    width: 210mm;
    padding: 20mm 18mm;
    background: #fff;
  }

  .grade-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 2px solid #ea384c;
    margin-bottom: 24px;
  }

  .grade-header-left h2 {
    font-family: 'Merriweather', serif;
    font-size: 18px;
    color: #1a0a0f;
  }

  .grade-header-left p {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
  }

  .grade-header-logo {
    width: 44px; height: 44px;
    object-fit: contain;
    opacity: 0.85;
  }

  .module-block { margin-bottom: 22px; }

  .module-header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    background: #1a0a0f;
    padding: 8px 12px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .module-title {
    font-size: 12px;
    font-weight: 700;
    color: #ea384c;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .module-period {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
  }

  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }

  th {
    background: #f5f5f5;
    color: #444;
    font-weight: 600;
    padding: 6px 10px;
    text-align: left;
    border-bottom: 1px solid #ddd;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 6px 10px;
    border-bottom: 1px solid #eee;
    color: #333;
    line-height: 1.4;
  }

  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #fdf5f5; }

  .center { text-align: center; }

  .tag-eletiva {
    display: inline-block;
    background: rgba(234,56,76,0.12);
    color: #c0202f;
    font-size: 9px;
    font-weight: 600;
    padding: 1px 6px;
    border-radius: 3px;
    vertical-align: middle;
    margin-left: 4px;
    text-transform: uppercase;
  }

  .grade-footer {
    margin-top: 28px;
    padding-top: 14px;
    border-top: 1px solid #eee;
    text-align: center;
    font-size: 10px;
    color: #888;
    line-height: 1.6;
  }

  .grade-footer strong { color: #ea384c; }

  .total-box {
    display: inline-block;
    background: #1a0a0f;
    color: #fff;
    font-size: 10px;
    padding: 6px 16px;
    border-radius: 4px;
    margin-bottom: 10px;
  }

  .total-box span { color: #ea384c; font-weight: 700; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cover { page-break-after: always; }
    .module-block { page-break-inside: avoid; }
  }
</style>
</head>
<body>

<!-- CAPA -->
<div class="cover">
  <div class="cover-inner">
    <div class="cover-logo-wrap">
      <img src="/logo_itec.png" alt="ITEC Logo" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\\'font-family:serif;font-size:32px;color:#ea384c;font-weight:bold\\'>✝</span>'" />
    </div>

    <div class="cover-badge">${badgeLabel}</div>

    <h1>
      ${course.nome === 'Teologia Livre'
        ? 'Graduação em <span>Teologia</span>'
        : course.nome === 'SETEB'
          ? '<span>SETEB</span> — Teologia Básica'
          : 'Curso Ministerial<br>para <span>Mulheres</span>'}
    </h1>
    <p class="cover-subtitle">Instituto Teológico de Educação Cristã — ITEC</p>

    <div class="cover-info">
      <div class="info-item">
        <div class="info-label">Duração</div>
        <div class="info-value">${course.duracao}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Horário</div>
        <div class="info-value">${course.horario}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Modalidade</div>
        <div class="info-value">${course.modalidade}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Carga Total</div>
        <div class="info-value">${course.totalHoras}</div>
      </div>
    </div>

    <div class="cover-requisito">
      <p><strong>Requisito:</strong> ${course.requisito}</p>
    </div>

    <div class="cover-footer">
      ITEC · Paulista-PE · itec.edu.br
    </div>
  </div>
</div>

<!-- GRADE CURRICULAR -->
<div class="grade-page">
  <div class="grade-header">
    <div class="grade-header-left">
      <h2>Grade Curricular</h2>
      <p>${course.nomeCompleto}${course.totalCreditos ? ' · ' + course.totalCreditos : ''}</p>
    </div>
    <img class="grade-header-logo" src="/logo_itec.png" alt="ITEC"
      onerror="this.style.display='none'" />
  </div>

  ${modulesHtml}

  ${course.totalHoras ? `<div style="text-align:center;margin-bottom:16px">
    <div class="total-box">Carga Horária Total: <span>${course.totalHoras}</span></div>
  </div>` : ''}

  <div class="grade-footer">
    <p>Para valores, matrículas e informações adicionais, entre em contato com a</p>
    <p><strong>Secretaria do ITEC</strong> — Instituto Teológico de Educação Cristã · Unidade Janga, Paulista-PE</p>
    <p style="margin-top:6px;font-size:9px;color:#aaa">Grade curricular sujeita a alterações. Documento gerado em ${new Date().toLocaleDateString('pt-BR')}.</p>
  </div>
</div>

</body>
</html>`;
}

export default {};
