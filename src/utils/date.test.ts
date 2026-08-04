import { describe, it, expect } from 'vitest';
import { formatDatePtBR, formatMesAnoPtBR, isDateOnly, parseDataLocal } from './date';

// BUG 15.1 — data exibia 1 dia a menos (fuso UTC-3).
// Os testes checam os componentes LOCAIS da data: com a âncora do meio-dia o
// resultado é o mesmo em qualquer fuso de ±12h, então não dependem do TZ da máquina.

describe('isDateOnly', () => {
  it('data pura YYYY-MM-DD → true',        () => expect(isDateOnly('1990-03-15')).toBe(true));
  it('timestamptz com hora/Z → false',     () => expect(isDateOnly('2026-08-02T12:00:00Z')).toBe(false));
  it('texto inválido → false',             () => expect(isDateOnly('15/03/1990')).toBe(false));
});

describe('parseDataLocal', () => {
  it('BUG 15.1: date-only NÃO recua 1 dia (ancora ao meio-dia local)', () => {
    const d = parseDataLocal('1990-03-15')!;
    expect(d.getFullYear()).toBe(1990);
    expect(d.getMonth()).toBe(2);   // 0-based → março
    expect(d.getDate()).toBe(15);   // ← antes vinha 14 em UTC-3
  });

  it('timestamptz continua com a conversão normal', () => {
    // meio-dia UTC: mesmo dia em UTC e em UTC-3 — determinístico
    const d = parseDataLocal('2026-08-02T12:00:00Z')!;
    expect(d.toISOString()).toBe('2026-08-02T12:00:00.000Z');
  });

  it('null / undefined / vazio → null', () => {
    expect(parseDataLocal(null)).toBeNull();
    expect(parseDataLocal(undefined)).toBeNull();
    expect(parseDataLocal('')).toBeNull();
    expect(parseDataLocal('   ')).toBeNull();
  });

  it('data inválida → null (nunca lança)', () => {
    expect(parseDataLocal('texto-invalido')).toBeNull();
  });
});

describe('formatDatePtBR', () => {
  it('BUG 15.1: data de nascimento exibe o dia digitado', () => {
    expect(formatDatePtBR('1990-03-15')).toBe('15/03/1990');
  });

  it('vencimento/pagamento (DATE) exibem o dia correto', () => {
    expect(formatDatePtBR('2026-08-01')).toBe('01/08/2026');
    expect(formatDatePtBR('2026-01-01')).toBe('01/01/2026');   // virada de ano
  });

  it('timestamptz permanece correto', () => {
    expect(formatDatePtBR('2026-08-02T12:00:00Z')).toBe('02/08/2026');
  });

  it('null / undefined / vazio → fallback', () => {
    expect(formatDatePtBR(null)).toBe('—');
    expect(formatDatePtBR(undefined)).toBe('—');
    expect(formatDatePtBR('')).toBe('—');
    expect(formatDatePtBR(null, '')).toBe('');
  });
});

describe('formatMesAnoPtBR', () => {
  it('YYYY-MM-DD → mês por extenso', () => {
    expect(formatMesAnoPtBR('2026-08-01')).toContain('2026');
    expect(formatMesAnoPtBR('2026-08-01').toLowerCase()).toContain('agosto');
  });
  it('YYYY-MM também funciona', () => {
    expect(formatMesAnoPtBR('2026-08').toLowerCase()).toContain('agosto');
  });
  it('vazio → fallback', () => expect(formatMesAnoPtBR(null)).toBe('—'));
});
