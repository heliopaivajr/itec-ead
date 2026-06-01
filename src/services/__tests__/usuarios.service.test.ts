import { describe, it, expect } from 'vitest';
import { getRolesPermitidas } from '../usuarios.service';

describe('getRolesPermitidas', () => {

  describe('superadmin', () => {
    it('pode atribuir qualquer role, incluindo superadmin', () => {
      const roles = getRolesPermitidas('superadmin', 'pendente');
      expect(roles).toContain('superadmin');
      expect(roles).toContain('admin');
      expect(roles).toContain('aluno');
    });

    it('pode alterar um admin', () => {
      const roles = getRolesPermitidas('superadmin', 'admin');
      expect(roles).toContain('admin');
      expect(roles).toContain('superadmin');
    });
  });

  describe('admin', () => {
    it('pode promover professor para administracao', () => {
      const roles = getRolesPermitidas('admin', 'professor');
      expect(roles).toContain('administracao');
    });

    it('não pode alterar superadmin (retorna vazio)', () => {
      expect(getRolesPermitidas('admin', 'superadmin')).toEqual([]);
    });

    it('não inclui superadmin nas opções ao alterar admin', () => {
      const roles = getRolesPermitidas('admin', 'admin');
      expect(roles).not.toContain('superadmin');
    });
  });

  describe('administracao', () => {
    it('converte pendente → aluno ou professor', () => {
      expect(getRolesPermitidas('administracao', 'pendente')).toEqual(['aluno', 'professor']);
    });

    it('converte aluno → inativo, suspenso ou trancado', () => {
      expect(getRolesPermitidas('administracao', 'aluno')).toEqual(['inativo', 'suspenso', 'trancado']);
    });

    it('não pode alterar admin (retorna vazio)', () => {
      expect(getRolesPermitidas('administracao', 'admin')).toEqual([]);
    });

    it('não pode alterar superadmin (retorna vazio)', () => {
      expect(getRolesPermitidas('administracao', 'superadmin')).toEqual([]);
    });
  });

  describe('roles sem permissão de alterar', () => {
    it('professor não pode alterar ninguém (retorna vazio)', () => {
      expect(getRolesPermitidas('professor', 'aluno')).toEqual([]);
    });

    it('aluno não pode alterar ninguém (retorna vazio)', () => {
      expect(getRolesPermitidas('aluno', 'aluno')).toEqual([]);
    });
  });

});
