// Services existentes (Sprint A+B)
export * from './auth.service';
export * from './profile.service';
export * from './leads.service';
export * from './avisos.service';
export * from './dashboard.service';
export * from './cursos.service';
export * from './usuarios.service';
export * from './matriculas.service';

// Services Sprint D
// equipe.service — importar diretamente (evita conflito de ServiceResult no barrel)
export * from './academico.service';
export * from './professor.service';
export * from './frequencia.service';
export * from './matricula-academica.service';
export * from './financeiro.service';
export * from './material.service';

// Services Sprint I
// turmas.service — importar diretamente (ServiceResult ambíguo no barrel)

// Services Sprint J
export * from './notas.service';

// Services Sprint N
// calendario.service — importar diretamente (ServiceResult ambíguo no barrel)
