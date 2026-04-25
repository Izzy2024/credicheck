// Country configuration with phone codes and ID types
// Covers major Latin America, North America, Europe and key global countries

export interface CountryConfig {
  code: string;          // ISO 3166-1 alpha-2
  name: string;          // Display name in Spanish
  phoneCode: string;     // e.g. "+57", "+1"
  idTypes: IdTypeConfig[];
}

export interface IdTypeConfig {
  code: string;          // e.g. "CC", "SSN", "CURP"
  name: string;          // Display name in Spanish
  pattern: string;        // Regex pattern for validation
  example: string;       // Example format
}

export const COUNTRIES: CountryConfig[] = [
  // Latin America
  {
    code: "CO",
    name: "Colombia",
    phoneCode: "+57",
    idTypes: [
      { code: "CC", name: "Cédula de Ciudadanía", pattern: "^[0-9]{6,10}$", example: "12345678" },
      { code: "CE", name: "Cédula de Extranjería", pattern: "^[0-9]{6,12}$", example: "123456789" },
      { code: "TI", name: "Tarjeta de Identidad", pattern: "^[0-9]{10,11}$", example: "1234567890" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
      { code: "NIT", name: "NIT", pattern: "^[0-9]{9,10}$", example: "1234567890" },
    ],
  },
  {
    code: "MX",
    name: "México",
    phoneCode: "+52",
    idTypes: [
      { code: "CURP", name: "CURP", pattern: "^[A-Z]{4}[0-9]{6}[A-Z]{6}[0-9]{2}$", example: "GODE561231HTCLNR00" },
      { code: "RFC", name: "RFC", pattern: "^[A-Z]{3,4}[0-9]{6}[A-Z0-9]{3}$", example: "GODE560131123" },
      { code: "INE", name: "INE/IFE", pattern: "^[0-9]{13}$", example: "0000000000000" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PE",
    name: "Perú",
    phoneCode: "+51",
    idTypes: [
      { code: "DNI", name: "DNI", pattern: "^[0-9]{8}$", example: "12345678" },
      { code: "CE", name: "Carné de Extranjería", pattern: "^[0-9]{9,12}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "EC",
    name: "Ecuador",
    phoneCode: "+593",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{10}$", example: "1712345678" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "CL",
    name: "Chile",
    phoneCode: "+56",
    idTypes: [
      { code: "RUT", name: "RUT", pattern: "^[0-9]{7,8}-[0-9K]$", example: "12345678-5" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    phoneCode: "+54",
    idTypes: [
      { code: "DNI", name: "DNI", pattern: "^[0-9]{7,8}$", example: "12345678" },
      { code: "CUIL", name: "CUIL/CUIT", pattern: "^[0-9]{11}$", example: "20123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "VE",
    name: "Venezuela",
    phoneCode: "+58",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{6,10}$", example: "12345678" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PA",
    name: "Panamá",
    phoneCode: "+507",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{7,10}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "CR",
    name: "Costa Rica",
    phoneCode: "+506",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{9}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "DO",
    name: "República Dominicana",
    phoneCode: "+1",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{11}$", example: "12345678901" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "GT",
    name: "Guatemala",
    phoneCode: "+502",
    idTypes: [
      { code: "DPI", name: "DPI", pattern: "^[0-9]{13}$", example: "1234567890123" },
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{9,13}$", example: "1234567" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "HN",
    name: "Honduras",
    phoneCode: "+504",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{9,13}$", example: "123456789" },
      { code: "RTN", name: "RTN", pattern: "^[0-9]{14}$", example: "12345678901234" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "SV",
    name: "El Salvador",
    phoneCode: "+503",
    idTypes: [
      { code: "DUI", name: "DUI", pattern: "^[0-9]{9}$", example: "12345678-9" },
      { code: "NIT", name: "NIT", pattern: "^[0-9]{14}$", example: "12345678901234" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "NI",
    name: "Nicaragua",
    phoneCode: "+505",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{9,16}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "BO",
    name: "Bolivia",
    phoneCode: "+591",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{6,10}$", example: "12345678" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PY",
    name: "Paraguay",
    phoneCode: "+595",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{6,9}$", example: "1234567" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "UY",
    name: "Uruguay",
    phoneCode: "+598",
    idTypes: [
      { code: "CI", name: "Cédula de Identidad", pattern: "^[0-9]{8}$", example: "12345678" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "BR",
    name: "Brasil",
    phoneCode: "+55",
    idTypes: [
      { code: "CPF", name: "CPF", pattern: "^[0-9]{11}$", example: "12345678901" },
      { code: "CNPJ", name: "CNPJ", pattern: "^[0-9]{14}$", example: "12345678000199" },
      { code: "RG", name: "RG", pattern: "^[0-9]{6,10}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  // North America
  {
    code: "US",
    name: "Estados Unidos",
    phoneCode: "+1",
    idTypes: [
      { code: "SSN", name: "Social Security Number", pattern: "^[0-9]{9}$", example: "123456789" },
      { code: "DL", name: "Driver License", pattern: "^[A-Z0-9]{5,20}$", example: "ABC1234567" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "CA",
    name: "Canadá",
    phoneCode: "+1",
    idTypes: [
      { code: "SIN", name: "Social Insurance Number", pattern: "^[0-9]{9}$", example: "123456789" },
      { code: "DL", name: "Driver License", pattern: "^[A-Z0-9]{5,15}$", example: "ABC1234567" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  // Europe
  {
    code: "ES",
    name: "España",
    phoneCode: "+34",
    idTypes: [
      { code: "DNI", name: "DNI", pattern: "^[0-9]{8}[A-Z]$", example: "12345678M" },
      { code: "NIE", name: "NIE", pattern: "^[XYZ][0-9]{7}[A-Z]$", example: "X1234567L" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "GB",
    name: "Reino Unido",
    phoneCode: "+44",
    idTypes: [
      { code: "NINO", name: "National Insurance Number", pattern: "^[A-Z]{2}[0-9]{6}[A-Z]$", example: "AB123456C" },
      { code: "DL", name: "Driver License", pattern: "^[A-Z0-9]{16}$", example: "AB12345678901234" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "FR",
    name: "Francia",
    phoneCode: "+33",
    idTypes: [
      { code: "INSEE", name: "INSEE/NIR", pattern: "^[12][0-9]{12}$", example: "1234567890123" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "DE",
    name: "Alemania",
    phoneCode: "+49",
    idTypes: [
      { code: "ID", name: "Personalausweis", pattern: "^[CFGHJKLMNPRTVWXYZ0-9]{9}$", example: "L1000000L" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "IT",
    name: "Italia",
    phoneCode: "+39",
    idTypes: [
      { code: "CI", name: "Codice Fiscale", pattern: "^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$", example: "MRORSS25A41H501Z" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PT",
    name: "Portugal",
    phoneCode: "+351",
    idTypes: [
      { code: "CC", name: "Cartão de Cidadão", pattern: "^[0-9]{9}[A-Z0-9]{2}$", example: "12345678XX" },
      { code: "NIF", name: "NIF", pattern: "^[0-9]{9}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "NL",
    name: "Países Bajos",
    phoneCode: "+31",
    idTypes: [
      { code: "BSN", name: "BSN", pattern: "^[0-9]{8,9}$", example: "123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PL",
    name: "Polonia",
    phoneCode: "+48",
    idTypes: [
      { code: "PESEL", name: "PESEL", pattern: "^[0-9]{11}$", example: "12345678901" },
      { code: "DLC", name: "Driver License", pattern: "^[A-Z0-9]{8,12}$", example: "ABC123456" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  // Asia
  {
    code: "JP",
    name: "Japón",
    phoneCode: "+81",
    idTypes: [
      { code: "MyNumber", name: "My Number", pattern: "^[0-9]{12}$", example: "123456789012" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "CN",
    name: "China",
    phoneCode: "+86",
    idTypes: [
      { code: "ID", name: "ID Nacional", pattern: "^[0-9]{17}[0-9X]$", example: "12345678901234567X" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "IN",
    name: "India",
    phoneCode: "+91",
    idTypes: [
      { code: "AADHAAR", name: "Aadhaar", pattern: "^[0-9]{12}$", example: "123456789012" },
      { code: "PAN", name: "PAN", pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$", example: "ABCDE1234F" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "PH",
    name: "Filipinas",
    phoneCode: "+63",
    idTypes: [
      { code: "UMID", name: "UMID", pattern: "^[A-Z0-9]{12,15}$", example: "ABCD123456789" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  // Africa
  {
    code: "ZA",
    name: "Sudáfrica",
    phoneCode: "+27",
    idTypes: [
      { code: "SAID", name: "South African ID", pattern: "^[0-9]{13}$", example: "1234567890123" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  {
    code: "NG",
    name: "Nigeria",
    phoneCode: "+234",
    idTypes: [
      { code: "NIN", name: "NIN", pattern: "^[0-9]{11}$", example: "12345678901" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
  // Oceania
  {
    code: "AU",
    name: "Australia",
    phoneCode: "+61",
    idTypes: [
      { code: "TFN", name: "Tax File Number", pattern: "^[0-9]{8,9}$", example: "123456789" },
      { code: "DL", name: "Driver License", pattern: "^[0-9]{10}$", example: "1234567890" },
      { code: "PP", name: "Pasaporte", pattern: "^[A-Z0-9]{6,12}$", example: "AB123456" },
    ],
  },
];

// Lookup helpers
export const getCountry = (code: string): CountryConfig | undefined =>
  COUNTRIES.find((c) => c.code === code);

export const getIdTypesForCountry = (countryCode: string): IdTypeConfig[] =>
  getCountry(countryCode)?.idTypes || [];
