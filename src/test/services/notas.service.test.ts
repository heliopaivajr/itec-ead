import { describe, it, expect } from 'vitest';
import { calcularStatus } from '@/services/notas.service';

describe('calcularStatus — regras de negócio aprovadas (Hélio, 2026-05-28)', () => {
  // Casos-limite de APROVAÇÃO
  it('média 7.0 + frequência 75 → aprovado', () => {
    expect(calcularStatus(7.0, 75)).toBe('aprovado');
  });

  it('média 10 + frequência 100 → aprovado', () => {
    expect(calcularStatus(10, 100)).toBe('aprovado');
  });

  it('média 7.0 + frequência 76 → aprovado', () => {
    expect(calcularStatus(7.0, 76)).toBe('aprovado');
  });

  // Casos-limite de RECUPERAÇÃO
  it('média 6.9 + frequência 75 → recuperacao', () => {
    expect(calcularStatus(6.9, 75)).toBe('recuperacao');
  });

  it('média 5.0 + frequência 75 → recuperacao', () => {
    expect(calcularStatus(5.0, 75)).toBe('recuperacao');
  });

  it('média 5.0 + frequência 100 → recuperacao', () => {
    expect(calcularStatus(5.0, 100)).toBe('recuperacao');
  });

  // Casos-limite de REPROVADO POR NOTA
  it('média 4.9 + frequência 100 → reprovado_nota', () => {
    expect(calcularStatus(4.9, 100)).toBe('reprovado_nota');
  });

  it('média 0 + frequência 100 → reprovado_nota', () => {
    expect(calcularStatus(0, 100)).toBe('reprovado_nota');
  });

  // Casos-limite de REPROVADO POR FALTA
  it('frequência 74.9 + nota 10 → reprovado_falta (falta independe da nota)', () => {
    expect(calcularStatus(10, 74.9)).toBe('reprovado_falta');
  });

  it('frequência 74 + nota 10 → reprovado_falta', () => {
    expect(calcularStatus(10, 74)).toBe('reprovado_falta');
  });

  it('frequência 0 + nota 10 → reprovado_falta', () => {
    expect(calcularStatus(10, 0)).toBe('reprovado_falta');
  });

  it('frequência 74.9 + nota 7.0 → reprovado_falta (falta tem prioridade sobre aprovação)', () => {
    expect(calcularStatus(7.0, 74.9)).toBe('reprovado_falta');
  });

  it('frequência 74.9 + nota 5.0 → reprovado_falta (não recuperação)', () => {
    expect(calcularStatus(5.0, 74.9)).toBe('reprovado_falta');
  });

  // Caso SEM NOTAS
  it('média null → cursando (notas ainda não lançadas)', () => {
    expect(calcularStatus(null, 100)).toBe('cursando');
  });

  it('média null + frequência 0 → cursando (frequência só importa com nota)', () => {
    expect(calcularStatus(null, 0)).toBe('cursando');
  });
});
