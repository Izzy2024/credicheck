import bcrypt from 'bcrypt';
import crypto from 'crypto';
import https from 'https';
import logger from './logger.util';

// Configuración para bcrypt
const SALT_ROUNDS = 12;

// Cache para contraseñas comprometidas (evita llamadas repetidas a la API)
const compromisedPasswordCache = new Map<string, boolean>();

// Clase para manejo de contraseñas
export class PasswordUtil {
  /**
   * Genera un hash de la contraseña usando bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      const hash = await bcrypt.hash(password, salt);
      return hash;
    } catch (error) {
      throw new Error('Error al generar hash de contraseña');
    }
  }

  /**
   * Verifica si una contraseña coincide con su hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new Error('Error al verificar contraseña');
    }
  }

  /**
   * Genera una contraseña temporal aleatoria
   */
  static generateTemporaryPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Asegurar que tenga al menos una mayúscula, minúscula, número y símbolo
    password += this.getRandomChar('abcdefghijklmnopqrstuvwxyz');
    password += this.getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    password += this.getRandomChar('0123456789');
    password += this.getRandomChar('!@#$%^&*');
    
    // Completar el resto de la longitud
    for (let i = 4; i < length; i++) {
      password += this.getRandomChar(charset);
    }
    
    // Mezclar los caracteres
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Obtiene un carácter aleatorio de un conjunto dado
   */
  private static getRandomChar(charset: string): string {
    const randomIndex = crypto.randomInt(0, charset.length);
    return charset.charAt(randomIndex);
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Longitud mínima
    if (password.length < 8) {
      feedback.push('La contraseña debe tener al menos 8 caracteres');
    } else {
      score += 1;
    }

    // Contiene minúsculas
    if (!/[a-z]/.test(password)) {
      feedback.push('La contraseña debe contener al menos una letra minúscula');
    } else {
      score += 1;
    }

    // Contiene mayúsculas
    if (!/[A-Z]/.test(password)) {
      feedback.push('La contraseña debe contener al menos una letra mayúscula');
    } else {
      score += 1;
    }

    // Contiene números
    if (!/\d/.test(password)) {
      feedback.push('La contraseña debe contener al menos un número');
    } else {
      score += 1;
    }

    // Contiene símbolos
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('La contraseña debe contener al menos un símbolo especial');
    } else {
      score += 1;
    }

    // Longitud adicional
    if (password.length >= 12) {
      score += 1;
    }

    // No contiene patrones comunes
    const commonPatterns = [
      /123456/,
      /\bpassword\b/i,
      /qwerty/i,
      /admin/i,
      /letmein/i,
    ];

    const hasCommonPattern = commonPatterns.some(pattern => pattern.test(password));
    if (hasCommonPattern) {
      feedback.push('La contraseña no debe contener patrones comunes');
      score -= 2;
    }

    // No debe ser muy repetitiva
    if (this.hasRepeatingChars(password)) {
      feedback.push('La contraseña no debe tener muchos caracteres repetidos');
      score -= 1;
    }

    const isValid = score >= 4 && feedback.length === 0;

