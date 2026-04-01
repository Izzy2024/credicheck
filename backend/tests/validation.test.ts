import {
  isValidEmail,
  isValidColombianPhone,
  isValidColombianCC,
  isValidColombianCE,
  isValidColombianTI,
  isValidPassport,
  isValidIdNumber,
  formatIdNumber,
  cleanIdNumber,
  isValidColombianDepartment,
  isValidColombianCity,
  isValidFullName,
  normalizeName,
  isValidDebtAmount,
  formatDebtAmount,
  isValidBirthDate,
  isValidDebtDate,
  isValidIPAddress,
  sanitizeText,
  isValidTextLength,
  getValidationErrorMessage,
  isValidPassword,
  getPasswordCriteria,
} from '../src/utils/validation.util';

describe('Validation Utilities', () => {
  describe('Email validation', () => {
    it('should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co')).toBe(true);
      expect(isValidEmail('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('Colombian phone validation', () => {
    it('should validate correct Colombian phones', () => {
      expect(isValidColombianPhone('3001234567')).toBe(true);
      expect(isValidColombianPhone('3109876543')).toBe(true);
      expect(isValidColombianPhone('3201122334')).toBe(true);
    });

    it('should reject invalid Colombian phones', () => {
      expect(isValidColombianPhone('300123456')).toBe(false); // Too short
      expect(isValidColombianPhone('30012345678')).toBe(false); // Too long
      expect(isValidColombianPhone('abc1234567')).toBe(false); // Contains letters
      expect(isValidColombianPhone('1234567890')).toBe(false); // Doesn't start with 3
    });
  });

  describe('Colombian CC validation', () => {
    it('should validate correct Colombian CCs', () => {
      expect(isValidColombianCC('1234567890')).toBe(true);
      expect(isValidColombianCC('123456')).toBe(true);
    });

    it('should reject invalid Colombian CCs', () => {
      expect(isValidColombianCC('12345')).toBe(false); // Too short
      expect(isValidColombianCC('12345678901')).toBe(false); // Too long
      expect(isValidColombianCC('abc123456')).toBe(false); // Contains letters
    });
  });

  describe('Colombian CE validation', () => {
    it('should validate correct Colombian CEs', () => {
      expect(isValidColombianCE('123456789012')).toBe(true);
      expect(isValidColombianCE('123456')).toBe(true);
    });

    it('should reject invalid Colombian CEs', () => {
      expect(isValidColombianCE('12345')).toBe(false); // Too short
      expect(isValidColombianCE('1234567890123')).toBe(false); // Too long
      expect(isValidColombianCE('abc123456789')).toBe(false); // Contains letters
    });
  });

  describe('Colombian TI validation', () => {
    it('should validate correct Colombian TIs', () => {
      expect(isValidColombianTI('12345678901')).toBe(true);
      expect(isValidColombianTI('1234567890')).toBe(true);
    });

    it('should reject invalid Colombian TIs', () => {
      expect(isValidColombianTI('123456789')).toBe(false); // Too short
      expect(isValidColombianTI('123456789012')).toBe(false); // Too long
      expect(isValidColombianTI('abc1234567')).toBe(false); // Contains letters
    });
  });

  describe('Passport validation', () => {
    it('should validate correct passports', () => {
      expect(isValidPassport('AB123456')).toBe(true);
      expect(isValidPassport('123456789ABC')).toBe(true);
      expect(isValidPassport('ab123456')).toBe(true); // Should work with lowercase
    });

    it('should reject invalid passports', () => {
      expect(isValidPassport('12345')).toBe(false); // Too short
      expect(isValidPassport('1234567890123')).toBe(false); // Too long
      expect(isValidPassport('AB-123456')).toBe(false); // Contains special characters
    });
  });

  describe('ID number validation by type', () => {
    it('should validate ID numbers correctly by type', () => {
      expect(isValidIdNumber('1234567890', 'CC')).toBe(true);
      expect(isValidIdNumber('123456789012', 'CE')).toBe(true);
      expect(isValidIdNumber('12345678901', 'TI')).toBe(true);
      expect(isValidIdNumber('AB123456', 'PP')).toBe(true);
    });

    it('should reject invalid ID numbers by type', () => {
      expect(isValidIdNumber('12345', 'CC')).toBe(false);
      expect(isValidIdNumber('12345', 'CE')).toBe(false);
      expect(isValidIdNumber('123456789', 'TI')).toBe(false);
      expect(isValidIdNumber('12345', 'PP')).toBe(false);
    });
  });

  describe('ID number formatting', () => {
    it('should format CC numbers with thousands separators', () => {
      expect(formatIdNumber('1234567890', 'CC')).toBe('1.234.567.890');
      expect(formatIdNumber('123456', 'CC')).toBe('123.456');
    });

    it('should format passport numbers in uppercase', () => {
      expect(formatIdNumber('ab123456', 'PP')).toBe('AB123456');
    });
  });

  describe('ID number cleaning', () => {
    it('should clean ID numbers correctly', () => {
      expect(cleanIdNumber('1.234.567.890')).toBe('1234567890');
      expect(cleanIdNumber('AB 123 456')).toBe('AB123456');
      expect(cleanIdNumber('ab123456')).toBe('AB123456');
    });
  });

  describe('Colombian department validation', () => {
    it('should validate correct Colombian departments', () => {
      expect(isValidColombianDepartment('Antioquia')).toBe(true);
      expect(isValidColombianDepartment('Cundinamarca')).toBe(true);
      expect(isValidColombianDepartment('Valle del Cauca')).toBe(true);
    });

    it('should reject invalid departments', () => {
      expect(isValidColombianDepartment('Invalid Department')).toBe(false);
      expect(isValidColombianDepartment('Texas')).toBe(false);
    });
  });

  describe('Colombian city validation', () => {
    it('should validate correct Colombian cities', () => {
      expect(isValidColombianCity('Bogotá')).toBe(true);
      expect(isValidColombianCity('Medellín')).toBe(true);
      expect(isValidColombianCity('Cali')).toBe(true);
    });

    it('should reject invalid cities', () => {
      expect(isValidColombianCity('Invalid City')).toBe(false);
      expect(isValidColombianCity('New York')).toBe(false);
    });
  });

  describe('Full name validation', () => {
    it('should validate correct full names', () => {
      expect(isValidFullName('Juan Pérez')).toBe(true);
      expect(isValidFullName('María Elena Gómez López')).toBe(true);
      expect(isValidFullName('José María de la Cruz')).toBe(true);
    });

    it('should reject invalid full names', () => {
      expect(isValidFullName('Juan')).toBe(false); // Single word
      expect(isValidFullName('Juan123')).toBe(false); // Contains numbers
      expect(isValidFullName('Juan@Pérez')).toBe(false); // Contains special characters
      expect(isValidFullName('')).toBe(false); // Empty
    });
  });

  describe('Name normalization', () => {
    it('should normalize names correctly', () => {
      expect(normalizeName('juan pérez')).toBe('Juan Pérez');
      expect(normalizeName('MARÍA ELENA')).toBe('María Elena');
      expect(normalizeName('josé maría de la cruz')).toBe('José María De La Cruz');
    });
  });

  describe('Debt amount validation', () => {
    it('should validate correct debt amounts', () => {
      expect(isValidDebtAmount(1000)).toBe(true);
      expect(isValidDebtAmount(999999999999)).toBe(true);
    });

    it('should reject invalid debt amounts', () => {
      expect(isValidDebtAmount(0)).toBe(false);
      expect(isValidDebtAmount(-1000)).toBe(false);
      expect(isValidDebtAmount(1000000000000)).toBe(false); // Too high
    });
  });

  describe('Debt amount formatting', () => {
    it('should format debt amounts correctly', () => {
      const result1 = formatDebtAmount(1000000);
      const result2 = formatDebtAmount(2500000);
      expect(result1).toContain('1.000.000');
      expect(result2).toContain('2.500.000');
      expect(result1).toContain('$');
      expect(result2).toContain('$');
    });
  });

  describe('Birth date validation', () => {
    it('should validate correct birth dates', () => {
      const validDate = new Date('1990-01-01');
      expect(isValidBirthDate(validDate)).toBe(true);
    });

    it('should reject invalid birth dates', () => {
      const tooRecent = new Date(); // Today
      const tooOld = new Date('1900-01-01');
      expect(isValidBirthDate(tooRecent)).toBe(false);
      expect(isValidBirthDate(tooOld)).toBe(false);
    });
  });

  describe('Debt date validation', () => {
    it('should validate correct debt dates', () => {
      const validDate = new Date('2023-01-01');
      expect(isValidDebtDate(validDate)).toBe(true);
    });

    it('should reject invalid debt dates', () => {
      const tooOld = new Date('1999-01-01');
      const future = new Date('2030-01-01');
      expect(isValidDebtDate(tooOld)).toBe(false);
      expect(isValidDebtDate(future)).toBe(false);
    });
  });

  describe('IP address validation', () => {
    it('should validate correct IP addresses', () => {
      expect(isValidIPAddress('192.168.1.1')).toBe(true);
      expect(isValidIPAddress('10.0.0.1')).toBe(true);
      expect(isValidIPAddress('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe(true);
    });

    it('should reject invalid IP addresses', () => {
      expect(isValidIPAddress('256.256.256.256')).toBe(false);
      expect(isValidIPAddress('192.168.1')).toBe(false);
      expect(isValidIPAddress('invalid-ip')).toBe(false);
    });
  });

  describe('Text sanitization', () => {
    it('should sanitize text correctly', () => {
      expect(sanitizeText('  Hello   World  ')).toBe('Hello World');
      expect(sanitizeText('Text with <script> tags')).toBe('Text with script tags');
      expect(sanitizeText('Normal text')).toBe('Normal text');
    });
  });

  describe('Text length validation', () => {
    it('should validate text length correctly', () => {
      expect(isValidTextLength('Hello', 3, 10)).toBe(true);
      expect(isValidTextLength('Hi', 3, 10)).toBe(false); // Too short
      expect(isValidTextLength('This is too long', 3, 10)).toBe(false); // Too long
    });
  });

  describe('Validation error messages', () => {
    it('should return correct error messages', () => {
      expect(getValidationErrorMessage('email', 'required')).toBe('El campo email es obligatorio');
      expect(getValidationErrorMessage('password', 'minLength', 8)).toBe('El campo password debe tener al menos 8 caracteres');
      expect(getValidationErrorMessage('field', 'unknown')).toBe('El campo field no es válido');
    });
  });

  describe('Password validation', () => {
    it('should validate correct passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('MySecure1')).toBe(true);
      expect(isValidPassword('Test@123')).toBe(true);
    });

    it('should reject invalid passwords', () => {
      expect(isValidPassword('password')).toBe(false); // No uppercase or number
      expect(isValidPassword('PASSWORD123')).toBe(false); // No lowercase
      expect(isValidPassword('Password')).toBe(false); // No number
      expect(isValidPassword('Pass1')).toBe(false); // Too short
    });
  });

  describe('Password criteria', () => {
    it('should return password criteria', () => {
      const criteria = getPasswordCriteria();
      expect(criteria).toHaveLength(5);
      expect(criteria[0]).toBe('Al menos 8 caracteres');
    });
  });
});