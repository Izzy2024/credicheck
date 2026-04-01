import { PasswordUtil } from '../src/utils/password.util';
import bcrypt from 'bcrypt';

describe('PasswordUtil', () => {
  const testPassword = 'TestPassword123!';
  const weakPassword = '123456';
  const strongPassword = 'MyStr0ng!P@ssw0rd2024';

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const hash = await PasswordUtil.hashPassword(testPassword);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await PasswordUtil.hashPassword(testPassword);
      const hash2 = await PasswordUtil.hashPassword(testPassword);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hash = await PasswordUtil.hashPassword('');
      expect(typeof hash).toBe('string');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await PasswordUtil.hashPassword(testPassword);
      const isValid = await PasswordUtil.verifyPassword(testPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await PasswordUtil.hashPassword(testPassword);
      const isValid = await PasswordUtil.verifyPassword('wrongpassword', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const hash = await PasswordUtil.hashPassword('');
      const isValid = await PasswordUtil.verifyPassword('', hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('generateTemporaryPassword', () => {
    it('should generate password with default length', () => {
      const tempPassword = PasswordUtil.generateTemporaryPassword();
      
      expect(typeof tempPassword).toBe('string');
      expect(tempPassword.length).toBe(12);
    });

    it('should generate password with custom length', () => {
      const length = 16;
      const tempPassword = PasswordUtil.generateTemporaryPassword(length);
      
      expect(tempPassword.length).toBe(length);
    });

    it('should generate different passwords each time', () => {
      const password1 = PasswordUtil.generateTemporaryPassword();
      const password2 = PasswordUtil.generateTemporaryPassword();
      
      expect(password1).not.toBe(password2);
    });

    it('should include required character types', () => {
      const tempPassword = PasswordUtil.generateTemporaryPassword(20);
      
      expect(/[a-z]/.test(tempPassword)).toBe(true); // lowercase
      expect(/[A-Z]/.test(tempPassword)).toBe(true); // uppercase
      expect(/\d/.test(tempPassword)).toBe(true); // digit
      expect(/[!@#$%^&*]/.test(tempPassword)).toBe(true); // symbol
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = PasswordUtil.validatePasswordStrength(strongPassword);
      
      expect(result.isValid).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(4);
      expect(result.feedback).toHaveLength(0);
    });

    it('should reject weak password', () => {
      const result = PasswordUtil.validatePasswordStrength(weakPassword);
      
      expect(result.isValid).toBe(false);
      expect(result.score).toBeLessThan(4);
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    it('should provide feedback for missing requirements', () => {
      const result = PasswordUtil.validatePasswordStrength('short');
      
      expect(result.feedback).toContain('La contraseña debe tener al menos 8 caracteres');
      expect(result.feedback).toContain('La contraseña debe contener al menos una letra mayúscula');
      expect(result.feedback).toContain('La contraseña debe contener al menos un número');
      expect(result.feedback).toContain('La contraseña debe contener al menos un símbolo especial');
    });

    it('should detect common patterns', () => {
      const result = PasswordUtil.validatePasswordStrength('Password123456');
      
      expect(result.feedback.some(f => f.includes('patrones comunes'))).toBe(true);
    });

    it('should detect repetitive characters', () => {
      const result = PasswordUtil.validatePasswordStrength('Aaaaaaa1!');
      
      expect(result.feedback.some(f => f.includes('caracteres repetidos'))).toBe(true);
    });

    it('should give bonus for longer passwords', () => {
      const shortResult = PasswordUtil.validatePasswordStrength('Test123!');
      const longResult = PasswordUtil.validatePasswordStrength('TestPassword123!');
      
      expect(longResult.score).toBeGreaterThanOrEqual(shortResult.score);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with default rounds', async () => {
      const salt = await PasswordUtil.generateSalt();
      
      expect(typeof salt).toBe('string');
      expect(salt.startsWith('$2b$12$')).toBe(true); // bcrypt format with 12 rounds
    });

    it('should generate salt with custom rounds', async () => {
      const rounds = 10;
      const salt = await PasswordUtil.generateSalt(rounds);
      
      expect(salt.startsWith(`$2b$${rounds}$`)).toBe(true);
    });
  });

  describe('hashPasswordWithSalt', () => {
    it('should hash password with provided salt', async () => {
      const salt = await PasswordUtil.generateSalt();
      const hash = await PasswordUtil.hashPasswordWithSalt(testPassword, salt);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(testPassword);
      
      // Verificar que el hash es válido
      const isValid = await bcrypt.compare(testPassword, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate secure token with default length', () => {
      const token = PasswordUtil.generateSecureToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
    });

    it('should generate secure token with custom length', () => {
      const length = 16;
      const token = PasswordUtil.generateSecureToken(length);
      
      expect(token.length).toBe(length * 2); // hex encoding doubles length
    });

    it('should generate different tokens each time', () => {
      const token1 = PasswordUtil.generateSecureToken();
      const token2 = PasswordUtil.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should generate only hex characters', () => {
      const token = PasswordUtil.generateSecureToken();
      
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });
  });

  describe('isPasswordCompromised', () => {
    it('should detect common compromised passwords', async () => {
      const compromisedPasswords = ['123456', 'password', 'qwerty', 'admin'];
      
      for (const password of compromisedPasswords) {
        const isCompromised = await PasswordUtil.isPasswordCompromised(password);
        expect(isCompromised).toBe(true);
      }
    });

    it('should not flag strong unique passwords', async () => {
      const uniquePassword = 'MyUn1qu3!P@ssw0rd2024';
      const isCompromised = await PasswordUtil.isPasswordCompromised(uniquePassword);
      
      expect(isCompromised).toBe(false);
    });

    it('should be case insensitive', async () => {
      const isCompromised = await PasswordUtil.isPasswordCompromised('PASSWORD');
      expect(isCompromised).toBe(true);
    });
  });

  describe('estimateCrackTime', () => {
    it('should estimate crack time for weak password', () => {
      const result = PasswordUtil.estimateCrackTime('123456');
      
      expect(result.seconds).toBeGreaterThan(0);
      expect(typeof result.humanReadable).toBe('string');
      expect(result.humanReadable).toMatch(/(segundos|minutos|horas|días)/);
    });

    it('should estimate longer crack time for strong password', () => {
      const weakResult = PasswordUtil.estimateCrackTime('123456');
      const strongResult = PasswordUtil.estimateCrackTime(strongPassword);
      
      expect(strongResult.seconds).toBeGreaterThan(weakResult.seconds);
    });

    it('should format time correctly', () => {
      const shortResult = PasswordUtil.estimateCrackTime('12');
      const longResult = PasswordUtil.estimateCrackTime(strongPassword);
      
      expect(shortResult.humanReadable).toMatch(/(segundos|minutos)/);
      expect(longResult.humanReadable).toMatch(/(años|más de)/);
    });
  });

  describe('integration tests', () => {
    it('should complete full password lifecycle', async () => {
      // Generar contraseña temporal
      const tempPassword = PasswordUtil.generateTemporaryPassword();
      
      // Validar fortaleza
      const strength = PasswordUtil.validatePasswordStrength(tempPassword);
      expect(strength.isValid).toBe(true);
      
      // Hash de la contraseña
      const hash = await PasswordUtil.hashPassword(tempPassword);
      
      // Verificar contraseña
      const isValid = await PasswordUtil.verifyPassword(tempPassword, hash);
      expect(isValid).toBe(true);
      
      // Verificar que contraseña incorrecta falla
      const isInvalid = await PasswordUtil.verifyPassword('wrongpassword', hash);
      expect(isInvalid).toBe(false);
    });

    it('should handle password change scenario', async () => {
      const oldPassword = 'OldPassword123!';
      const newPassword = 'NewPassword456@';
      
      // Hash contraseña antigua
      const oldHash = await PasswordUtil.hashPassword(oldPassword);
      
      // Verificar contraseña antigua
      const oldIsValid = await PasswordUtil.verifyPassword(oldPassword, oldHash);
      expect(oldIsValid).toBe(true);
      
      // Validar nueva contraseña
      const newStrength = PasswordUtil.validatePasswordStrength(newPassword);
      expect(newStrength.isValid).toBe(true);
      
      // Hash nueva contraseña
      const newHash = await PasswordUtil.hashPassword(newPassword);
      
      // Verificar que los hashes son diferentes
      expect(newHash).not.toBe(oldHash);
      
      // Verificar nueva contraseña
      const newIsValid = await PasswordUtil.verifyPassword(newPassword, newHash);
      expect(newIsValid).toBe(true);
      
      // Verificar que contraseña antigua no funciona con nuevo hash
      const oldWithNewHash = await PasswordUtil.verifyPassword(oldPassword, newHash);
      expect(oldWithNewHash).toBe(false);
    });
  });
});