    return {
      isValid,
      score: Math.max(0, Math.min(5, score)),
      feedback,
    };
  }

  /**
   * Verifica si la contraseña tiene demasiados caracteres repetidos
   */
  private static hasRepeatingChars(password: string): boolean {
    const charCount: { [key: string]: number } = {};
    
    for (const char of password) {
      charCount[char] = (charCount[char] || 0) + 1;
    }
    
    const maxRepeats = Math.floor(password.length / 3);
    return Object.values(charCount).some(count => count > maxRepeats);
  }

  /**
   * Genera un salt personalizado para operaciones específicas
   */
  static generateSalt(rounds: number = SALT_ROUNDS): Promise<string> {
    return bcrypt.genSalt(rounds);
  }

  /**
   * Hashea una contraseña con un salt específico
   */
  static async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    try {
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error('Error al generar hash con salt específico');
    }
  }

  /**
   * Genera un hash seguro para tokens de reset de contraseña
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Verifica si una contraseña ha sido comprometida usando HaveIBeenPwned API
   * Implementa k-anonymity: solo envía los primeros 5 caracteres del hash SHA1
   * https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
   */
  static async isPasswordCompromised(password: string): Promise<boolean> {
    const cacheKey = password.toLowerCase();
    
    // Verificar cache primero
    const cached = compromisedPasswordCache.get(cacheKey);
    if (cached !== undefined) {
      logger.debug('Password compromise check (cached)', { 
        password: cacheKey.substring(0, 3) + '...',
        compromised: cached 
      });
      return cached;
    }

    try {
      // Normalizar password (quitar espacios al inicio/final)
      const normalizedPassword = password.trim();
      
      // Crear hash SHA1 de la contraseña
      const hash = crypto.createHash('sha1').update(normalizedPassword).digest('hex').toUpperCase();
      
      // k-anonymity: solo enviar los primeros 5 caracteres
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);
      
      // Hacer request a HaveIBeenPwned API
      const response = await this.fetchHIBPAPI(prefix);
      
      // Buscar el suffix en la respuesta
      const lines = response.split('\n');
      for (const line of lines) {
        const [hashSuffix, countStr] = line.trim().split(':');
        if (hashSuffix === suffix) {
          const isCompromised = true;
          compromisedPasswordCache.set(cacheKey, isCompromised);
          const breachCount = countStr ? parseInt(countStr, 10) : 0;

          logger.warn('Contraseña comprometida encontrada', {
            passwordPrefix: normalizedPassword.substring(0, 3) + '...',
            breachCount,
            source: 'haveibeenpwned',
          });

          return true;
        }
      }
      
      // Password no está comprometida
      const isCompromised = false;
      compromisedPasswordCache.set(cacheKey, isCompromised);
      
      logger.debug('Contraseña no comprometida', {
        passwordPrefix: normalizedPassword.substring(0, 3) + '...',
        source: 'haveibeenpwned',
      });
      
      return false;
    } catch (error) {
      // En caso de error de red, hacer fallback a lista local
      logger.error('Error consultando HaveIBeenPwned API, usando fallback local', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return this.isPasswordCompromisedLocal(password);
    }
  }

  /**
   * Fetch a HaveIBeenPwned API con manejo de errores y User-Agent
   */
  private static fetchHIBPAPI(prefix: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.pwnedpasswords.com',
        port: 443,
        path: `/range/${prefix}`,
        method: 'GET',
        headers: {
          'User-Agent': 'CrediCheck-PasswordChecker/1.0',
          'Add-Padding': 'false',
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(data);
          } else {
            reject(new Error(`HIBP API error: ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('HIBP API timeout'));
      });

      req.end();
    });
  }

  /**
   * Verifica si una contraseña ha sido comprometida usando lista local (fallback)
   */
  static async isPasswordCompromisedLocal(password: string): Promise<boolean> {
    const normalizedPassword = password.toLowerCase().trim();
    
    // Lista básica de contraseñas comprometidas comunes
    const compromisedPasswords = [
      '123456',
      'password',
      '123456789',
      '12345678',
      '12345',
      '1234567',
      '1234567890',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
      'dragon',
      'master',
      'login',
      '12345678910',
      '123456789123',
      'iloveyou',
      'sunshine',
      'princess',
      'football',
      'baseball',
      'shadow',
      'superman',
      'michael',
      'trustno1',
      'passw0rd',
      'qwerty123',
      'colombia',
      'contraseña',
      'contrasena',
      'acceso123',
      'clave123',
      'seguridad123',
    ];

    return compromisedPasswords.includes(normalizedPassword);
  }

  /**
   * Limpia el cache de contraseñas comprometidas (para usar en tests o mantenimiento)
   */
  static clearCompromisedPasswordCache(): void {
    compromisedPasswordCache.clear();
    logger.debug('Compromised password cache cleared');
  }

  /**
   * Obtiene estadísticas del cache de contraseñas comprometidas
   */
  static getCacheStats(): { size: number; entries: number } {
    return {
      size: compromisedPasswordCache.size,
      entries: compromisedPasswordCache.size,
    };
  }

  /**
   * Calcula el tiempo estimado para crackear una contraseña
   */
  static estimateCrackTime(password: string): {
    seconds: number;
    humanReadable: string;
  } {
    const charset = this.getCharsetSize(password);
    const entropy = Math.log2(Math.pow(charset, password.length));
    
    // Asumiendo 1 billón de intentos por segundo
    const attemptsPerSecond = 1e12;
    const seconds = Math.pow(2, entropy - 1) / attemptsPerSecond;

    return {
      seconds,
      humanReadable: this.formatTime(seconds),
    };
  }

  /**
   * Obtiene el tamaño del conjunto de caracteres usado
   */
  private static getCharsetSize(password: string): number {
    let size = 0;
    
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) size += 32;
    
    return size;
  }

  /**
   * Formatea tiempo en segundos a formato legible
   */
  private static formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutos`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} horas`;
    if (seconds < 31536000) return `${Math.round(seconds / 86400)} días`;
    if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} años`;
    return 'más de 1000 años';
  }
}