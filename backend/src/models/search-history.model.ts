import { SearchHistory as PrismaSearchHistoryModel } from '@prisma/client';

export type PrismaSearchHistory = PrismaSearchHistoryModel;

const normalizeSearchType = (value: string): 'NAME' | 'ID' | 'DOCUMENT' => {
  if (value === 'NAME' || value === 'ID' || value === 'DOCUMENT') {
    return value;
  }
  return 'DOCUMENT';
};

// Modelo TypeScript basado en Prisma
export interface SearchHistory {
  id: string;
  userId: string;
  searchType: 'NAME' | 'ID' | 'DOCUMENT';
  searchTerm: string;
  resultsCount: number;
  executionTimeMs: number;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

// Modelo para crear historial de búsqueda
export interface CreateSearchHistoryData {
  userId: string;
  searchType: 'NAME' | 'ID' | 'DOCUMENT';
  searchTerm: string;
  resultsCount: number;
  executionTimeMs: number;
  ipAddress: string;
  userAgent: string;
}

// Modelo para respuesta de historial de búsqueda con información del usuario
export interface SearchHistoryResponse extends SearchHistory {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Modelo para parámetros de búsqueda de historial
export interface SearchHistoryParams {
  userId?: string;
  searchType?: 'NAME' | 'ID' | 'DOCUMENT';
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Modelo para resultados de búsqueda de historial
export interface SearchHistoryResult {
  searches: SearchHistoryResponse[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Modelo para estadísticas de búsquedas
export interface SearchStats {
  total: number;
  byType: {
    name: number;
    id: number;
    document: number;
  };
  byUser: Array<{
    userId: string;
    userName: string;
    count: number;
  }>;
  averageExecutionTime: number;
  averageResultsCount: number;
  successRate: number; // Porcentaje de búsquedas con resultados > 0
}

// Modelo para estadísticas diarias
export interface DailySearchStats {
  date: string;
  totalSearches: number;
  uniqueUsers: number;
  averageExecutionTime: number;
  successfulSearches: number;
  successRate: number;
}

// Modelo para exportación de historial
export interface SearchHistoryExport {
  id: string;
  usuario: string;
  email: string;
  tipoBusqueda: string;
  terminoBusqueda: string;
  resultados: number;
  tiempoEjecucion: string;
  direccionIP: string;
  navegador: string;
  fecha: string;
}

// Función para convertir de Prisma SearchHistory a SearchHistory
export const toSearchHistory = (
  search: PrismaSearchHistory
): SearchHistory => ({
  id: search.id,
  userId: search.userId,
  searchType: normalizeSearchType(search.searchType),
  searchTerm: search.searchTerm,
  resultsCount: search.resultsCount,
  executionTimeMs: search.executionTimeMs,
  ipAddress: search.ipAddress,
  userAgent: search.userAgent,
  createdAt: search.createdAt,
});

// Función para obtener la descripción del tipo de búsqueda
export const getSearchTypeDescription = (
  searchType: 'NAME' | 'ID' | 'DOCUMENT'
): string => {
  const descriptions = {
    NAME: 'Por Nombre',
    ID: 'Por Cédula',
    DOCUMENT: 'Por Documento',
  };
  return descriptions[searchType];
};

// Función para formatear el tiempo de ejecución
export const formatExecutionTime = (timeMs: number): string => {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }
  return `${(timeMs / 1000).toFixed(2)}s`;
};

// Función para determinar si una búsqueda fue exitosa
export const isSuccessfulSearch = (search: SearchHistory): boolean => {
  return search.resultsCount > 0;
};

// Función para obtener información básica del navegador
export const getBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Desconocido';
};

// Función para obtener información del sistema operativo
export const getOSInfo = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Desconocido';
};

// Función para convertir a formato de exportación
export const toSearchHistoryExport = (
  search: SearchHistoryResponse
): SearchHistoryExport => ({
  id: search.id,
  usuario: `${search.user.firstName} ${search.user.lastName}`,
  email: search.user.email,
  tipoBusqueda: getSearchTypeDescription(search.searchType),
  terminoBusqueda: search.searchTerm,
  resultados: search.resultsCount,
  tiempoEjecucion: formatExecutionTime(search.executionTimeMs),
  direccionIP: search.ipAddress,
  navegador: getBrowserInfo(search.userAgent),
  fecha: search.createdAt.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }),
});

// Función para agrupar búsquedas por fecha
export const groupSearchesByDate = (
  searches: SearchHistory[]
): Record<string, SearchHistory[]> => {
  return searches.reduce(
    (groups, search) => {
      const date = search.createdAt.toISOString().split('T')[0];
      if (date) {
        if (!groups[date]) {
          groups[date] = [];
        }
        groups[date]!.push(search);
      }
      return groups;
    },
    {} as Record<string, SearchHistory[]>
  );
};

// Función para calcular estadísticas de un grupo de búsquedas
export const calculateSearchGroupStats = (
  searches: SearchHistory[]
): {
  total: number;
  successful: number;
  averageExecutionTime: number;
  averageResults: number;
} => {
  const total = searches.length;
  const successful = searches.filter(isSuccessfulSearch).length;
  const totalExecutionTime = searches.reduce(
    (sum, search) => sum + search.executionTimeMs,
    0
  );
  const totalResults = searches.reduce(
    (sum, search) => sum + search.resultsCount,
    0
  );

  return {
    total,
    successful,
    averageExecutionTime: total > 0 ? totalExecutionTime / total : 0,
    averageResults: total > 0 ? totalResults / total : 0,
  };
};
