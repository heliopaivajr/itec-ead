import { describe, it, expect } from 'vitest';
import { sanitizeDate } from './sanitize';

describe('sanitizeDate', () => {
  it('string vazia → null',      () => expect(sanitizeDate('')).toBeNull());
  it('null → null',              () => expect(sanitizeDate(null)).toBeNull());
  it('undefined → null',        () => expect(sanitizeDate(undefined)).toBeNull());
  it('ISO mantém como está',    () => expect(sanitizeDate('2000-03-15')).toBe('2000-03-15'));
  it('BR converte para ISO',    () => expect(sanitizeDate('15/03/2000')).toBe('2000-03-15'));
  it('formato inválido → null', () => expect(sanitizeDate('texto-invalido')).toBeNull());
});
