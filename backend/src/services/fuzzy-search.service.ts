import { prisma } from '../config/database.config';
import logger from '../utils/logger.util';

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * (número mínimo de ediciones necesarias para transformar un string en otro)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Inicializar matriz
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    if (matrix[0]) {
      matrix[0][j] = j;
    }
  }

  // Llenar matriz
  for (let i = 1; i <= len1; i++) {
    if (!matrix[i]) matrix[i] = [];
    const currentRow = matrix[i];
    if (!currentRow) continue;
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        currentRow[j] = matrix[i - 1]?.[j - 1] ?? 0;
      } else {
        currentRow[j] = Math.min(
          (matrix[i - 1]?.[j] ?? 0) + 1, // eliminación
          (currentRow[j - 1] ?? 0) + 1, // inserción
          (matrix[i - 1]?.[j - 1] ?? 0) + 1 // sustitución
        );
      }
    }
  }

  return matrix[len1]?.[len2] ?? 0;
}

/**
 * Calcula el porcentaje de similitud entre dos strings (0-1)
 */
function similarityScore(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  return 1 - distance / maxLen;
}

/**
 * Normaliza un nombre para búsqueda
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
    .trim();
}

/**
 * Normaliza un número de documento
 */
function normalizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

export interface FuzzySearchResult {
  id: string;
  fullName: string;
  idNumber: string;
  idType: string;
  debtAmount: number;
  debtStatus: string;
  city: string | null;
  creditorName: string;
  debtDate: Date;
  createdAt: Date;
  similarity: number; // 0-1
  matchReason: string; // Explica por qué coincide
}

/**
 * Realiza una búsqueda fuzzy por nombre
 */
export async function fuzzySearchByName(
  tenantId: string,
  searchTerm: string,
  threshold: number = 0.7 // Mínimo de similitud (0-1)
): Promise<FuzzySearchResult[]> {
  try {
    const normalizedSearch = normalizeName(searchTerm);

    // Obtener todas las referencias activas
    const allReferences = await prisma.creditReference.findMany({
      where: {
        deletedAt: null,
        tenantId,
      },
      select: {
        id: true,
        fullName: true,
        idNumber: true,
        idType: true,
        debtAmount: true,
        debtStatus: true,
        city: true,
        creditorName: true,
        debtDate: true,
        createdAt: true,
      },
    });

    // Calcular similitud y filtrar
    const results: FuzzySearchResult[] = [];

    for (const ref of allReferences) {
      const normalizedRefName = normalizeName(ref.fullName);
      const similarity = similarityScore(normalizedSearch, normalizedRefName);

      // También verificar coincidencia de palabras individuales
      const searchWords = normalizedSearch.split(/\s+/);
      const refWords = normalizedRefName.split(/\s+/);

      let wordMatchCount = 0;
      let maxWordSimilarity = 0;

      for (const searchWord of searchWords) {
        for (const refWord of refWords) {
          const wordSim = similarityScore(searchWord, refWord);
          maxWordSimilarity = Math.max(maxWordSimilarity, wordSim);
          if (wordSim >= 0.85) {
            wordMatchCount++;
            break;
          }
        }
      }

      const wordMatchRatio =
        searchWords.length > 0 ? wordMatchCount / searchWords.length : 0;
      const finalSimilarity = Math.max(
        similarity,
        wordMatchRatio,
        maxWordSimilarity
      );

      if (finalSimilarity >= threshold) {
        let matchReason = '';
        if (similarity >= threshold) {
          matchReason = `Nombre completo similar (${Math.round(similarity * 100)}%)`;
        } else if (wordMatchRatio >= threshold) {
          matchReason = `${wordMatchCount} de ${searchWords.length} palabras coinciden`;
        } else {
          matchReason = `Coincidencia parcial (${Math.round(maxWordSimilarity * 100)}%)`;
        }

        results.push({
          ...ref,
          debtAmount: Number(ref.debtAmount),
          similarity: finalSimilarity,
          matchReason,
        });
      }
    }

    // Ordenar por similitud (mayor primero)
    results.sort((a, b) => b.similarity - a.similarity);

    logger.info('Fuzzy search by name completed', {
      context: 'fuzzy_search_service',
      searchTerm,
      resultsCount: results.length,
      threshold,
    });

    return results;
  } catch (error) {
    logger.error('Error in fuzzy search by name', {
      context: 'fuzzy_search_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchTerm,
    });
    throw error;
  }
}

