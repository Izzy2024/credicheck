// Utilidades de validación para datos colombianos

// Expresiones regulares para validación
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const PHONE_REGEX = /^3[0-9]{9}$/; // Teléfonos colombianos de 10 dígitos que empiecen con 3
const CC_REGEX = /^[0-9]{6,10}$/; // Cédula de ciudadanía: 6-10 dígitos
const CE_REGEX = /^[0-9]{6,12}$/; // Cédula de extranjería: 6-12 dígitos
const TI_REGEX = /^[0-9]{10,11}$/; // Tarjeta de identidad: 10-11 dígitos
const PP_REGEX = /^[A-Z0-9]{6,12}$/; // Pasaporte: 6-12 caracteres alfanuméricos

// Departamentos de Colombia
export const COLOMBIAN_DEPARTMENTS = [
  'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar', 'Boyacá',
  'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba',
  'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena',
  'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
  'Vaupés', 'Vichada'
] as const;

// Principales ciudades de Colombia
export const COLOMBIAN_CITIES = [
  'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 'Cúcuta',
  'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué', 'Pasto', 'Manizales',
  'Neiva', 'Villavicencio', 'Armenia', 'Valledupar', 'Montería', 'Sincelejo',
  'Popayán', 'Tunja', 'Florencia', 'Riohacha', 'Yopal', 'Quibdó',
  'Mocoa', 'San Andrés', 'Leticia', 'Mitú', 'Puerto Carreño', 'Inírida',
  'Puerto Inírida'
] as const;

// Función para validar email
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

// Función para validar teléfono colombiano
export const isValidColombianPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

// Función para validar cédula de ciudadanía colombiana
export const isValidColombianCC = (cc: string): boolean => {
  // Por simplicidad, solo validamos el formato por ahora
  // En producción se podría implementar el algoritmo completo de validación
  return CC_REGEX.test(cc);
};

// Función para validar cédula de extranjería
export const isValidColombianCE = (ce: string): boolean => {
  return CE_REGEX.test(ce);
};

// Función para validar tarjeta de identidad
export const isValidColombianTI = (ti: string): boolean => {
  return TI_REGEX.test(ti);
};

// Función para validar pasaporte
export const isValidPassport = (passport: string): boolean => {
  return PP_REGEX.test(passport.toUpperCase());
};

// Función para validar ID según el tipo
export const isValidIdNumber = (idNumber: string, idType: 'CC' | 'CE' | 'TI' | 'PP'): boolean => {
  switch (idType) {
    case 'CC':
      return isValidColombianCC(idNumber);
    case 'CE':
      return isValidColombianCE(idNumber);
    case 'TI':
      return isValidColombianTI(idNumber);
    case 'PP':
      return isValidPassport(idNumber);
    default:
      return false;
  }
};

// Función para formatear número de cédula
export const formatIdNumber = (idNumber: string, idType: 'CC' | 'CE' | 'TI' | 'PP'): string => {
  if (idType === 'PP') {
    return idNumber.toUpperCase();
  }
  
  // Para números, agregar puntos como separadores de miles
  const number = parseInt(idNumber, 10);
  return number.toLocaleString('es-CO');
};

// Función para limpiar número de ID (remover puntos y espacios)
export const cleanIdNumber = (idNumber: string): string => {
  return idNumber.replace(/[.\s]/g, '').toUpperCase();
};

// Función para validar departamento colombiano
export const isValidColombianDepartment = (department: string): boolean => {
  return COLOMBIAN_DEPARTMENTS.includes(department as any);
};

// Función para validar ciudad colombiana
export const isValidColombianCity = (city: string): boolean => {
  return COLOMBIAN_CITIES.includes(city as any);
};

// Función para validar nombre completo
export const isValidFullName = (name: string): boolean => {
  // Al menos 2 palabras, solo letras, espacios, acentos y algunos caracteres especiales
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,}$/;
  const words = name.trim().split(/\s+/);
  return nameRegex.test(name) && words.length >= 2 && words.length <= 10;
};

// Función para normalizar nombre (capitalizar correctamente)
export const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Función para validar monto de deuda
export const isValidDebtAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 999999999999; // Máximo 999 billones
};

// Función para formatear monto de deuda
export const formatDebtAmount = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para validar fecha de nacimiento
export const isValidBirthDate = (date: Date): boolean => {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, 0, 1); // Máximo 120 años
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()); // Mínimo 18 años
  
  return date >= minDate && date <= maxDate;
};

// Función para validar fecha de deuda
export const isValidDebtDate = (date: Date): boolean => {
  const today = new Date();
  const minDate = new Date(2000, 0, 1); // Desde el año 2000
  
  return date >= minDate && date <= today;
};

// Función para validar dirección IP
export const isValidIPAddress = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
};

// Función para sanitizar entrada de texto
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios por uno solo
    .replace(/[<>]/g, ''); // Remover caracteres potencialmente peligrosos
};

// Función para validar longitud de texto
export const isValidTextLength = (text: string, min: number, max: number): boolean => {
  const length = text.trim().length;
  return length >= min && length <= max;
};

// Función para generar mensaje de error personalizado
export const getValidationErrorMessage = (field: string, rule: string, value?: any): string => {
  const messages: Record<string, string> = {
    required: `El campo ${field} es obligatorio`,
    email: `El campo ${field} debe ser un email válido`,
    phone: `El campo ${field} debe ser un teléfono colombiano válido (10 dígitos)`,
    idNumber: `El número de identificación no es válido para el tipo seleccionado`,
    fullName: `El nombre completo debe tener al menos 2 palabras y solo contener letras`,
    debtAmount: `El monto de la deuda debe ser mayor a 0`,
    birthDate: `La fecha de nacimiento debe ser válida (persona mayor de 18 años)`,
    debtDate: `La fecha de la deuda debe ser válida (desde el año 2000 hasta hoy)`,
    department: `El departamento debe ser válido para Colombia`,
    city: `La ciudad debe ser válida para Colombia`,
    minLength: `El campo ${field} debe tener al menos ${value} caracteres`,
    maxLength: `El campo ${field} no puede tener más de ${value} caracteres`,
  };
  
  return messages[rule] || `El campo ${field} no es válido`;
};

// Validacion de telefono flexible (acepta con o sin codigo de pais)
export const isValidPhone = (phone: string): boolean => {
  // Acepta: 3001234567, +573001234567, 573001234567, +1 2345678901, etc.
  // Remove spaces, dashes
  const cleaned = phone.replace(/[\s\-()]/g, '');
  // Should have between 7 and 15 digits
  const digitsOnly = cleaned.replace(/^\+?/, '');
  if (!/^\d{7,15}$/.test(digitsOnly)) return false;
  return true;
};

export const normalizePhone = (phone: string): string => {
  // Keep only digits and leading +
  return phone.replace(/[^\d+]/g, '');
};

// Re-export country config helpers for use elsewhere
export { COUNTRIES, getCountry, getIdTypesForCountry, validateIdNumber } from '../config/countries.config';

// Función para validar contraseña segura
export const isValidPassword = (password: string): boolean => {
  // Al menos 8 caracteres, una mayúscula, una minúscula, un número
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Función para obtener criterios de contraseña
export const getPasswordCriteria = (): string[] => {
  return [
    'Al menos 8 caracteres',
    'Al menos una letra mayúscula',
    'Al menos una letra minúscula',
    'Al menos un número',
    'Puede incluir caracteres especiales (@$!%*?&)',
  ];
};