/**
 * Realiza una búsqueda fuzzy por número de documento
 */
export async function fuzzySearchById(
  tenantId: string,
  searchTerm: string,
  threshold: number = 0.8 // Más estricto para IDs
): Promise<FuzzySearchResult[]> {
  try {
    const normalizedSearch = normalizeId(searchTerm);

    // Obtener todas las referencias activas
    const allReferences = await prisma.creditReference.findMany({
      where: {
        deletedAt: null,
        tenantId,
      },
      select: {
        id: true,
        fullName: true,
        idNumber: true,
        idType: true,
        debtAmount: true,
        debtStatus: true,
        city: true,
        creditorName: true,
        debtDate: true,
        createdAt: true,
      },
    });

    // Calcular similitud y filtrar
    const results: FuzzySearchResult[] = [];

    for (const ref of allReferences) {
      const normalizedRefId = normalizeId(ref.idNumber);
      const similarity = similarityScore(normalizedSearch, normalizedRefId);

      // También verificar si el ID buscado es substring del ID de referencia (o viceversa)
      const isSubstring =
        normalizedRefId.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedRefId);

      const finalSimilarity = isSubstring
        ? Math.max(similarity, 0.85)
        : similarity;

      if (finalSimilarity >= threshold) {
        let matchReason = '';
        if (normalizedRefId === normalizedSearch) {
          matchReason = 'Coincidencia exacta';
        } else if (isSubstring) {
          matchReason = 'Coincidencia parcial del ID';
        } else {
          matchReason = `ID similar (${Math.round(similarity * 100)}%)`;
        }

        results.push({
          ...ref,
          debtAmount: Number(ref.debtAmount),
          similarity: finalSimilarity,
          matchReason,
        });
      }
    }

    // Ordenar por similitud (mayor primero)
    results.sort((a, b) => b.similarity - a.similarity);

    logger.info('Fuzzy search by ID completed', {
      context: 'fuzzy_search_service',
      searchTerm,
      resultsCount: results.length,
      threshold,
    });

    return results;
  } catch (error) {
    logger.error('Error in fuzzy search by ID', {
      context: 'fuzzy_search_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchTerm,
    });
    throw error;
  }
}

/**
 * Búsqueda fuzzy combinada (nombre y ID)
 */
export async function fuzzySearch(
  tenantId: string,
  searchTerm: string,
  searchType: 'name' | 'id' | 'both' = 'both',
  threshold?: number
): Promise<FuzzySearchResult[]> {
  try {
    let results: FuzzySearchResult[] = [];

    if (searchType === 'name' || searchType === 'both') {
      const nameResults = await fuzzySearchByName(tenantId, searchTerm, threshold);
      results = results.concat(nameResults);
    }

    if (searchType === 'id' || searchType === 'both') {
      const idResults = await fuzzySearchById(tenantId, searchTerm, threshold);
      results = results.concat(idResults);
    }

    // Eliminar duplicados (basados en ID)
    const uniqueResults = results.reduce(
      (acc: FuzzySearchResult[], current) => {
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        } else if (current.similarity > exists.similarity) {
          // Reemplazar si la nueva coincidencia es mejor
          const index = acc.findIndex(item => item.id === current.id);
          acc[index] = current;
        }
        return acc;
      },
      []
    );

    // Ordenar por similitud
    uniqueResults.sort((a, b) => b.similarity - a.similarity);

    return uniqueResults;
  } catch (error) {
    logger.error('Error in fuzzy search', {
      context: 'fuzzy_search_service',
      error: error instanceof Error ? error.message : 'Unknown error',
      searchTerm,
      searchType,
    });
    throw error;
  }
}
